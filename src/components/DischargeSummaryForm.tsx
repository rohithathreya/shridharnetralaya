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
  Check,
  CheckCheck,
} from 'lucide-react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { addDaysIso, nowLocalDateTimeInput } from '../lib/dates';
import { blobToBase64, compressClinicalImage } from '../lib/imageCompress';
import { shareDischargeSummaryOnWhatsApp } from '../lib/whatsapp';
import { PrintableDischargeSummary } from './PrintableDischargeSummary';
import { CustomSelect, CustomSelectOption } from './CustomSelect';
import type {
  ClinicSettings,
  DischargeSummary,
  EyeDropItem,
  OperatedEye,
  OralMedItem,
  Patient,
  SurgicalProtocol,
} from '../types/database';

const ANESTHESIA_OPTIONS: CustomSelectOption[] = [
  { value: 'Topical', label: 'Topical Anaesthesia', sublabel: 'Numbing eye drops · Zero injections' },
  { value: 'Peribulbar', label: 'Peribulbar Block', sublabel: 'Local ophthalmic block' },
  { value: 'Sub-Tenon', label: 'Sub-Tenon Anaesthesia', sublabel: 'Blunt cannula infusion' },
  { value: 'Local Infiltration', label: 'Local Infiltration', sublabel: 'Minor lid / skin procedure' },
  { value: 'General', label: 'General Anaesthesia', sublabel: 'Full systemic anaesthesia' },
];

const DRESSING_OPTIONS: CustomSelectOption[] = [
  { value: 'Dark Glasses', label: 'Dark Glasses', sublabel: 'Standard post-phaco protective eyewear' },
  { value: 'Pad & Bandage', label: 'Pad & Bandage', sublabel: 'Sterile closed eye dressing' },
  { value: 'Clear Protective Shield', label: 'Clear Protective Shield', sublabel: 'Perforated plastic eye shield' },
  { value: 'None', label: 'None', sublabel: 'Open eye' },
];

const EYE_OPTIONS: CustomSelectOption[] = [
  { value: 'RE (OD)', label: 'Right Eye — RE (OD)', sublabel: 'Oculus Dexter' },
  { value: 'LE (OS)', label: 'Left Eye — LE (OS)', sublabel: 'Oculus Sinister' },
  { value: 'BE (OU)', label: 'Both Eyes — BE (OU)', sublabel: 'Oculus Uterque' },
];

const CASE_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: 'Day Care', label: 'Day Care', sublabel: 'Same-day discharge within 2 hours' },
  { value: 'In-Patient', label: 'In-Patient', sublabel: 'Overnight ward observation' },
];

const BILLING_SCHEME_OPTIONS: CustomSelectOption[] = [
  { value: 'Cash', label: 'Cash / Private', sublabel: 'Direct patient payment' },
  { value: 'TPA / Insurance', label: 'TPA / Private Insurance', sublabel: 'Cashless / Reimbursement claim' },
  { value: 'Ayushman Bharat (AB-ArK)', label: 'Ayushman Bharat (AB-ArK)', sublabel: 'Govt. scheme package' },
  { value: 'Yashaswini', label: 'Yashaswini', sublabel: 'Farmers healthcare scheme' },
];

const DISCHARGE_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Routine', label: 'Routine / Planned', sublabel: 'Discharged stable and comfortable' },
  { value: 'DAMA', label: 'Against Medical Advice (DAMA)', sublabel: 'Patient requested early leave' },
  { value: 'Referred', label: 'Referred', sublabel: 'Transferred for tertiary evaluation' },
];

