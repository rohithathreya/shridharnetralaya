import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../lib/supabase';
import type { ClinicRole, ClinicSettings } from '../types/database';
import { DEFAULT_CLINIC_SETTINGS } from '../types/database';

interface AuthContextValue {
  role: ClinicRole;
  loading: boolean;
  clinic: ClinicSettings;
  refreshClinic: () => Promise<void>;
  loginWithPin: (pin: string, requestedTier: 'staff' | 'admin') => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const CLINIC_CACHE_KEY = 'sn_clinic_settings_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<ClinicRole>(null);
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<ClinicSettings>(() => {
    try {
      const cached = localStorage.getItem(CLINIC_CACHE_KEY);
      if (cached) return { ...DEFAULT_CLINIC_SETTINGS, ...JSON.parse(cached) };
    } catch {
      // ignore storage errors
    }
    return DEFAULT_CLINIC_SETTINGS;
  });

  const refreshClinic = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from('clinic_settings').select('*').eq('id', 1).maybeSingle();
    if (!error && data) {
      setClinic(data as ClinicSettings);
      try {
        localStorage.setItem(CLINIC_CACHE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await refreshClinic();
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const r = (data.session?.user?.app_metadata?.clinic_role as ClinicRole) || null;
      if (mounted) {
        setRole(r);
        setLoading(false);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const r = (session?.user?.app_metadata?.clinic_role as ClinicRole) || null;
      setRole(r);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshClinic]);

  const loginWithPin = useCallback(async (pin: string, requestedTier: 'staff' | 'admin') => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase environment variables are not configured yet.' };
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/pin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ pin: pin.trim(), requestedTier }),
      });

      const payload = await res.json();
      if (!res.ok) {
        return { ok: false, error: payload.error || 'Access denied' };
      }

      const { error: sessErr } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });

      if (sessErr) {
        return { ok: false, error: sessErr.message };
      }

      setRole(payload.role as ClinicRole);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'Network error connecting to clinic server. Check internet connection.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ role, loading, clinic, refreshClinic, loginWithPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
