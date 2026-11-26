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

const INVOICE_SYSTEM_PROMPT = `You are a fast billing extractor for Shridhar Netralaya (Magadi, Karnataka).
Input is a staff voice note in English, Kannada, or Kanglish.
Return ONE compact JSON object matching this exact shape (omit nothing, use "" or [] or 0 when unmentioned):
{
  "procedures": [{"name": "exact catalog name", "qty": 1, "total_price": 0}],
  "head_charges": [{"head": "one of the 10 bill heads", "amount": 0}],
  "discount": 0,
  "payment_mode": "Cash" | "UPI" | "Card" | "TPA / Scheme" | "",
  "payment_ref": "",
  "notes": "",
  "warnings": []
}

VALID 10 BILL HEADS:
${BILL_HEADS.map((h, i) => `${i + 1}. ${h}`).join('\n')}

RULES:
1. If the speaker names a procedure/service from the catalog (e.g. Phaco, SICS, OPD Consultation, YAG, A-Scan, Pterygium), put it in "procedures" with its exact catalog name. Set "total_price" to the spoken price (or catalog default if no override was spoken).
2. If the speaker dictates specific head amounts directly (e.g. "bed charges 1000, nursing 500, IOL 4500, anesthetist 1500, OT 2000"), put those in "head_charges" using the exact head name from the 10-head list above. Do NOT duplicate an amount in both "procedures" and "head_charges".
3. Never invent items or prices. If an item's price is unknown, set 0 and add a brief note in "warnings".`;

const DISCHARGE_SYSTEM_PROMPT = `You are a fast ophthalmology discharge extractor for Shridhar Netralaya (Magadi, Karnataka).
Input is a voice note (English/Kannada/Kanglish) or clinical photo (IOL box sticker, prescription, OT slip).
Return ONE compact JSON object matching this exact shape (use "" for unmentioned strings, [] for unmentioned arrays, null for unmentioned numbers):
{
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

CLINICAL MAPPINGS:
- Right eye / RE / OD / bala kannu -> "RE (OD)"
- Left eye / LE / OS / eda kannu -> "LE (OS)"
- Both eyes / BE / OU / eradu kannu -> "BE (OU)"
- SIMC -> diagnosis "Senile Immature Cataract", icd10_code "H25.1"
- SMC -> diagnosis "Senile Mature Cataract", icd10_code "H25.2"
- Pterygium -> icd10_code "H11.0"
- QID = "4 times/day", TDS = "3 times/day", BD = "2 times/day", OD = "1 time/day", HS = "At night"
- Comorbidities allowed labels: "Diabetes", "Hypertension", "Cardiac / IHD", "Asthma / COPD", "Thyroid", "Blood Thinners"
- IOL stickers: brand/model -> iol_model, diopter (e.g. "+21.5 D") -> iol_power, SN/LOT -> iol_batch.
- Extract ONLY explicitly stated or clearly legible facts. Put unclear audio/handwriting in "warnings".`;

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
      // Disable thinking tokens on Gemini 2.5 Flash for 3-4x faster & cheaper extraction
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
  catalog: Array<{ name: string; category: string; default_price: number }>;
}) {
  const catalogText = params.catalog.length
    ? params.catalog.map((c) => `- ${c.name} (₹${c.default_price})`).join('\n')
    : 'No catalog provided';

  return callOpenRouterJson({
    apiKey: params.apiKey,
    systemPrompt: `${INVOICE_SYSTEM_PROMPT}\n\nCATALOG:\n${catalogText}`,
    userText: 'Extract procedures, 10-head charges, discount, and payment mode from this voice note.',
    mediaPart: params.mediaPart,
    maxTokens: 550,
  });
}

async function runDischargePipeline(params: {
  apiKey: string;
  mode: 'image' | 'audio';
  mediaPart: Record<string, unknown>;
}) {
  const userText =
    params.mode === 'image'
      ? 'Extract discharge summary, prescription, or IOL sticker fields from this image.'
      : 'Extract ophthalmology discharge summary fields from this voice note.';

  return callOpenRouterJson({
    apiKey: params.apiKey,
    systemPrompt: DISCHARGE_SYSTEM_PROMPT,
    userText,
    mediaPart: params.mediaPart,
    maxTokens: 900,
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
    const catalog: Array<{ name: string; category: string; default_price: number }> = Array.isArray(body.catalog)
      ? body.catalog
      : [];

    if (!base64 || !rawMimeType || !['image', 'audio'].includes(mode)) {
      return jsonResponse({ error: 'Provide mode ("image"|"audio"), mimeType, and base64 payload' }, 400);
    }

    const cleanMimeType = rawMimeType.split(';')[0].trim();
    const mediaPart =
      mode === 'image'
        ? { type: 'image_url', image_url: { url: `data:${cleanMimeType};base64,${base64}` } }
        : { type: 'input_audio', input_audio: { data: base64, format: audioFormat(cleanMimeType) } };

    const extracted =
      target === 'invoice'
        ? await runInvoicePipeline({ apiKey: openRouterKey, mediaPart, catalog })
        : await runDischargePipeline({ apiKey: openRouterKey, mode, mediaPart });

    const warnings = Array.isArray(extracted.warnings) ? extracted.warnings.map(String) : [];
    return jsonResponse({ extracted, warnings });
  } catch (err) {
    console.error('ai-extract exception:', err);
    const msg = err instanceof Error ? err.message : 'Could not process extraction request.';
    return jsonResponse({ error: msg }, 500);
  }
});
