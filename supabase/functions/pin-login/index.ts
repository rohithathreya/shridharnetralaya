import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

async function deriveServicePassword(secret: string, role: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`shridhar-netralaya-auth-v1:${role}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `SN_${hex.slice(0, 40)}!`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pin, requestedTier } = await req.json();

    if (!pin || typeof pin !== 'string') {
      return jsonResponse({ error: 'Access code is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Verify PIN securely against bcrypt hash in Postgres
    const { data: verifiedRole, error: rpcError } = await adminClient.rpc('verify_clinic_pin', {
      p_pin: pin.trim(),
    });

    if (rpcError) {
      console.error('verify_clinic_pin error:', rpcError);
      return jsonResponse({ error: 'Authentication service error' }, 500);
    }

    if (!verifiedRole) {
      return jsonResponse({ error: 'Incorrect access code' }, 401);
    }

    if (requestedTier === 'admin' && verifiedRole !== 'admin') {
      return jsonResponse({ error: 'Admin access code is required for this section' }, 403);
    }

    // 2. Self-bootstrapping internal auth user for the verified role
    const email = `${verifiedRole}@shridharnetralaya.internal`;
    const password = await deriveServicePassword(serviceRoleKey, verifiedRole);

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let signInRes = await authClient.auth.signInWithPassword({ email, password });

    if (
      !signInRes.error &&
      signInRes.data.user &&
      signInRes.data.user.app_metadata?.clinic_role !== verifiedRole
    ) {
      await adminClient.auth.admin.updateUserById(signInRes.data.user.id, {
        app_metadata: { clinic_role: verifiedRole },
        password,
      });
      signInRes = await authClient.auth.signInWithPassword({ email, password });
    }

    if (signInRes.error) {
      // First login ever (or key rotated): create or update the internal role user
      const { data: usersPage } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 50 });
      const existing = usersPage?.users?.find((u) => u.email === email);

      if (existing) {
        await adminClient.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          app_metadata: { clinic_role: verifiedRole },
        });
      } else {
        const { error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { clinic_role: verifiedRole },
        });
        if (createErr) {
          console.error('createUser error:', createErr);
          return jsonResponse({ error: 'Failed to provision role session' }, 500);
        }
      }

      signInRes = await authClient.auth.signInWithPassword({ email, password });
      if (signInRes.error || !signInRes.data.session) {
        console.error('second signIn error:', signInRes.error);
        return jsonResponse({ error: 'Failed to establish session' }, 500);
      }
    }

    const { access_token, refresh_token } = signInRes.data.session!;
    return jsonResponse({
      role: verifiedRole,
      session: { access_token, refresh_token },
    });
  } catch (err) {
    console.error('pin-login unhandled error:', err);
    return jsonResponse({ error: 'Invalid request' }, 400);
  }
});