const COMORBIDITY_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'Cardiac / IHD',
  'Asthma / COPD',
  'Thyroid',
  'Blood Thinners',
];

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

  // Tracking prefilled vs confirmed fields
  const [prefilledFields, setPrefilledFields] = useState<Record<string, boolean>>({});
  const [confirmedFields, setConfirmedFields] = useState<Record<string, boolean>>({});

  // AI autofill states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiAssisted, setAiAssisted] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Safety check before save
  const [safetyVerified, setSafetyVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSummary, setSavedSummary] = useState<DischargeSummary | null>(null);

  function confirmField(key: string) {
    setConfirmedFields((prev) => ({ ...prev, [key]: true }));
  }

  function confirmAllFields() {
    const all: Record<string, boolean> = {};
    for (const k of Object.keys(prefilledFields)) {
      all[k] = true;
    }
    setConfirmedFields(all);
  }

  const unconfirmedCount = Object.keys(prefilledFields).filter(
    (k) => prefilledFields[k] && !confirmedFields[k]
  ).length;

  function isFieldPrefilledAndUnconfirmed(key: string) {
    return Boolean(prefilledFields[key] && !confirmedFields[key]);
  }

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

    // Mark prefilled fields so staff sees the subtle orange + tick to verify
    const prefillMap: Record<string, boolean> = {
      procedure_name: true,
      diagnosis: Boolean(proto.default_diagnosis),
      anesthesia: true,
      dressing_status: true,
      eye_drops: (proto.eye_drops || []).length > 0,
      follow_up: true,
      head_bath: true,
    };
    if (proto.default_intra_op_notes) prefillMap.intra_op_notes = true;
    if (proto.default_in_clinic_meds) prefillMap.in_clinic_meds = true;

    setPrefilledFields((prev) => ({ ...prev, ...prefillMap }));
    setConfirmedFields({});
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
      marked.comorbidities = true;
    }
    if (Array.isArray(ext.eye_drops) && ext.eye_drops.length > 0) {
      setEyeDrops(
        ext.eye_drops.map((d: any) => ({
          name: String(d.name || ''),
          eye: String(d.eye || 'Operated Eye'),
          schedule: String(d.schedule || '4 times/day'),
          duration: String(d.duration || '14 Days'),
        })),
      );
      marked.eye_drops = true;
    }
    if (Array.isArray(ext.oral_meds) && ext.oral_meds.length > 0) {
      setOralMeds(
        ext.oral_meds.map((m: any) => ({
          name: String(m.name || ''),
          dosage: String(m.dosage || '1 - 0 - 1'),
          timing: String(m.timing || 'After Food'),
          duration: String(m.duration || '5 Days'),
        })),
      );
    }
    if (str('follow_up_1')) { setFollowUp1(str('follow_up_1')); marked.follow_up = true; }
    if (str('follow_up_2')) { setFollowUp2(str('follow_up_2')); marked.follow_up = true; }
    if (str('follow_up_3')) { setFollowUp3(str('follow_up_3')); marked.follow_up = true; }
    if (typeof ext.head_bath_days === 'number') { setHeadBathDays(ext.head_bath_days); marked.head_bath = true; }

    setPrefilledFields((prev) => ({ ...prev, ...marked }));
    setConfirmedFields({});
    setAiAssisted(true);
  }

  async function handlePhotoExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    setAiMessage('Analyzing Rx / IOL photo with clinical OCR...');
    setAiWarnings([]);
    setError('');

    try {
      const comp = await compressClinicalImage(file, 1400, 0.72);
      const b64 = await blobToBase64(comp.blob);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          sourceType: 'photo',
          mimeType: comp.mimeType,
          base64Data: b64,
          patientContext: {
            patient_code: patient.patient_code,
            full_name: patient.full_name,
            age: patient.age,
            sex: patient.sex,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI extraction failed');
      if (data.extraction) {
        applyAiExtraction(data.extraction);
        setAiMessage(data.message || 'Photo details extracted into fields below.');
        if (data.warnings?.length) setAiWarnings(data.warnings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI photo extraction failed');
      setAiMessage('');
    } finally {
      setAiLoading(false);
      e.target.value = '';
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
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];

      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setAiLoading(true);
        setAiMessage('Transcribing & extracting clinical orders from voice...');
        try {
          const b64 = await blobToBase64(audioBlob);
          const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-extract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              sourceType: 'voice',
              mimeType: audioBlob.type,
              base64Data: b64,
              patientContext: {
                patient_code: patient.patient_code,
                full_name: patient.full_name,
              },
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Voice extraction failed');
          if (data.extraction) {
            applyAiExtraction(data.extraction);
            setAiMessage('Voice orders applied. Please verify fields below.');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Voice transcription failed');
          setAiMessage('');
        } finally {
          setAiLoading(false);
        }
      };

      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
      setAiMessage('Listening... Speak Eye, Diagnosis, Surgery, IOL Power & Meds, then tap Stop.');
    } catch {
      setError('Microphone permission denied or unavailable on this browser.');
    }
  }

  async function handleSave() {
    if (!diagnosis.trim() || !procedureName.trim()) {
      setError('Please select a surgical protocol or enter Diagnosis and Procedure.');
      return;
    }
    if (!safetyVerified) {
      setError('Please check the clinical safety verification box before generating the summary.');
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

  function renderConfirmTick(key: string) {
    const isUnconfirmed = isFieldPrefilledAndUnconfirmed(key);
    if (!prefilledFields[key]) return null;

    if (isUnconfirmed) {
      return (
        <button
          type="button"
          onClick={() => confirmField(key)}
          className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-amber-100/90 px-2 py-0.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-200"
          title="Tap to confirm prefilled value"
        >
          <Check className="h-3 w-3 text-amber-800" />
          <span>Confirm</span>
        </button>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
        <Check className="h-3 w-3" />
        Verified
      </span>
    );
  }

  function fieldClass(key: string) {
    if (isFieldPrefilledAndUnconfirmed(key)) {
      return 'border-amber-400 bg-amber-50/70 text-amber-950 focus:border-amber-500 ring-1 ring-amber-300/40';
    }
    return '';
  }

  // Protocol options for CustomSelect
  const protocolOptions: CustomSelectOption[] = protocols
    .filter((p) => p.is_active)
    .map((p) => ({
      value: p.id,
      label: p.short_label,
      sublabel: p.procedure_name,
      badge: p.default_anesthesia,
    }));

  if (savedSummary) {
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-300 bg-emerald-50/80 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                Discharge Summary {savedSummary.summary_no} Saved ({savedSummary.operated_eye})
              </div>
              <div className="text-xs text-emerald-800">
                1-page bilingual discharge summary ready for print & WhatsApp delivery.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary !min-h-[42px] text-xs"
            >
              <Printer className="h-4 w-4" />
              Print 1-Page A4
            </button>
            <button
              type="button"
              onClick={() => shareDischargeSummaryOnWhatsApp(patient, savedSummary, clinic)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-emerald-800 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setSavedSummary(null)}
              className="btn-ghost !min-h-[42px] text-xs"
            >
              Create Another
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-ivory-50/10 bg-white p-4 shadow-soft">
          <PrintableDischargeSummary clinic={clinic} patient={patient} summary={savedSummary} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Protocol Preset & Tools (Custom Select Dropdown) */}
      <div className="card-surface p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-50/10 pb-4">
          <div>
            <span className="eyebrow">Surgical Protocol</span>
            <h3 className="mt-1 font-display text-2xl text-ivory-50">Discharge summary generator</h3>
            <p className="mt-0.5 text-xs text-ivory-400">
              Select a surgical preset below. Standard medications and follow-up dates fill in automatically.
            </p>
          </div>

          {/* AI Assistance buttons */}
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ivory-50/15 bg-ink-950 px-3.5 py-2 text-xs font-semibold text-ivory-50 shadow-soft hover:border-gold-400/40">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-gold-400" />}
              <span>Scan Rx / IOL</span>
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
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-soft ${
                recording
                  ? 'animate-pulse border-red-500 bg-red-600 text-white'
                  : 'border-ivory-50/15 bg-ink-950 text-ivory-50 hover:border-gold-400/40'
              }`}
            >
              {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4 text-gold-400" />}
              <span>{recording ? 'Stop' : 'Voice fill'}</span>
            </button>
          </div>
        </div>

        {/* Surgical Protocol Custom Dropdown & Eye Selector */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomSelect
            label="1. Surgical Protocol Preset"
            value={selectedProtocolId}
            onChange={(val) => {
              const proto = protocols.find((p) => p.id === val);
              if (proto) applyProtocol(proto);
              else setSelectedProtocolId('');
            }}
            options={protocolOptions}
            placeholder="-- Choose Protocol (Phaco, SICS, Pterygium...) --"
          />

          <CustomSelect
            label="2. Operated Eye"
            value={operatedEye}
            onChange={(val) => setOperatedEye(val as OperatedEye)}
            options={EYE_OPTIONS}
          />
        </div>

        {/* Unconfirmed Prefilled Banner */}
        {unconfirmedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                <strong>{unconfirmedCount} prefilled field(s)</strong> highlighted in warm orange. Review and tap{' '}
                <strong className="underline">Confirm</strong> on each row.
              </span>
            </div>
            <button
              type="button"
              onClick={confirmAllFields}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-200/90 px-3 py-1 text-xs font-bold text-amber-900 hover:bg-amber-300 transition"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Confirm All
            </button>
          </div>
        )}

        {aiMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-gold-400/30 bg-gold-400/10 p-3.5 text-xs text-ivory-50">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            <div>
              <div className="font-semibold">{aiMessage}</div>
              {aiWarnings.length > 0 && (
                <ul className="mt-1 list-disc pl-4 text-ivory-400">
                  {aiWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Surgical & Diagnostic Details */}
      <div className="card-surface p-5 sm:p-7 space-y-5">
        <h4 className="font-display text-xl text-ivory-50">Surgical & Clinical Specifications</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Diagnosis */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Final Diagnosis *</label>
              {renderConfirmTick('diagnosis')}
            </div>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => {
                setDiagnosis(e.target.value);
                confirmField('diagnosis');
              }}
              placeholder="e.g. Right Eye Senile Immature Cataract"
              className={`input-field font-semibold ${fieldClass('diagnosis')}`}
            />
          </div>

          {/* Procedure */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Procedure Performed *</label>
              {renderConfirmTick('procedure_name')}
            </div>
            <input
              type="text"
              value={procedureName}
              onChange={(e) => {
                setProcedureName(e.target.value);
                confirmField('procedure_name');
              }}
              placeholder="e.g. Phacoemulsification with Foldable PCIOL"
              className={`input-field font-semibold ${fieldClass('procedure_name')}`}
            />
          </div>
        </div>

        {/* Anesthesia & Eye Dressing Custom Dropdowns */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomSelect
            label="Anesthesia"
            value={anesthesia}
            onChange={(val) => {
              setAnesthesia(val);
              confirmField('anesthesia');
            }}
            options={ANESTHESIA_OPTIONS}
            prefilled={Boolean(prefilledFields.anesthesia)}
            confirmed={Boolean(confirmedFields.anesthesia)}
            onConfirm={() => confirmField('anesthesia')}
          />

          <CustomSelect
            label="Eye Dressing at Discharge"
            value={dressingStatus}
            onChange={(val) => {
              setDressingStatus(val);
              confirmField('dressing_status');
            }}
            options={DRESSING_OPTIONS}
            prefilled={Boolean(prefilledFields.dressing_status)}
            confirmed={Boolean(confirmedFields.dressing_status)}
            onConfirm={() => confirmField('dressing_status')}
          />
        </div>

        {/* IOL Details (Backup Sticker Box) */}
        <div className="rounded-2xl border border-ivory-50/10 bg-ink-950 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="label-field mb-0">IOL / Lens Implant Details (Box Sticker Backup)</span>
            {renderConfirmTick('iol')}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={iolModel}
              onChange={(e) => {
                setIolModel(e.target.value);
                confirmField('iol');
              }}
              placeholder="Lens Model (e.g. Alcon AcrySof)"
              className={`input-field text-xs font-semibold ${fieldClass('iol')}`}
            />
            <input
              type="text"
              value={iolPower}
              onChange={(e) => {
                setIolPower(e.target.value);
                confirmField('iol');
              }}
              placeholder="IOL Power (e.g. +21.5 D)"
              className={`input-field text-xs font-bold ${fieldClass('iol')}`}
            />
            <input
              type="text"
              value={iolBatch}
              onChange={(e) => {
                setIolBatch(e.target.value);
                confirmField('iol');
              }}
              placeholder="Serial / Batch No."
              className={`input-field text-xs font-semibold ${fieldClass('iol')}`}
            />
          </div>
        </div>

        {/* Pre-op Vision & Vitals */}
        <div>
          <label className="label-field">Pre-Operative Vitals & Vision Snapshot</label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
            <div>
              <span className="text-[10px] text-ivory-400 font-semibold block mb-1">VA (RE)</span>
              <input
                type="text"
                value={vaRe}
                onChange={(e) => setVaRe(e.target.value)}
                placeholder="6/36"
                className="input-field !min-h-[42px] text-xs font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-ivory-400 font-semibold block mb-1">VA (LE)</span>
              <input
                type="text"
                value={vaLe}
                onChange={(e) => setVaLe(e.target.value)}
                placeholder="6/18"
                className="input-field !min-h-[42px] text-xs font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-ivory-400 font-semibold block mb-1">IOP (RE)</span>
              <input
                type="text"
                value={iopRe}
                onChange={(e) => setIopRe(e.target.value)}
                placeholder="14 mmHg"
                className="input-field !min-h-[42px] text-xs font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-ivory-400 font-semibold block mb-1">IOP (LE)</span>
              <input
                type="text"
                value={iopLe}
                onChange={(e) => setIopLe(e.target.value)}
                placeholder="15 mmHg"
                className="input-field !min-h-[42px] text-xs font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-ivory-400 font-semibold block mb-1">Pre-Op BP</span>
              <input
                type="text"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                placeholder="130/80"
                className="input-field !min-h-[42px] text-xs font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-ivory-400 font-semibold block mb-1">RBS Sugar</span>
              <input
                type="text"
                value={rbs}
                onChange={(e) => setRbs(e.target.value)}
                placeholder="124 mg/dL"
                className="input-field !min-h-[42px] text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Comorbidities & Allergies */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Comorbidities (Systemic Conditions)</label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMORBIDITY_OPTIONS.map((item) => {
                const active = comorbidities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setComorbidities((prev) =>
                        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-gold-500 text-ink-900 shadow-soft'
                        : 'border border-ivory-50/15 bg-ink-950 text-ivory-400 hover:border-ivory-50/30'
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
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Drug Allergies *</label>
              {renderConfirmTick('allergies')}
            </div>
            <input
              type="text"
              value={allergies}
              onChange={(e) => {
                setAllergies(e.target.value);
                confirmField('allergies');
              }}
              placeholder="e.g. NKDA, or Ciprofloxacin"
              className={`input-field font-bold text-xs ${
                allergies.toUpperCase() !== 'NKDA'
                  ? 'text-red-700 bg-red-50/60 border-red-300'
                  : ''
              }`}
            />
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-field">Admission Date & Time</label>
            <input
              type="datetime-local"
              value={admissionAt}
              onChange={(e) => setAdmissionAt(e.target.value)}
              className="input-field !min-h-[46px] text-xs font-medium"
            />
          </div>
          <div>
            <label className="label-field">Surgery Date & Time</label>
            <input
              type="datetime-local"
              value={surgeryAt}
              onChange={(e) => setSurgeryAt(e.target.value)}
              className="input-field !min-h-[46px] text-xs font-medium"
            />
          </div>
          <div>
            <label className="label-field">Discharge Date & Time</label>
            <input
              type="datetime-local"
              value={dischargeAt}
              onChange={(e) => setDischargeAt(e.target.value)}
              className="input-field !min-h-[46px] text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Post-Operative Eye Drops & Medications */}
      <div className="card-surface p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-50/10 pb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-xl text-ivory-50">Post-Op Eye Drops & Tablets</h4>
            {renderConfirmTick('eye_drops')}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEyeDrops((prev) => [
                  ...prev,
                  { name: '', eye: 'Operated Eye', schedule: '4 times/day', duration: '14 Days' },
                ]);
                confirmField('eye_drops');
              }}
              className="btn-ghost !min-h-[38px] text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-gold-400" /> Add Drop
            </button>
            <button
              type="button"
              onClick={() =>
                setOralMeds((prev) => [
                  ...prev,
                  { name: '', dosage: '1 - 0 - 1', timing: 'After Food', duration: '5 Days' },
                ])
              }
              className="btn-ghost !min-h-[38px] text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-gold-400" /> Add Tablet
            </button>
          </div>
        </div>

        {/* Drops Editor */}
        <div className="space-y-2.5">
          {eyeDrops.map((d, idx) => (
            <div
              key={idx}
              className={`grid gap-2.5 rounded-2xl border p-3 sm:grid-cols-12 ${
                isFieldPrefilledAndUnconfirmed('eye_drops')
                  ? 'border-amber-400/80 bg-amber-50/40'
                  : 'border-ivory-50/10 bg-ink-950'
              }`}
            >
              <input
                type="text"
                value={d.name}
                onChange={(e) => {
                  setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)));
                  confirmField('eye_drops');
                }}
                placeholder="Eye Drop Name (e.g. Moxifloxacin 0.5%)"
                className="input-field !min-h-[42px] text-xs font-semibold sm:col-span-4"
              />
              <input
                type="text"
                value={d.eye}
                onChange={(e) =>
                  setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, eye: e.target.value } : x)))
                }
                placeholder="Operated Eye"
                className="input-field !min-h-[42px] text-xs sm:col-span-2"
              />
              <input
                type="text"
                value={d.schedule}
                onChange={(e) =>
                  setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, schedule: e.target.value } : x)))
                }
                placeholder="e.g. 4 times/day"
                className="input-field !min-h-[42px] text-xs sm:col-span-3"
              />
              <div className="flex items-center gap-2 sm:col-span-3">
                <input
                  type="text"
                  value={d.duration}
                  onChange={(e) =>
                    setEyeDrops((prev) => prev.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))
                  }
                  placeholder="Duration (14 Days)"
                  className="input-field !min-h-[42px] text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => setEyeDrops((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2 text-red-600 hover:text-red-700"
                  title="Remove drop"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {eyeDrops.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ivory-50/15 p-6 text-center text-xs text-ivory-400">
              No eye drops selected. Choose a surgical protocol above or tap &ldquo;+ Add Drop&rdquo;.
            </div>
          )}
        </div>

        {/* Oral Tablets */}
        {oralMeds.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-ivory-50/10">
            <span className="label-field">Oral Medications</span>
            {oralMeds.map((m, idx) => (
              <div
                key={idx}
                className="grid gap-2.5 rounded-2xl border border-ivory-50/10 bg-ink-950 p-3 sm:grid-cols-12"
              >
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) =>
                    setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                  }
                  placeholder="Tablet name (e.g. Cifran 500mg)"
                  className="input-field !min-h-[42px] text-xs font-semibold sm:col-span-4"
                />
                <input
                  type="text"
                  value={m.dosage}
                  onChange={(e) =>
                    setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, dosage: e.target.value } : x)))
                  }
                  placeholder="1 - 0 - 1"
                  className="input-field !min-h-[42px] text-xs sm:col-span-2"
                />
                <input
                  type="text"
                  value={m.timing}
                  onChange={(e) =>
                    setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, timing: e.target.value } : x)))
                  }
                  placeholder="After Food"
                  className="input-field !min-h-[42px] text-xs sm:col-span-3"
                />
                <div className="flex items-center gap-2 sm:col-span-3">
                  <input
                    type="text"
                    value={m.duration}
                    onChange={(e) =>
                      setOralMeds((prev) => prev.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))
                    }
                    placeholder="5 Days"
                    className="input-field !min-h-[42px] text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setOralMeds((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Remove tablet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Follow-Up & Discharge Orders (Custom Select Dropdowns) */}
      <div className="card-surface p-5 sm:p-7 space-y-5">
        <h4 className="font-display text-xl text-ivory-50">Follow-Up Dates & Clinical Sign-Off</h4>

        {/* Follow-up dates */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">1st Follow-Up (Day 1)</label>
              {renderConfirmTick('follow_up')}
            </div>
            <input
              type="date"
              value={followUp1}
              onChange={(e) => {
                setFollowUp1(e.target.value);
                confirmField('follow_up');
              }}
              className={`input-field font-semibold text-xs ${fieldClass('follow_up')}`}
            />
          </div>
          <div>
            <label className="label-field">2nd Follow-Up (1 Week)</label>
            <input
              type="date"
              value={followUp2}
              onChange={(e) => setFollowUp2(e.target.value)}
              className="input-field font-semibold text-xs"
            />
          </div>
          <div>
            <label className="label-field">3rd Visit (Refraction)</label>
            <input
              type="date"
              value={followUp3}
              onChange={(e) => setFollowUp3(e.target.value)}
              className="input-field font-semibold text-xs"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Avoid Water / Bath (Days)</label>
              {renderConfirmTick('head_bath')}
            </div>
            <input
              type="number"
              min={1}
              max={60}
              value={headBathDays}
              onChange={(e) => {
                setHeadBathDays(parseInt(e.target.value, 10) || 14);
                confirmField('head_bath');
              }}
              className={`input-field font-bold text-xs ${fieldClass('head_bath')}`}
            />
          </div>
        </div>

        {/* Case Type, Scheme & Condition Custom Dropdowns */}
        <div className="grid gap-4 sm:grid-cols-3">
          <CustomSelect
            label="Case Type"
            value={caseType}
            onChange={(val) => setCaseType(val as 'Day Care' | 'In-Patient')}
            options={CASE_TYPE_OPTIONS}
          />

          <CustomSelect
            label="Billing Scheme"
            value={billingCategory}
            onChange={(val) => setBillingCategory(val)}
            options={BILLING_SCHEME_OPTIONS}
          />

          <div>
            <label className="label-field">Prepared By (Staff)</label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="OT Assistant"
              className="input-field text-xs font-semibold"
            />
          </div>
        </div>

        {/* Discharge Status Custom Dropdown & Condition */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomSelect
            label="Discharge Status"
            value={dischargeStatus}
            onChange={(val) => setDischargeStatus(val as 'Routine' | 'DAMA' | 'Referred')}
            options={DISCHARGE_STATUS_OPTIONS}
          />

          <div>
            <label className="label-field">Condition at Discharge</label>
            <input
              type="text"
              value={dischargeCondition}
              onChange={(e) => setDischargeCondition(e.target.value)}
              className="input-field text-xs font-semibold"
            />
          </div>
        </div>

        {/* Mandatory Pre-Print Clinical Safety Verification */}
        <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-gold-400/30 bg-gold-400/10 p-4 transition hover:bg-gold-400/15">
          <input
            type="checkbox"
            checked={safetyVerified}
            onChange={(e) => setSafetyVerified(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gold-400 text-gold-500 focus:ring-gold-400/20"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-ivory-50">
              <ShieldAlert className="h-4 w-4 text-gold-400" />
              Pre-Print Clinical Safety Verification
            </div>
            <p className="mt-0.5 text-ivory-400">
              I have checked that <strong>Operated Eye ({operatedEye})</strong>, <strong>IOL Power ({iolPower || 'N/A'})</strong>, and <strong>Allergies ({allergies || 'NKDA'})</strong> match Dr. Malathesh&apos;s surgical notes.
            </p>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Sticky Save Action Bar */}
      <div className="sticky bottom-0 z-20 border-t border-ivory-50/10 bg-ink-950/95 py-3.5 backdrop-blur-xl">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn-primary w-full shadow-lift"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          Generate & Save Discharge Summary
        </button>
      </div>
    </div>
  );
}
