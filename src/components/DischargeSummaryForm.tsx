import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Camera,
  Mic,
  Square,
  Plus,
  Trash2,
  Printer,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { addDaysIso, nowLocalDateTimeInput } from '../lib/dates';
import { blobToBase64, compressClinicalImage } from '../lib/imageCompress';
import { shareDischargeSummaryOnWhatsApp } from '../lib/whatsapp';
import { PrintableDischargeSummary } from './PrintableDischargeSummary';
import type {
  ClinicSettings,
  DischargeSummary,
  EyeDropItem,
  OperatedEye,
  OralMedItem,
  Patient,
  SurgicalProtocol,
} from '../types/database';

const ANESTHESIA_OPTIONS = ['Topical', 'Peribulbar', 'Sub-Tenon', 'Local Infiltration', 'General'];
const DRESSING_OPTIONS = ['Dark Glasses', 'Pad & Bandage', 'Clear Protective Shield', 'None'];
const COMORBIDITY_OPTIONS = ['Diabetes', 'Hypertension', 'Cardiac / IHD', 'Asthma / COPD', 'Thyroid', 'Blood Thinners'];

interface DischargeSummaryFormProps {
  patient: Patient;
  clinic: ClinicSettings;
  protocols: SurgicalProtocol[];
  onCreated: (summary: DischargeSummary) => void;
}

