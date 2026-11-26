import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const OPENROUTER_MODEL = 'google/gemini-2.5-flash';

const BILL_HEADS = [
  'Bed charges',
  'Nursing charges',
  'Asst charges',
  'Professional charges',
  'Intra ocular lens',
  'Anesthetist',
  'Anesthesia',
  'OT charges',
  'OT drugs and implants',
  'Others',
] as const;

const INVOICE_SYSTEM_PROMPT = `You extract core billing intent for Shridhar Netralaya (Magadi, Karnataka) from a staff voice note (English/Kannada/Kanglish).
The app will automatically look up catalog prices and split procedures across the 10 bill heads — DO NOT guess or invent catalog prices.

Return ONE compact JSON object:
{
  "procedures": [{"name": "exact catalog name", "qty": 1, "price_override": null}],
  "head_charges": [{"head": "exact name from 10 heads below", "amount": 0}],
  "discount": 0,
  "payment_mode": "Cash" | "UPI" | "Card" | "TPA / Scheme" | "",
  "payment_ref": "",
  "notes": "",
  "warnings": []
}

VALID 10 BILL HEADS:
${BILL_HEADS.map((h, i) => `${i + 1}. ${h}`).join('\n')}

RULES:
1. Match spoken services/procedures to the CATALOG NAMES list and put them in "procedures". Leave "price_override" as null UNLESS the speaker explicitly states a custom price for that procedure.
2. Only use "head_charges" if the speaker explicitly dictates an amount for a specific bill head (e.g. "bed charges 1000, IOL 4500"). Never duplicate a procedure in both.
3. Extract discount (INR), payment_mode, payment_ref, and notes only if spoken.`;

const DISCHARGE_SYSTEM_PROMPT = `You extract core clinical intent for Shridhar Netralaya (Magadi, Karnataka) from a voice note or photo (IOL sticker, Rx, OT slip).
The form already has Surgical Protocols that auto-fill standard diagnosis, drops, tablets, follow-up dates, and post-op notes.

Return ONE compact JSON object (use "" for unmentioned strings, [] for unmentioned arrays, null for unmentioned numbers):
{
  "protocol_id": "",
  "operated_eye": "RE (OD)" | "LE (OS)" | "BE (OU)" | "",
  "case_type": "Day Care" | "In-Patient" | "",
  "discharge_status": "Routine" | "DAMA" | "Referred" | "",
  "billing_category": "Cash" | "TPA / Insurance" | "Ayushman Bharat (AB-ArK)" | "Yashaswini" | "",
  "chief_complaints": "",
  "diagnosis": "",
  "icd10_code": "",
  "procedure_name": "",
  "anesthesia": "Topical" | "Peribulbar" | "Sub-Tenon" | "Local Infiltration" | "General" | "",
  "dressing_status": "Dark Glasses" | "Pad & Bandage" | "Clear Protective Shield" | "None" | "",
  "discharge_condition": "",
  "pre_op_va_re": "",
  "pre_op_va_le": "",
  "pre_op_iop_re": "",
  "pre_op_iop_le": "",
  "pre_op_bp": "",
  "pre_op_rbs": "",
  "comorbidities": [],
  "allergies": "",
  "iol_model": "",
  "iol_power": "",
  "iol_batch": "",
  "intra_op_notes": "",
  "in_clinic_meds": "",
  "eye_drops": [{"name": "", "eye": "Operated Eye" | "RE (OD)" | "LE (OS)" | "BE (OU)", "schedule": "", "duration": ""}],
  "oral_meds": [{"name": "", "dosage": "", "timing": "", "duration": ""}],
  "head_bath_days": null,
  "warnings": []
}

RULES:
1. If the input matches one of the CLINIC PROTOCOLS below (e.g. Phaco, SICS, Pterygium, Intravitreal), set "protocol_id" to that exact id. Only populate diagnosis/procedure_name/anesthesia/eye_drops/oral_meds/head_bath_days if NO protocol matches OR if the speaker explicitly specifies custom overrides/additions.
2. Always extract patient-specific facts: operated_eye, iol_model, iol_power, iol_batch, allergies, comorbidities, and pre-op vitals (VA, IOP, BP, RBS).
3. Mappings:
   - Right eye / RE / OD / bala kannu -> "RE (OD)"; Left / LE / OS / eda kannu -> "LE (OS)"; Both / BE / OU -> "BE (OU)"
   - SIMC -> "Senile Immature Cataract" (H25.1); SMC -> "Senile Mature Cataract" (H25.2); Pterygium -> H11.0
   - QID = "4 times/day", TDS = "3 times/day", BD = "2 times/day", OD = "1 time/day", HS = "At night"
   - Comorbidities allowed: "Diabetes", "Hypertension", "Cardiac / IHD", "Asthma / COPD", "Thyroid", "Blood Thinners"
   - IOL stickers: brand/model -> iol_model, diopter (e.g. "+21.5 D") -> iol_power, SN/LOT -> iol_batch.`;

