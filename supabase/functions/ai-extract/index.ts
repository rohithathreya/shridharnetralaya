import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are a clinical ophthalmology data extraction assistant for Shridhar Netralaya (Magadi, Karnataka).
You receive either:
- A photo of a doctor's handwritten prescription, OT slip, case sheet, or IOL lens box sticker; OR
- A short spoken voice note from a clinic assistant in English, Kannada, or mixed Kannada-English (Kanglish).

Extract ONLY details clearly present in the input. NEVER invent values. If a field is not mentioned or illegible, leave it empty string "" or empty array [].
Understand standard Indian ophthalmology shorthand:
- RE / OD = Right Eye -> output "RE (OD)"
- LE / OS = Left Eye -> output "LE (OS)"
- BE / OU = Both Eyes -> output "BE (OU)"
- SIMC = Senile Immature Cataract; SMC = Senile Mature Cataract; NS = Nuclear Sclerosis; PSC = Posterior Subcapsular Cataract
- PCIOL = Posterior Chamber Intraocular Lens; CAG = Conjunctival Autograft
- QID = 4 times/day; TDS = 3 times/day; BD = 2 times/day; OD (dosing) = 1 time/day; HS = At night; SOS = If needed
- 1-0-1 = Morning & Night; 1-0-0 = Morning only

Return strict JSON matching this exact shape:
{
  "operated_eye": "RE (OD)" | "LE (OS)" | "BE (OU)" | "",
  "diagnosis": string,
  "procedure_name": string,
  "anesthesia": "Topical" | "Peribulbar" | "Sub-Tenon" | "Local Infiltration" | "General" | "",
  "pre_op_va_re": string,
  "pre_op_va_le": string,
  "pre_op_iop_re": string,
  "pre_op_iop_le": string,
  "pre_op_bp": string,
  "pre_op_rbs": string,
  "comorbidities": string[],
  "allergies": string,
  "iol_model": string,
  "iol_power": string,
  "iol_batch": string,
  "intra_op_notes": string,
  "eye_drops": [{ "name": string, "eye": string, "schedule": string, "duration": string }],
  "oral_meds": [{ "name": string, "dosage": string, "timing": string, "duration": string }],
  "warnings": string[]
}
In "warnings", note anything that looked uncertain or hard to read so the staff assistant double-checks it.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiKey) {
      return jsonResponse(
        { error: 'GEMINI_API_KEY is not configured in Supabase Edge Function secrets.' },
        503,
      );
    }

    // Verify caller has staff or admin JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const role = userData?.user?.app_metadata?.clinic_role;

    if (userErr || !['staff', 'admin'].includes(role)) {
      return jsonResponse({ error: 'Forbidden: staff access required' }, 403);
    }

    const { mode, mimeType, base64, hint } = await req.json();
    if (!base64 || !mimeType || !['image', 'audio'].includes(mode)) {
      return jsonResponse({ error: 'Provide mode (image|audio), mimeType, and base64 payload' }, 400);
    }

    const userPrompt =
      mode === 'image'
        ? `Extract ophthalmology discharge/prescription/IOL details from this clinical image.${hint ? ` Context: ${hint}` : ''}`
        : `Transcribe and extract ophthalmology discharge details from this clinic assistant voice note (may be English, Kannada, or Kanglish).`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: userPrompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return jsonResponse({ error: 'AI extraction failed. Please try again or enter manually.' }, 502);
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return jsonResponse({ error: 'AI returned empty output' }, 502);
    }

    const extracted = JSON.parse(rawText);
    return jsonResponse({ extracted });
  } catch (err) {
    console.error('ai-extract error:', err);
    return jsonResponse({ error: 'Failed to process extraction request' }, 500);
  }
});