export function DischargeSummaryForm({
  patient,
  clinic,
  protocols,
  onCreated,
}: DischargeSummaryFormProps) {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');
  const [operatedEye, setOperatedEye] = useState<OperatedEye>('RE (OD)');
  const [caseType, setCaseType] = useState<'Day Care' | 'In-Patient'>('Day Care');
  const [dischargeStatus, setDischargeStatus] = useState<'Routine' | 'DAMA' | 'Referred'>('Routine');
  const [billingCategory, setBillingCategory] = useState('Cash');
  const [policyNo, setPolicyNo] = useState('');

  const [admissionAt, setAdmissionAt] = useState(nowLocalDateTimeInput());
  const [surgeryAt, setSurgeryAt] = useState(nowLocalDateTimeInput());
  const [dischargeAt, setDischargeAt] = useState(nowLocalDateTimeInput());

  const [diagnosis, setDiagnosis] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [anesthesia, setAnesthesia] = useState('Topical');
  const [dressingStatus, setDressingStatus] = useState('Dark Glasses');
  const [dischargeCondition, setDischargeCondition] = useState('Stable & Comfortable');

  const [vaRe, setVaRe] = useState('');
  const [vaLe, setVaLe] = useState('');
  const [iopRe, setIopRe] = useState('');
  const [iopLe, setIopLe] = useState('');
  const [bp, setBp] = useState('');
  const [rbs, setRbs] = useState('');

  const [comorbidities, setComorbidities] = useState<string[]>(patient.comorbidities || []);
  const [allergies, setAllergies] = useState(patient.allergies || 'NKDA');

  const [iolModel, setIolModel] = useState('');
  const [iolPower, setIolPower] = useState('');
  const [iolBatch, setIolBatch] = useState('');

  const [intraOpNotes, setIntraOpNotes] = useState('');
  const [inClinicMeds, setInClinicMeds] = useState('');

  const [eyeDrops, setEyeDrops] = useState<EyeDropItem[]>([]);
  const [oralMeds, setOralMeds] = useState<OralMedItem[]>([]);

  const [followUp1, setFollowUp1] = useState(addDaysIso(1));
  const [followUp2, setFollowUp2] = useState(addDaysIso(7));
  const [followUp3, setFollowUp3] = useState(addDaysIso(30));
  const [headBathDays, setHeadBathDays] = useState(clinic.default_head_bath_days || 14);
  const [preparedBy, setPreparedBy] = useState('OT Assistant');

  // AI autofill states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiFilledFields, setAiFilledFields] = useState<Record<string, boolean>>({});
  const [aiAssisted, setAiAssisted] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Safety check before save
  const [safetyVerified, setSafetyVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSummary, setSavedSummary] = useState<DischargeSummary | null>(null);
  const [flow, setFlow] = useState(0);

  function applyProtocol(proto: SurgicalProtocol) {
    setSelectedProtocolId(proto.id);
    setProcedureName(proto.procedure_name);
    if (proto.default_diagnosis) setDiagnosis(proto.default_diagnosis);
    setAnesthesia(proto.default_anesthesia || 'Topical');
    setDressingStatus(proto.default_dressing || 'Dark Glasses');
    setIntraOpNotes(proto.default_intra_op_notes || '');
    setInClinicMeds(proto.default_in_clinic_meds || '');
    setEyeDrops((proto.eye_drops || []).map((d) => ({ ...d })));
    setOralMeds((proto.oral_meds || []).map((m) => ({ ...m })));
    const days = proto.follow_up_days || [1, 7, 30];
    setFollowUp1(addDaysIso(days[0] ?? 1));
    setFollowUp2(addDaysIso(days[1] ?? 7));
    setFollowUp3(addDaysIso(days[2] ?? 30));
    setHeadBathDays(proto.head_bath_days || 14);
    setError('');
  }

  function applyAiExtraction(ext: Record<string, unknown>) {
    const marked: Record<string, boolean> = {};
    const str = (k: string) => (typeof ext[k] === 'string' ? (ext[k] as string).trim() : '');

    const eye = str('operated_eye');
    if (eye === 'RE (OD)' || eye === 'LE (OS)' || eye === 'BE (OU)') {
      setOperatedEye(eye);
      marked.operated_eye = true;
    }
    if (str('diagnosis')) { setDiagnosis(str('diagnosis')); marked.diagnosis = true; }
    if (str('procedure_name')) { setProcedureName(str('procedure_name')); marked.procedure_name = true; }
    if (str('anesthesia')) { setAnesthesia(str('anesthesia')); marked.anesthesia = true; }
    if (str('pre_op_va_re')) { setVaRe(str('pre_op_va_re')); marked.va = true; }
    if (str('pre_op_va_le')) { setVaLe(str('pre_op_va_le')); marked.va = true; }
    if (str('pre_op_iop_re')) { setIopRe(str('pre_op_iop_re')); marked.iop = true; }
    if (str('pre_op_iop_le')) { setIopLe(str('pre_op_iop_le')); marked.iop = true; }
    if (str('pre_op_bp')) { setBp(str('pre_op_bp')); marked.vitals = true; }
    if (str('pre_op_rbs')) { setRbs(str('pre_op_rbs')); marked.vitals = true; }
    if (str('allergies')) { setAllergies(str('allergies')); marked.allergies = true; }
    if (str('iol_model')) { setIolModel(str('iol_model')); marked.iol = true; }
    if (str('iol_power')) { setIolPower(str('iol_power')); marked.iol = true; }
    if (str('iol_batch')) { setIolBatch(str('iol_batch')); marked.iol = true; }
    if (str('intra_op_notes')) { setIntraOpNotes(str('intra_op_notes')); marked.intra_op_notes = true; }

    if (Array.isArray(ext.comorbidities) && ext.comorbidities.length > 0) {
      setComorbidities(ext.comorbidities.map(String));
    }
    if (Array.isArray(ext.eye_drops) && ext.eye_drops.length > 0) {
      setEyeDrops(ext.eye_drops as EyeDropItem[]);
      marked.eye_drops = true;
    }
    if (Array.isArray(ext.oral_meds) && ext.oral_meds.length > 0) {
      setOralMeds(ext.oral_meds as OralMedItem[]);
      marked.oral_meds = true;
    }
    if (Array.isArray(ext.warnings)) {
      setAiWarnings(ext.warnings.map(String).filter(Boolean));
    }

    setAiFilledFields((prev) => ({ ...prev, ...marked }));
    setAiAssisted(true);
    setSafetyVerified(false);
    setAiMessage('AI pre-filled highlighted amber fields. Please verify Operated Eye, IOL Power & Meds.');
  }

  async function callAiExtract(mode: 'image' | 'audio', mimeType: string, base64: string) {
    setAiLoading(true);
    setAiMessage('');
    setError('');
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Session expired. Please sign in again.');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode, mimeType, base64 }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'AI extraction unavailable');
      }
      if (payload.extracted) {
        applyAiExtraction(payload.extracted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI autofill failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePhotoExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressClinicalImage(file, 1400, 0.8);
      const b64 = await blobToBase64(compressed.blob);
      await callAiExtract('image', compressed.mimeType, b64);
    } catch (err) {
      setError('Could not read photo for AI extraction.');
    }
  }

  async function toggleVoiceRecord() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const b64 = await blobToBase64(blob);
        await callAiExtract('audio', mimeType, b64);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setAiMessage('Listening... Speak Eye, Diagnosis, Surgery, IOL Power & Meds, then tap Stop.');
    } catch {
      setError('Microphone permission denied or unavailable on this browser.');
    }
  }

  function highlightClass(key: string) {
    return aiFilledFields[key]
      ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-300'
      : 'border-slate-300 bg-white';
  }

  async function handleSave() {
    if (!diagnosis.trim() || !procedureName.trim()) {
      setError('Please select a surgical protocol or enter Diagnosis and Procedure Performed.');
      return;
    }
    if (!safetyVerified) {
      setError('Please tick the clinical safety verification box before generating the summary.');
      return;
    }

    setSaving(true);
    setError('');

    const { data, error: insErr } = await supabase
      .from('discharge_summaries')
      .insert({
        patient_id: patient.id,
        case_type: caseType,
        admission_at: new Date(admissionAt).toISOString(),
        surgery_at: new Date(surgeryAt).toISOString(),
        discharge_at: new Date(dischargeAt).toISOString(),
        operated_eye: operatedEye,
        diagnosis: diagnosis.trim(),
        procedure_name: procedureName.trim(),
        anesthesia,
        pre_op_va_re: vaRe.trim(),
        pre_op_va_le: vaLe.trim(),
        pre_op_iop_re: iopRe.trim(),
        pre_op_iop_le: iopLe.trim(),
        pre_op_bp: bp.trim(),
        pre_op_rbs: rbs.trim(),
        comorbidities,
        allergies: allergies.trim() || 'NKDA',
        intra_op_notes: intraOpNotes.trim(),
        in_clinic_meds: inClinicMeds.trim(),
        iol_model: iolModel.trim(),
        iol_power: iolPower.trim(),
        iol_batch: iolBatch.trim(),
        discharge_condition: dischargeCondition.trim(),
        dressing_status: dressingStatus,
        eye_drops: eyeDrops.filter((d) => d.name.trim()),
        oral_meds: oralMeds.filter((m) => m.name.trim()),
        follow_up_1: followUp1 || null,
        follow_up_2: followUp2 || null,
        follow_up_3: followUp3 || null,
        head_bath_days: headBathDays,
        prepared_by: preparedBy.trim() || 'OT Assistant',
        discharge_status: dischargeStatus,
        billing_category: billingCategory,
        policy_no: policyNo.trim(),
        ai_assisted: aiAssisted,
      })
      .select()
      .single();

    setSaving(false);
    if (insErr || !data) {
      setError(insErr?.message || 'Failed to save discharge summary');
      return;
    }

    const ds = data as DischargeSummary;
    setSavedSummary(ds);
    onCreated(ds);
  }

  if (savedSummary) {
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="text-sm font-extrabold text-emerald-950">
                Discharge Summary {savedSummary.summary_no} Saved ({savedSummary.operated_eye})
              </div>
              <div className="text-xs text-emerald-800">
                Ready for 1-page A4 print & WhatsApp delivery. Patient next follow-up updated automatically.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              Print 1-Page A4
            </button>
            <button
              type="button"
              onClick={() => shareDischargeSummaryOnWhatsApp(patient, savedSummary, clinic)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setSavedSummary(null)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700"
            >
              Create Another
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <PrintableDischargeSummary clinic={clinic} patient={patient} summary={savedSummary} />
        </div>
      </div>
    );
  }

  const flowLabels = ['Surgery', 'The eye', 'Medicines', 'Going home'];

  function continueFlow() {
    if (flow === 1 && (!diagnosis.trim() || !procedureName.trim())) {
      setError('Add the diagnosis and the procedure before continuing.');
      return;
    }
    setError('');
    setFlow((current) => Math.min(3, current + 1));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Discharge · {flowLabels[flow]}</p>
        <div className="wizard-progress mt-3 max-w-[10rem]">
          {flowLabels.map((label, index) => (
            <div key={label} className={`wizard-dot ${index <= flow ? 'wizard-dot-active' : ''}`} />
          ))}
        </div>
      </div>

      {flow === 0 && (
      <div className="flow-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-3xl text-ivory-50">Which surgery?</h3>
            <p className="mt-1 text-sm text-ivory-400">
              Tap a preset. Drops, notes, and follow-up dates fill in. You can still change every line.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-800 hover:bg-indigo-100">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <span>AI Scan Rx / IOL Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={aiLoading}
                onChange={handlePhotoExtract}
                className="hidden"
              />
            </label>
            <button
              type="button"
              disabled={aiLoading}
              onClick={toggleVoiceRecord}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold ${
                recording
                  ? 'animate-pulse border-red-500 bg-red-600 text-white'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
              <span>{recording ? 'Stop Voice' : 'AI Voice Fill'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {protocols
            .filter((p) => p.is_active)
            .map((proto) => (
              <button
                key={proto.id}
                type="button"
                onClick={() => applyProtocol(proto)}
                className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                  selectedProtocolId === proto.id
                    ? 'border-clinic-600 bg-clinic-50 text-clinic-950 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-clinic-300'
                }`}
              >
                <div className="text-xs font-extrabold">{proto.short_label}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{proto.default_anesthesia}</div>
              </button>
            ))}
        </div>

        {aiMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-950">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div>{aiMessage}</div>
              {aiWarnings.length > 0 && (
                <ul className="mt-1 list-disc pl-4 font-normal text-amber-900">
                  {aiWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {flow === 1 && (
      <div className="flow-panel">
        <div>
          <label className="mb-2 block font-display text-3xl text-ivory-50">
            Which eye?
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {(['RE (OD)', 'LE (OS)', 'BE (OU)'] as OperatedEye[]).map((eye) => (
              <button
                key={eye}
                type="button"
                onClick={() => setOperatedEye(eye)}
                className={`rounded-xl border-2 py-3.5 text-sm font-black transition ${
                  operatedEye === eye
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                }`}
              >
                {eye === 'RE (OD)' ? 'RIGHT EYE (OD)' : eye === 'LE (OS)' ? 'LEFT EYE (OS)' : 'BOTH EYES (OU)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Final Diagnosis *</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Right Eye Senile Immature Cataract"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold focus:outline-none ${highlightClass('diagnosis')}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Procedure Performed *</label>
            <input
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="e.g. Phacoemulsification with Foldable PCIOL"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold focus:outline-none ${highlightClass('procedure_name')}`}
            />
          </div>
        </div>

        {/* IOL Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            IOL / Implant Backup Details (Physical sticker goes in printed box)
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <input
              type="text"
              value={iolModel}
              onChange={(e) => setIolModel(e.target.value)}
              placeholder="Lens Brand / Model (e.g. Alcon AcrySof)"
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${highlightClass('iol')}`}
            />
            <input
              type="text"
              value={iolPower}
              onChange={(e) => setIolPower(e.target.value)}
              placeholder="IOL Power (e.g. +21.5 D)"
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${highlightClass('iol')}`}
            />
            <input
              type="text"
              value={iolBatch}
              onChange={(e) => setIolBatch(e.target.value)}
              placeholder="Serial / Batch No."
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${highlightClass('iol')}`}
            />
          </div>
        </div>

        {/* Anesthesia & Dressing Chips */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Anesthesia</label>
            <div className="flex flex-wrap gap-1.5">
              {ANESTHESIA_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnesthesia(opt)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                    anesthesia === opt ? 'bg-clinic-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Eye Dressing at Discharge</label>
            <div className="flex flex-wrap gap-1.5">
              {DRESSING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDressingStatus(opt)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                    dressingStatus === opt ? 'bg-clinic-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pre-op Snapshot */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">VA (RE)</label>
            <input type="text" value={vaRe} onChange={(e) => setVaRe(e.target.value)} placeholder="6/36" className={`w-full rounded-lg border px-2.5 py-1.5 text-xs ${highlightClass('va')}`} />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">VA (LE)</label>
            <input type="text" value={vaLe} onChange={(e) => setVaLe(e.target.value)} placeholder="6/18" className={`w-full rounded-lg border px-2.5 py-1.5 text-xs ${highlightClass('va')}`} />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">IOP (RE)</label>
            <input type="text" value={iopRe} onChange={(e) => setIopRe(e.target.value)} placeholder="14 mmHg" className={`w-full rounded-lg border px-2.5 py-1.5 text-xs ${highlightClass('iop')}`} />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">IOP (LE)</label>
            <input type="text" value={iopLe} onChange={(e) => setIopLe(e.target.value)} placeholder="15 mmHg" className={`w-full rounded-lg border px-2.5 py-1.5 text-xs ${highlightClass('iop')}`} />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Pre-Op BP</label>
            <input type="text" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="130/80" className={`w-full rounded-lg border px-2.5 py-1.5 text-xs ${highlightClass('vitals')}`} />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">RBS / Sugar</label>
            <input type="text" value={rbs} onChange={(e) => setRbs(e.target.value)} placeholder="124 mg/dL" className={`w-full rounded-lg border px-2.5 py-1.5 text-xs ${highlightClass('vitals')}`} />
          </div>
        </div>

        {/* Comorbidities & Allergies */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Comorbidities</label>
            <div className="flex flex-wrap gap-1.5">
              {COMORBIDITY_OPTIONS.map((item) => {
                const active = comorbidities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setComorbidities((prev) =>
                        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      active ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Drug Allergies *</label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-bold ${highlightClass('allergies')}`}
            />
          </div>
        </div>

        {/* Intra-op notes & Timestamps */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Intra-Op & Course Notes</label>
            <textarea
              rows={2}
              value={intraOpNotes}
              onChange={(e) => setIntraOpNotes(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs ${highlightClass('intra_op_notes')}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">In-Clinic / Intra-Op Meds Given</label>
            <textarea
              rows={2}
              value={inClinicMeds}
              onChange={(e) => setInClinicMeds(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Admission Date & Time</label>
            <input type="datetime-local" value={admissionAt} onChange={(e) => setAdmissionAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Surgery Date & Time</label>
            <input type="datetime-local" value={surgeryAt} onChange={(e) => setSurgeryAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Discharge Date & Time</label>
            <input type="datetime-local" value={dischargeAt} onChange={(e) => setDischargeAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
          </div>
        </div>
      </div>
      )}

      {flow === 2 && (
      <div className="flow-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-3xl text-ivory-50">Drops and tablets</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setEyeDrops((prev) => [
                  ...prev,
                  { name: '', eye: 'Operated Eye', schedule: '4 times/day', duration: '14 Days' },
                ])
              }
              className="inline-flex items-center gap-1 rounded-lg bg-clinic-50 px-2.5 py-1.5 text-xs font-bold text-clinic-800 hover:bg-clinic-100"
            >
              <Plus className="h-3.5 w-3.5" /> Add Drop
            </button>
            <button
              type="button"
              onClick={() =>
                setOralMeds((prev) => [
                  ...prev,
                  { name: '', dosage: '1 - 0 - 1', timing: 'After Food', duration: '5 Days' },
                ])
              }
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <Plus className="h-3.5 w-3.5" /> Add Tablet
            </button>
          </div>
        </div>

        {/* Eye drops editor */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Eye Drops</div>
          {eyeDrops.map((d, idx) => (
            <div key={idx} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-12">
              <input
                type="text"
                value={d.name}
                onChange={(e) =>
                  setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                }
                placeholder="Eye drop name"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold sm:col-span-4"
              />
              <input
                type="text"
                value={d.eye}
                onChange={(e) =>
                  setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, eye: e.target.value } : x)))
                }
                placeholder="Operated Eye"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:col-span-2"
              />
              <input
                type="text"
                value={d.schedule}
                onChange={(e) =>
                  setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, schedule: e.target.value } : x)))
                }
                placeholder="Schedule / Tapering"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:col-span-3"
              />
              <div className="flex items-center gap-1.5 sm:col-span-3">
                <input
                  type="text"
                  value={d.duration}
                  onChange={(e) =>
                    setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))
                  }
                  placeholder="Duration"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setEyeDrops((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Oral meds editor */}
        {oralMeds.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Oral Tablets</div>
            {oralMeds.map((m, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-12">
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) =>
                    setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                  }
                  placeholder="Tablet name"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold sm:col-span-4"
                />
                <input
                  type="text"
                  value={m.dosage}
                  onChange={(e) =>
                    setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, dosage: e.target.value } : x)))
                  }
                  placeholder="1 - 0 - 1"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:col-span-2"
                />
                <input
                  type="text"
                  value={m.timing}
                  onChange={(e) =>
                    setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, timing: e.target.value } : x)))
                  }
                  placeholder="After Food"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:col-span-3"
                />
                <div className="flex items-center gap-1.5 sm:col-span-3">
                  <input
                    type="text"
                    value={m.duration}
                    onChange={(e) =>
                      setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))
                    }
                    placeholder="5 Days"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setOralMeds((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {flow === 3 && (
      <div className="flow-panel">
        <p className="font-display text-3xl text-ivory-50">Before they leave</p>
        <div className="grid gap-2.5 sm:grid-cols-4">
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">1st Follow-Up (Next Day)</label>
            <input type="date" value={followUp1} onChange={(e) => setFollowUp1(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">2nd Follow-Up (1 Week)</label>
            <input type="date" value={followUp2} onChange={(e) => setFollowUp2(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">3rd Visit (Glasses)</label>
            <input type="date" value={followUp3} onChange={(e) => setFollowUp3(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Avoid Water / Head Bath (Days)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={headBathDays}
              onChange={(e) => setHeadBathDays(parseInt(e.target.value, 10) || 14)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
            />
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-4">
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Case Type</label>
            <select value={caseType} onChange={(e) => setCaseType(e.target.value as 'Day Care' | 'In-Patient')} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold">
              <option value="Day Care">Day Care</option>
              <option value="In-Patient">In-Patient</option>
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Category / Scheme</label>
            <select value={billingCategory} onChange={(e) => setBillingCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold">
              <option value="Cash">Cash / Private</option>
              <option value="TPA / Insurance">TPA / Insurance</option>
              <option value="Ayushman Bharat (AB-ArK)">Ayushman Bharat (AB-ArK)</option>
              <option value="Yashaswini">Yashaswini</option>
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Policy / Card No. (Optional)</label>
            <input type="text" value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} placeholder="If TPA / Scheme" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Prepared By</label>
            <input type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold" />
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Discharge Status</label>
            <select
              value={dischargeStatus}
              onChange={(e) => setDischargeStatus(e.target.value as 'Routine' | 'DAMA' | 'Referred')}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
            >
              <option value="Routine">Routine / Planned</option>
              <option value="DAMA">Against Medical Advice (DAMA)</option>
              <option value="Referred">Referred</option>
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold text-slate-600">Condition at Discharge</label>
            <input
              type="text"
              value={dischargeCondition}
              onChange={(e) => setDischargeCondition(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Clinical Safety Sign-off */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5">
          <input
            type="checkbox"
            checked={safetyVerified}
            onChange={(e) => setSafetyVerified(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-amber-500 text-clinic-600"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1 font-extrabold text-amber-950">
              <ShieldAlert className="h-4 w-4 text-amber-700" />
              Mandatory Pre-Print Safety Check
            </div>
            <div className="mt-0.5 text-amber-900">
              I have confirmed <strong>Operated Eye ({operatedEye})</strong>, <strong>IOL Power ({iolPower || 'N/A'})</strong>, and <strong>Allergies ({allergies || 'NKDA'})</strong> match Dr. Malathesh&apos;s notes.
            </div>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

      </div>
      )}

      <div className="sticky bottom-0 z-10 border-t border-ivory-50/10 bg-ink-950/90 py-3 backdrop-blur">
        <div className="flex gap-2">
          {flow > 0 ? (
            <button type="button" onClick={() => { setError(''); setFlow((current) => current - 1); }} className="btn-ghost flex-1">
              Back
            </button>
          ) : null}
          {flow < 3 ? (
            <button type="button" onClick={continueFlow} className="btn-primary flex-[2]">
              Continue
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={handleSave} className="btn-primary flex-[2]">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Save summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