function audioFormat(mime: string): string {
  const subtype = mime.split('/')[1] || '';
  if (subtype.includes('mpeg') || subtype.includes('mp3')) return 'mp3';
  if (subtype.includes('wav')) return 'wav';
  if (subtype.includes('ogg')) return 'ogg';
  if (subtype.includes('mp4') || subtype.includes('m4a')) return 'm4a';
  if (subtype.includes('aac')) return 'aac';
  if (subtype.includes('flac')) return 'flac';
  return 'webm';
}

function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text || '') : ''))
      .join('');
  }
  return '';
}

async function callOpenRouterJson(params: {
  apiKey: string;
  systemPrompt: string;
  userText: string;
  mediaPart: Record<string, unknown>;
  maxTokens: number;
}): Promise<Record<string, unknown>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0,
      max_tokens: params.maxTokens,
      reasoning: { effort: 'none' },
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: [{ type: 'text', text: params.userText }, params.mediaPart] },
      ],
    }),
  });

  if (!res.ok) {
    const errDetail = await res.text();
    console.error('OpenRouter API failure:', errDetail);
    throw new Error('AI extraction failed. Please retry or enter manually.');
  }

  const data = await res.json();
  const raw = messageText(data?.choices?.[0]?.message?.content).trim();
  if (!raw) throw new Error('AI returned an empty response.');

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? raw.slice(start, end + 1) : raw);
}

async function runInvoicePipeline(params: {
  apiKey: string;
  mediaPart: Record<string, unknown>;
  catalogNames: string[];
}) {
  const catalogList = params.catalogNames.length
    ? params.catalogNames.map((name) => `- ${name}`).join('\n')
    : 'No catalog items provided';

  return callOpenRouterJson({
    apiKey: params.apiKey,
    systemPrompt: `${INVOICE_SYSTEM_PROMPT}\n\nCATALOG NAMES:\n${catalogList}`,
    userText: 'Extract matched procedure names, any explicit head charges, discount, and payment mode.',
    mediaPart: params.mediaPart,
    maxTokens: 450,
  });
}

async function runDischargePipeline(params: {
  apiKey: string;
  mode: 'image' | 'audio';
  mediaPart: Record<string, unknown>;
  protocols: Array<{ id: string; short_label: string; procedure_name: string }>;
}) {
  const protoText = params.protocols.length
    ? params.protocols.map((p) => `- id: "${p.id}" | ${p.short_label} (${p.procedure_name})`).join('\n')
    : 'None provided';

  const userText =
    params.mode === 'image'
      ? 'Match protocol_id if clear, and extract patient-specific fields / IOL / prescription from this image.'
      : 'Match protocol_id if spoken, and extract patient-specific fields and any overrides from this voice note.';

  return callOpenRouterJson({
    apiKey: params.apiKey,
    systemPrompt: `${DISCHARGE_SYSTEM_PROMPT}\n\nCLINIC PROTOCOLS:\n${protoText}`,
    userText,
    mediaPart: params.mediaPart,
    maxTokens: 850,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized: missing staff session token' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!openRouterKey) {
      return jsonResponse({ error: 'OPENROUTER_API_KEY secret is not configured in Supabase.' }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const role = userData?.user?.app_metadata?.clinic_role;

    if (userErr || !['staff', 'admin'].includes(role)) {
      return jsonResponse({ error: 'Forbidden: staff or admin role required' }, 403);
    }

    const body = await req.json();
    const target: 'discharge' | 'invoice' = body.target === 'invoice' ? 'invoice' : 'discharge';
    const mode: 'image' | 'audio' = body.mode;
    const rawMimeType: string = body.mimeType || '';
    const base64: string = body.base64 || '';

    if (!base64 || !rawMimeType || !['image', 'audio'].includes(mode)) {
      return jsonResponse({ error: 'Provide mode ("image"|"audio"), mimeType, and base64 payload' }, 400);
    }

    // Accept either catalogNames (string[]) or legacy catalog ({ name }[])
    const catalogNames: string[] = Array.isArray(body.catalogNames)
      ? body.catalogNames.map(String)
      : Array.isArray(body.catalog)
        ? body.catalog.map((c: any) => String(c.name || '')).filter(Boolean)
        : [];

    const protocols: Array<{ id: string; short_label: string; procedure_name: string }> = Array.isArray(body.protocols)
      ? body.protocols
      : [];

    const cleanMimeType = rawMimeType.split(';')[0].trim();
    const mediaPart =
      mode === 'image'
        ? { type: 'image_url', image_url: { url: `data:${cleanMimeType};base64,${base64}` } }
        : { type: 'input_audio', input_audio: { data: base64, format: audioFormat(cleanMimeType) } };

    const extracted =
      target === 'invoice'
        ? await runInvoicePipeline({ apiKey: openRouterKey, mediaPart, catalogNames })
        : await runDischargePipeline({ apiKey: openRouterKey, mode, mediaPart, protocols });

    const warnings = Array.isArray(extracted.warnings) ? extracted.warnings.map(String) : [];
    return jsonResponse({ extracted, warnings });
  } catch (err) {
    console.error('ai-extract exception:', err);
    const msg = err instanceof Error ? err.message : 'Could not process extraction request.';
    return jsonResponse({ error: msg }, 500);
  }
});
