import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const DISCHARGE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    operated_eye: { type: 'STRING', enum: ['RE (OD)', 'LE (OS)', 'BE (OU)', ''] },
    chief_complaints: { type: 'STRING' },
    diagnosis: { type: 'STRING' },
    icd10_code: { type: 'STRING' },
    procedure_name: { type: 'STRING' },
    anesthesia: {
      type: 'STRING',
      enum: ['Topical', 'Peribulbar', 'Sub-Tenon', 'Local Infiltration', 'General', ''],
    },
    pre_op_va_re: { type: 'STRING' },
    pre_op_va_le: { type: 'STRING' },
    pre_op_iop_re: { type: 'STRING' },
    pre_op_iop_le: { type: 'STRING' },
    pre_op_bp: { type: 'STRING' },
    pre_op_rbs: { type: 'STRING' },
    comorbidities: { type: 'ARRAY', items: { type: 'STRING' } },
    allergies: { type: 'STRING' },
    iol_model: { type: 'STRING' },
    iol_power: { type: 'STRING' },
    iol_batch: { type: 'STRING' },
    intra_op_notes: { type: 'STRING' },
    eye_drops: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          eye: { type: 'STRING' },
          schedule: { type: 'STRING' },
          duration: { type: 'STRING' },
        },
        required: ['name', 'eye', 'schedule', 'duration'],
      },
    },
    oral_meds: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          dosage: { type: 'STRING' },
          timing: { type: 'STRING' },
          duration: { type: 'STRING' },
        },
        required: ['name', 'dosage', 'timing', 'duration'],
      },
    },
    head_bath_days: { type: 'INTEGER' },
    warnings: { type: 'ARRAY', items: { type: 'STRING' } },
  },
};

const INVOICE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          category: {
            type: 'STRING',
            enum: ['Consultation', 'Diagnostic', 'Procedure', 'Surgery', 'Optical', 'Other'],
          },
          qty: { type: 'INTEGER' },
          unit_price: { type: 'INTEGER' },
        },
        required: ['name', 'category', 'qty', 'unit_price'],
      },
    },
    discount: { type: 'INTEGER' },
    payment_mode: { type: 'STRING', enum: ['Cash', 'UPI', 'Card', 'TPA / Scheme', ''] },
    payment_ref: { type: 'STRING' },
    notes: { type: 'STRING' },
    warnings: { type: 'ARRAY', items: { type: 'STRING' } },
  },
};

const DISCHARGE_PROMPT = `You extract structured ophthalmology discharge data for Shridhar Netralaya (Magadi, Karnataka).
Inputs may be a clinical photo (IOL box sticker, OT slip, prescription) or a spoken voice note in English, Kannada, or mixed Kanglish.

RULES:
1. Extract ONLY facts explicitly spoken or clearly legible. Never invent or guess values.
2. Return "" for unmentioned strings, [] for unmentioned arrays, and omit head_bath_days if unmentioned.
3. Clinical mappings:
   - RE / OD / right eye / bala kannu -> "RE (OD)"
   - LE / OS / left eye / eda kannu -> "LE (OS)"
   - BE / OU / both eyes / eradu kannu -> "BE (OU)"
   - SIMC -> diagnosis "Senile Immature Cataract", icd10_code "H25.1"
   - SMC -> diagnosis "Senile Mature Cataract", icd10_code "H25.2"
   - Pterygium -> icd10_code "H11.0"
   - QID = 4 times/day, TDS = 3 times/day, BD = 2 times/day, OD (dose) = 1 time/day, HS = At night
   - IOL stickers: put lens brand/model in iol_model, diopter (e.g. "+21.5 D") in iol_power, and SN/LOT in iol_batch.
   - Comorbidities must map to standard labels when mentioned: "Diabetes", "Hypertension", "Cardiac / IHD", "Asthma / COPD", "Thyroid", "Blood Thinners".
4. List any unclear handwriting, low audio confidence, or ambiguous values in "warnings".`;

function buildInvoicePrompt(catalogLines: string): string {
  return `You extract structured billing line items for Shridhar Netralaya (Magadi, Karnataka) from a staff voice note in English, Kannada, or Kanglish.

ACTIVE SERVICE CATALOG (match spoken items to these exact names and default prices unless the speaker specifies a different price):
${catalogLines}

RULES:
1. Only include items explicitly requested by the speaker.
2. Match to catalog entries whenever possible. If the speaker overrides the rate, use the spoken rate.
3. For custom items not in the catalog, include the spoken name and rate (or 0 with a warning if rate was not spoken).
4. Extract integer discount (in INR), payment_mode ("Cash", "UPI", "Card", "TPA / Scheme", or ""), payment_ref, and notes when stated.`;
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
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return jsonResponse({ error: 'GEMINI_API_KEY secret is not configured in Supabase.' }, 503);
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

    const systemText =
      target === 'invoice'
        ? buildInvoicePrompt(
            catalog.length
              ? catalog.map((c) => `- ${c.name} [${c.category}]: ₹${c.default_price}`).join('\n')
              : 'No catalog items supplied',
          )
        : DISCHARGE_PROMPT;

    const userText =
      target === 'invoice'
        ? 'Extract billable items, discount, and payment details from this voice note.'
        : mode === 'image'
          ? 'Extract ophthalmology discharge, prescription, or IOL box sticker fields from this image.'
          : 'Extract ophthalmology discharge summary fields from this voice note.';

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: userText }, { inlineData: { mimeType: cleanMimeType, data: base64 } }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: target === 'invoice' ? INVOICE_SCHEMA : DISCHARGE_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errDetail = await geminiRes.text();
      console.error('Gemini API failure:', errDetail);
      return jsonResponse({ error: 'AI extraction failed. Please retry or enter manually.' }, 502);
    }

    const geminiJson = await geminiRes.json();
    const rawJsonText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) {
      return jsonResponse({ error: 'AI returned an empty response.' }, 502);
    }

    const extracted = JSON.parse(rawJsonText);
    const warnings = Array.isArray(extracted.warnings) ? extracted.warnings.map(String) : [];

    return jsonResponse({ extracted, warnings });
  } catch (err) {
    console.error('ai-extract exception:', err);
    return jsonResponse({ error: 'Could not process extraction request.' }, 500);
  }
});
