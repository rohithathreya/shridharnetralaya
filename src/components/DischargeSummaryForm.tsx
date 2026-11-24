import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  MessageCircle,
  Mic,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addDaysIso, nowLocalDateTimeInput } from '../lib/dates';
import { blobToBase64, compressClinicalImage } from '../lib/imageCompress';
import { runAiExtract, useVoiceRecorder } from '../lib/aiExtract';
import { shareDischargeSummaryOnWhatsApp } from '../lib/whatsapp';
import { PrintableDischargeSummary, type PrintLang } from './PrintableDischargeSummary';
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
  { value: 'Topical', label: 'Topical Anaesthesia', sublabel: 'Numbing drops · Zero injections' },
  { value: 'Peribulbar', label: 'Peribulbar Block', sublabel: 'Local ophthalmic block' },
  { value: 'Sub-Tenon', label: 'Sub-Tenon Anaesthesia', sublabel: 'Blunt cannula infusion' },
  { value: 'Local Infiltration', label: 'Local Infiltration', sublabel: 'Minor lid / skin procedure' },
  { value: 'General', label: 'General Anaesthesia', sublabel: 'Full systemic anaesthesia' },
];

const DRESSING_OPTIONS: CustomSelectOption[] = [
  { value: 'Dark Glasses', label: 'Dark Glasses', sublabel: 'Standard post-phaco eyewear' },
  { value: 'Pad & Bandage', label: 'Pad & Bandage', sublabel: 'Sterile closed eye dressing' },
  { value: 'Clear Protective Shield', label: 'Clear Protective Shield', sublabel: 'Perforated plastic shield' },
  { value: 'None', label: 'None', sublabel: 'Open eye' },
];

const CASE_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: 'Day Care', label: 'Day Care', sublabel: 'Same-day discharge' },
  { value: 'In-Patient', label: 'In-Patient', sublabel: 'Overnight ward stay' },
];

const BILLING_SCHEME_OPTIONS: CustomSelectOption[] = [
  { value: 'Cash', label: 'Cash / Private', sublabel: 'Direct patient payment' },
  { value: 'TPA / Insurance', label: 'TPA / Private Insurance', sublabel: 'Cashless / Reimbursement' },
  { value: 'Ayushman Bharat (AB-ArK)', label: 'Ayushman Bharat (AB-ArK)', sublabel: 'Govt. scheme package' },
  { value: 'Yashaswini', label: 'Yashaswini', sublabel: 'Farmers healthcare scheme' },
];

const DISCHARGE_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Routine', label: 'Routine / Planned', sublabel: 'Discharged stable' },
  { value: 'DAMA', label: 'Against Medical Advice (DAMA)', sublabel: 'Patient requested early leave' },
  { value: 'Referred', label: 'Referred', sublabel: 'Transferred for tertiary care' },
];

const COMORBIDITY_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'Cardiac / IHD',
  'Asthma / COPD',
  'Thyroid',
  'Blood Thinners',
];

function inferIcd10(diagnosisText: string): string {
  const lower = diagnosisText.toLowerCase();
  if (lower.includes('mature cataract')) return 'H25.2';
  if (lower.includes('cataract')) return 'H25.1';
  if (lower.includes('pterygium')) return 'H11.0';
  if (lower.includes('diabetic') || lower.includes('macular')) return 'E11.3';
  if (lower.includes('glaucoma')) return 'H40.1';
  return '';
}

interface DischargeSummaryFormProps {
  patient: Patient;
  clinic: ClinicSettings;
  protocols: SurgicalProtocol[];
  onCreated: (summary: DischargeSummary) => void;
  onPatientUpdated?: (patient: Patient) => void;
}

export function DischargeSummaryForm({
  patient,
  clinic,
  protocols,
  onCreated,
  onPatientUpdated,
}: DischargeSummaryFormProps) {
  const draftKey = `sn_ds_draft_v2_${patient.id}`;

  const [mrdInput, setMrdInput] = useState(patient.patient_code);
  const [mrdSaving, setMrdSaving] = useState(false);
  const [mrdNotice, setMrdNotice] = useState('');

  useEffect(() => {
    setMrdInput(patient.patient_code);
  }, [patient.patient_code]);

  const [selectedProtocolId, setSelectedProtocolId] = useState('');
  const [operatedEye, setOperatedEye] = useState<OperatedEye | ''>('');
  const [ipdNo, setIpdNo] = useState('');
  const [caseType, setCaseType] = useState<'Day Care' | 'In-Patient'>('Day Care');
  const [dischargeStatus, setDischargeStatus] = useState<'Routine' | 'DAMA' | 'Referred'>('Routine');
  const [billingCategory, setBillingCategory] = useState('Cash');
  const [tpaName, setTpaName] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [claimNo, setClaimNo] = useState('');
  const [attendantName, setAttendantName] = useState('');

  const [admissionAt, setAdmissionAt] = useState(nowLocalDateTimeInput());
  const [surgeryAt, setSurgeryAt] = useState(nowLocalDateTimeInput());
  const [dischargeAt, setDischargeAt] = useState(nowLocalDateTimeInput());

  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icd10Code, setIcd10Code] = useState('');
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
  const [allergies, setAllergies] = useState('');
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);

  const [iolModel, setIolModel] = useState('');
  const [iolPower, setIolPower] = useState('');
  const [iolBatch, setIolBatch] = useState('');
  const [noIolConfirmed, setNoIolConfirmed] = useState(false);

  const [intraOpNotes, setIntraOpNotes] = useState('');
  const [inClinicMeds, setInClinicMeds] = useState('');
  const [eyeDrops, setEyeDrops] = useState<EyeDropItem[]>([]);
  const [oralMeds, setOralMeds] = useState<OralMedItem[]>([]);

  const [followUp1, setFollowUp1] = useState(addDaysIso(1));
  const [followUp2, setFollowUp2] = useState(addDaysIso(7));
  const [followUp3, setFollowUp3] = useState(addDaysIso(30));
  const [headBathDays, setHeadBathDays] = useState(clinic.default_head_bath_days || 14);
  const [preparedBy, setPreparedBy] = useState('OT Assistant');

  const [aiTaggedFields, setAiTaggedFields] = useState<Record<string, boolean>>({});
  const [draftRestored, setDraftRestored] = useState(false);

  const [printLang, setPrintLang] = useState<PrintLang>('bilingual');
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiAssisted, setAiAssisted] = useState(false);

  const [safetyVerified, setSafetyVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSummary, setSavedSummary] = useState<DischargeSummary | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.operatedEye) setOperatedEye(d.operatedEye);
      if (d.ipdNo) setIpdNo(d.ipdNo);
      if (d.caseType) setCaseType(d.caseType);
      if (d.billingCategory) setBillingCategory(d.billingCategory);
      if (d.tpaName) setTpaName(d.tpaName);
      if (d.policyNo) setPolicyNo(d.policyNo);
      if (d.claimNo) setClaimNo(d.claimNo);
      if (d.attendantName) setAttendantName(d.attendantName);
      if (d.chiefComplaints) setChiefComplaints(d.chiefComplaints);
      if (d.diagnosis) setDiagnosis(d.diagnosis);
      if (d.icd10Code) setIcd10Code(d.icd10Code);
      if (d.procedureName) setProcedureName(d.procedureName);
      if (d.anesthesia) setAnesthesia(d.anesthesia);
      if (d.dressingStatus) setDressingStatus(d.dressingStatus);
      if (d.vaRe) setVaRe(d.vaRe);
      if (d.vaLe) setVaLe(d.vaLe);
      if (d.iopRe) setIopRe(d.iopRe);
      if (d.iopLe) setIopLe(d.iopLe);
      if (d.bp) setBp(d.bp);
      if (d.rbs) setRbs(d.rbs);
      if (Array.isArray(d.comorbidities)) setComorbidities(d.comorbidities);
      if (d.allergies) {
        setAllergies(d.allergies);
        setAllergyConfirmed(Boolean(d.allergyConfirmed));
      }
      if (d.iolModel) setIolModel(d.iolModel);
      if (d.iolPower) setIolPower(d.iolPower);
      if (d.iolBatch) setIolBatch(d.iolBatch);
      if (typeof d.noIolConfirmed === 'boolean') setNoIolConfirmed(d.noIolConfirmed);
      if (d.intraOpNotes) setIntraOpNotes(d.intraOpNotes);
      if (Array.isArray(d.eyeDrops)) setEyeDrops(d.eyeDrops);
      if (Array.isArray(d.oralMeds)) setOralMeds(d.oralMeds);
      if (d.followUp1) setFollowUp1(d.followUp1);
      if (d.followUp2) setFollowUp2(d.followUp2);
      if (d.followUp3) setFollowUp3(d.followUp3);
      if (d.headBathDays) setHeadBathDays(d.headBathDays);
      setDraftRestored(true);
    } catch {
      // ignore corrupted drafts
    }
  }, [draftKey]);

  useEffect(() => {
    if (savedSummary) return;
    const payload = {
      operatedEye,
      ipdNo,
      caseType,
      billingCategory,
      tpaName,
      policyNo,
      claimNo,
      attendantName,
      chiefComplaints,
      diagnosis,
      icd10Code,
      procedureName,
      anesthesia,
      dressingStatus,
      vaRe,
      vaLe,
      iopRe,
      iopLe,
      bp,
      rbs,
      comorbidities,
      allergies,
      allergyConfirmed,
      iolModel,
      iolPower,
      iolBatch,
      noIolConfirmed,
      intraOpNotes,
      eyeDrops,
      oralMeds,
      followUp1,
      followUp2,
      followUp3,
      headBathDays,
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    draftKey,
    savedSummary,
    operatedEye,
    ipdNo,
    caseType,
    billingCategory,
    tpaName,
    policyNo,
    claimNo,
    attendantName,
    chiefComplaints,
    diagnosis,
    icd10Code,
    procedureName,
    anesthesia,
    dressingStatus,
    vaRe,
    vaLe,
    iopRe,
    iopLe,
    bp,
    rbs,
    comorbidities,
    allergies,
    allergyConfirmed,
    iolModel,
    iolPower,
    iolBatch,
    noIolConfirmed,
    intraOpNotes,
    eyeDrops,
    oralMeds,
    followUp1,
    followUp2,
    followUp3,
    headBathDays,
  ]);

  function clearDraft() {
    localStorage.removeItem(draftKey);
    setSelectedProtocolId('');
    setOperatedEye('');
    setIpdNo('');
    setChiefComplaints('');
    setDiagnosis('');
    setIcd10Code('');
    setProcedureName('');
    setIolModel('');
    setIolPower('');
    setIolBatch('');
    setNoIolConfirmed(false);
    setAllergies('');
    setAllergyConfirmed(false);
    setEyeDrops([]);
    setOralMeds([]);
    setAiTaggedFields({});
    setDraftRestored(false);
    setSafetyVerified(false);
  }

  async function handleSaveMrd() {
    const clean = mrdInput.trim().toUpperCase();
    if (!clean) {
      setMrdNotice('MRD No. cannot be empty.');
      return;
    }
    if (clean === patient.patient_code) return;
    if (!window.confirm(`Update permanent MRD No. from ${patient.patient_code} to ${clean}?`)) {
      setMrdInput(patient.patient_code);
      return;
    }
    setMrdSaving(true);
    setMrdNotice('');
    const { data, error: updErr } = await supabase
      .from('patients')
      .update({ patient_code: clean })
      .eq('id', patient.id)
      .select()
      .single();
    setMrdSaving(false);

    if (updErr || !data) {
      setMrdNotice(
        updErr?.code === '23505'
          ? 'That MRD No. already belongs to another patient.'
          : updErr?.message || 'Failed to update MRD No.',
      );
      return;
    }
    onPatientUpdated?.(data as Patient);
    setMrdNotice('MRD No. saved.');
  }

  function applyProtocol(proto: SurgicalProtocol) {
    setSelectedProtocolId(proto.id);
    setProcedureName(proto.procedure_name);
    if (proto.default_diagnosis) {
      setDiagnosis(proto.default_diagnosis);
      setIcd10Code(inferIcd10(proto.default_diagnosis));
    }
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

  const applyAiExtraction = useCallback((ext: Record<string, unknown>) => {
    const tagged: Record<string, boolean> = {};
    const str = (k: string) => (typeof ext[k] === 'string' ? (ext[k] as string).trim() : '');

    const eye = str('operated_eye');
    if (eye === 'RE (OD)' || eye === 'LE (OS)' || eye === 'BE (OU)') {
      setOperatedEye(eye);
      tagged.operated_eye = true;
    }
    if (str('chief_complaints')) {
      setChiefComplaints(str('chief_complaints'));
      tagged.chief_complaints = true;
    }
    if (str('diagnosis')) {
      setDiagnosis(str('diagnosis'));
      tagged.diagnosis = true;
      if (!str('icd10_code')) {
        const inferred = inferIcd10(str('diagnosis'));
        if (inferred) setIcd10Code(inferred);
      }
    }
    if (str('icd10_code')) {
      setIcd10Code(str('icd10_code'));
      tagged.icd10_code = true;
    }
    if (str('procedure_name')) {
      setProcedureName(str('procedure_name'));
      tagged.procedure_name = true;
    }
    if (str('anesthesia')) setAnesthesia(str('anesthesia'));
    if (str('pre_op_va_re')) setVaRe(str('pre_op_va_re'));
    if (str('pre_op_va_le')) setVaLe(str('pre_op_va_le'));
    if (str('pre_op_iop_re')) setIopRe(str('pre_op_iop_re'));
    if (str('pre_op_iop_le')) setIopLe(str('pre_op_iop_le'));
    if (str('pre_op_bp')) setBp(str('pre_op_bp'));
    if (str('pre_op_rbs')) setRbs(str('pre_op_rbs'));

    if (str('allergies')) {
      setAllergies(str('allergies'));
      setAllergyConfirmed(false);
      tagged.allergies = true;
    }
    if (str('iol_model')) {
      setIolModel(str('iol_model'));
      setNoIolConfirmed(false);
      tagged.iol = true;
    }
    if (str('iol_power')) {
      setIolPower(str('iol_power'));
      setNoIolConfirmed(false);
      tagged.iol = true;
    }
    if (str('iol_batch')) {
      setIolBatch(str('iol_batch'));
      setNoIolConfirmed(false);
      tagged.iol = true;
    }
    if (str('intra_op_notes')) setIntraOpNotes(str('intra_op_notes'));
    const aiComorbidities = ext.comorbidities;
    if (Array.isArray(aiComorbidities) && aiComorbidities.length > 0) {
      setComorbidities((prev) => Array.from(new Set([...prev, ...aiComorbidities.map(String)])));
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
    if (typeof ext.head_bath_days === 'number' && ext.head_bath_days > 0) {
      setHeadBathDays(ext.head_bath_days);
    }

    setAiTaggedFields((prev) => ({ ...prev, ...tagged }));
    setAiAssisted(true);
  }, []);

  const handleVoiceComplete = useCallback(
    async (base64: string, mimeType: string) => {
      setAiLoading(true);
      setAiMessage('Extracting clinical fields from voice…');
      setAiWarnings([]);
      setError('');
      try {
        const { extracted, warnings } = await runAiExtract({
          target: 'discharge',
          mode: 'audio',
          mimeType,
          base64,
        });
        applyAiExtraction(extracted);
        setAiWarnings(warnings);
        setAiMessage('Voice details merged. Verify Operated Eye, IOL Power & Allergies before saving.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Voice extraction failed');
        setAiMessage('');
      } finally {
        setAiLoading(false);
      }
    },
    [applyAiExtraction],
  );

  const voice = useVoiceRecorder(handleVoiceComplete);

  async function handlePhotoExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    setAiMessage('Scanning IOL box sticker / OT slip…');
    setAiWarnings([]);
    setError('');
    try {
      const comp = await compressClinicalImage(file, 1400, 0.78);
      const b64 = await blobToBase64(comp.blob);
      const { extracted, warnings } = await runAiExtract({
        target: 'discharge',
        mode: 'image',
        mimeType: comp.mimeType,
        base64: b64,
      });
      applyAiExtraction(extracted);
      setAiWarnings(warnings);
      setAiMessage('Scan applied. Verify highlighted fields before saving.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo scan failed');
      setAiMessage('');
    } finally {
      setAiLoading(false);
      e.target.value = '';
    }
  }

  const requiresIol = useMemo(() => {
    const p = procedureName.toLowerCase();
    return p.includes('phaco') || p.includes('sics') || p.includes('cataract') || p.includes('iol');
  }, [procedureName]);

  const livePreviewSummary: DischargeSummary = useMemo(
    () => ({
      id: 'preview',
      summary_no: 'DS-PREVIEW',
      ipd_no: ipdNo.trim() || 'IPD-AUTO',
      patient_id: patient.id,
      case_type: caseType,
      admission_at: new Date(admissionAt).toISOString(),
      surgery_at: new Date(surgeryAt).toISOString(),
      discharge_at: new Date(dischargeAt).toISOString(),
      operated_eye: (operatedEye || 'RE (OD)') as OperatedEye,
      chief_complaints: chiefComplaints.trim(),
      diagnosis: diagnosis.trim(),
      icd10_code: icd10Code.trim(),
      procedure_name: procedureName.trim(),
      anesthesia,
      pre_op_va_re: vaRe.trim(),
      pre_op_va_le: vaLe.trim(),
      pre_op_iop_re: iopRe.trim(),
      pre_op_iop_le: iopLe.trim(),
      pre_op_bp: bp.trim(),
      pre_op_rbs: rbs.trim(),
      comorbidities,
      allergies: allergies.trim(),
      intra_op_notes: intraOpNotes.trim(),
      in_clinic_meds: inClinicMeds.trim(),
      iol_model: iolModel.trim(),
      iol_power: iolPower.trim(),
      iol_batch: iolBatch.trim(),
      no_iol_confirmed: noIolConfirmed,
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
      tpa_name: tpaName.trim(),
      policy_no: policyNo.trim(),
      claim_no: claimNo.trim(),
      attendant_name: attendantName.trim(),
      ai_assisted: aiAssisted,
      share_token: '',
      created_at: new Date().toISOString(),
    }),
    [
      ipdNo,
      patient.id,
      caseType,
      admissionAt,
      surgeryAt,
      dischargeAt,
      operatedEye,
      chiefComplaints,
      diagnosis,
      icd10Code,
      procedureName,
      anesthesia,
      vaRe,
      vaLe,
      iopRe,
      iopLe,
      bp,
      rbs,
      comorbidities,
      allergies,
      intraOpNotes,
      inClinicMeds,
      iolModel,
      iolPower,
      iolBatch,
      noIolConfirmed,
      dischargeCondition,
      dressingStatus,
      eyeDrops,
      oralMeds,
      followUp1,
      followUp2,
      followUp3,
      headBathDays,
      preparedBy,
      dischargeStatus,
      billingCategory,
      tpaName,
      policyNo,
      claimNo,
      attendantName,
      aiAssisted,
    ],
  );

  async function handleSave() {
    if (!operatedEye) {
      setError('Safety block: Select Operated Eye (RE / LE / BE) before generating.');
      return;
    }
    if (!diagnosis.trim() || !procedureName.trim()) {
      setError('Enter Final Diagnosis and Procedure Performed.');
      return;
    }
    if (!allergies.trim() || !allergyConfirmed) {
      setError('Safety block: Confirm Drug Allergies (enter allergy or tap "Confirm NKDA").');
      return;
    }
    if (requiresIol && !noIolConfirmed && (!iolModel.trim() || !iolPower.trim() || !iolBatch.trim())) {
      setError(
        'Safety block: Cataract/IOL procedures require IOL Model, Power & Serial/Batch No. (or check "No IOL / Aphakia").',
      );
      return;
    }
    if (!safetyVerified) {
      setError('Tick the Final Clinical Safety Verification checkbox before saving.');
      return;
    }

    setSaving(true);
    setError('');

    const { data, error: insErr } = await supabase
      .from('discharge_summaries')
      .insert({
        patient_id: patient.id,
        ipd_no: ipdNo.trim(),
        case_type: caseType,
        admission_at: new Date(admissionAt).toISOString(),
        surgery_at: new Date(surgeryAt).toISOString(),
        discharge_at: new Date(dischargeAt).toISOString(),
        operated_eye: operatedEye,
        chief_complaints: chiefComplaints.trim(),
        diagnosis: diagnosis.trim(),
        icd10_code: icd10Code.trim(),
        procedure_name: procedureName.trim(),
        anesthesia,
        pre_op_va_re: vaRe.trim(),
        pre_op_va_le: vaLe.trim(),
        pre_op_iop_re: iopRe.trim(),
        pre_op_iop_le: iopLe.trim(),
        pre_op_bp: bp.trim(),
        pre_op_rbs: rbs.trim(),
        comorbidities,
        allergies: allergies.trim(),
        intra_op_notes: intraOpNotes.trim(),
        in_clinic_meds: inClinicMeds.trim(),
        iol_model: noIolConfirmed ? '' : iolModel.trim(),
        iol_power: noIolConfirmed ? '' : iolPower.trim(),
        iol_batch: noIolConfirmed ? '' : iolBatch.trim(),
        no_iol_confirmed: noIolConfirmed,
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
        tpa_name: tpaName.trim(),
        policy_no: policyNo.trim(),
        claim_no: claimNo.trim(),
        attendant_name: attendantName.trim(),
        ai_assisted: aiAssisted,
      })
      .select()
      .single();

    setSaving(false);
    if (insErr || !data) {
      setError(insErr?.message || 'Failed to save discharge summary');
      return;
    }

    localStorage.removeItem(draftKey);
    const ds = data as DischargeSummary;
    setSavedSummary(ds);
    onCreated(ds);
  }

  function aiBadge(field: string) {
    if (!aiTaggedFields[field]) return null;
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
        AI filled — verify
      </span>
    );
  }

  const activeProtocols = protocols.filter((p) => p.is_active);

  if (savedSummary) {
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-300 bg-emerald-50/90 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                Summary {savedSummary.summary_no} Saved ({savedSummary.operated_eye})
              </div>
              <div className="text-xs text-emerald-800">
                MRD: {patient.patient_code}
                {savedSummary.ipd_no ? ` · IPD: ${savedSummary.ipd_no}` : ''}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-emerald-300 bg-white p-0.5 text-xs">
              {(['en', 'kn', 'bilingual'] as PrintLang[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPrintLang(m)}
                  className={`rounded-full px-2.5 py-1 font-semibold transition ${
                    printLang === m ? 'bg-ivory-50 text-ink-900' : 'text-ivory-400'
                  }`}
                >
                  {m === 'en' ? 'EN' : m === 'kn' ? 'ಕನ್ನಡ' : 'Bilingual'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => window.print()} className="btn-primary !min-h-[40px] text-xs">
              <Printer className="h-4 w-4" /> Print A4
            </button>
            <button
              type="button"
              onClick={() => shareDischargeSummaryOnWhatsApp(patient, savedSummary, clinic)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                setSavedSummary(null);
                clearDraft();
              }}
              className="btn-ghost !min-h-[40px] text-xs"
            >
              New Summary
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-ivory-50/10 bg-white p-3 shadow-soft sm:p-4">
          <PrintableDischargeSummary
            clinic={clinic}
            patient={patient}
            summary={savedSummary}
            printLang={printLang}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-12">
      {/* LEFT PANE: CLINICAL WORKBENCH (7 cols on xl) */}
      <div className="no-print min-w-0 space-y-4 xl:col-span-7">
        {/* Obsidian AI Command & Quick-Preset Strip */}
        <div className="card-obsidian space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-300">
                AI Assist & One-Tap Presets
              </p>
              <h3 className="mt-0.5 font-display text-xl text-white">Discharge Summary</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5 text-gold-300" />}
                <span>Scan IOL Sticker</span>
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
                onClick={voice.toggle}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  voice.recording
                    ? 'animate-pulse bg-red-600 text-white shadow-lift'
                    : 'bg-gold-400 text-white hover:bg-gold-300'
                }`}
              >
                {voice.recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span>{voice.recording ? `Stop (${voice.elapsedSec}s)` : 'Voice Fill'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobilePreviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 xl:hidden"
              >
                <Eye className="h-3.5 w-3.5 text-gold-300" />
                A4
              </button>
            </div>
          </div>

          {/* 1-Tap Protocol Chips (faster than dropdown on phones) */}
          {activeProtocols.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeProtocols.map((p) => {
                const active = selectedProtocolId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyProtocol(p)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-[#FBF9F6] text-[#141210]'
                        : 'border border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/15'
                    }`}
                  >
                    {p.short_label}
                  </button>
                );
              })}
            </div>
          )}

          {(aiMessage || voice.micError) && (
            <div className="flex items-start gap-2 rounded-2xl border border-gold-300/30 bg-white/[0.07] p-3 text-xs text-white/90">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <div className="space-y-1">
                <div className="font-semibold">{voice.micError || aiMessage}</div>
                {aiWarnings.length > 0 && (
                  <ul className="list-disc pl-4 text-white/75">
                    {aiWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {draftRestored && (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-gold-400/30 bg-clinic-50 px-4 py-2.5 text-xs text-ivory-200">
            <span>Local draft restored for {patient.full_name}.</span>
            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex items-center gap-1 font-semibold text-gold-600 hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        {/* Section 1: MRD, IPD & Operated Eye */}
        <div className="card-surface space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">MRD No. (Editable Permanent ID)</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={mrdInput}
                  onChange={(e) => setMrdInput(e.target.value.toUpperCase())}
                  className="input-field font-mono text-xs font-bold uppercase tracking-wider"
                />
                {mrdInput.trim().toUpperCase() !== patient.patient_code && (
                  <button
                    type="button"
                    disabled={mrdSaving}
                    onClick={handleSaveMrd}
                    className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-ivory-50 px-3 text-xs font-semibold text-ink-900 hover:bg-gold-500 hover:text-white"
                  >
                    {mrdSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                )}
              </div>
              {mrdNotice && <p className="mt-1 text-[11px] font-medium text-gold-600">{mrdNotice}</p>}
            </div>

            <div>
              <label className="label-field">IPD / Episode No.</label>
              <input
                type="text"
                value={ipdNo}
                onChange={(e) => setIpdNo(e.target.value.toUpperCase())}
                placeholder="Auto-generated (IPD-26-XXXX)"
                className="input-field font-mono text-xs font-semibold uppercase"
              />
            </div>
          </div>

          {/* Operated Eye — Mandatory Un-Defaulted Tactile Selector */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Operated Eye * (Tap to Confirm)</label>
              {aiBadge('operated_eye')}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['RE (OD)', 'LE (OS)', 'BE (OU)'] as OperatedEye[]).map((eye) => {
                const active = operatedEye === eye;
                return (
                  <button
                    key={eye}
                    type="button"
                    onClick={() => {
                      setOperatedEye(eye);
                      setAiTaggedFields((p) => ({ ...p, operated_eye: false }));
                    }}
                    className={`rounded-2xl border px-2 py-3 text-center transition active:scale-[0.97] ${
                      active
                        ? 'border-ivory-50 bg-ivory-50 text-gold-300 shadow-lift'
                        : 'border-ivory-50/15 bg-ink-950 text-ivory-200 hover:border-gold-400'
                    }`}
                  >
                    <div className="text-xs font-bold sm:text-sm">{eye}</div>
                    <div className="mt-0.5 text-[10px] opacity-75">
                      {eye === 'RE (OD)' ? 'Right Eye' : eye === 'LE (OS)' ? 'Left Eye' : 'Both Eyes'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Diagnosis, Procedure & IOL */}
        <div className="card-surface space-y-4 p-4 sm:p-5">
          <h4 className="font-display text-lg font-medium text-ivory-50">Diagnosis, Procedure & IOL</h4>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Chief Complaints & Duration</label>
              {aiBadge('chief_complaints')}
            </div>
            <input
              type="text"
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              placeholder="e.g. Gradual painless diminution of vision RE x 6 months"
              className="input-field text-xs"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-9">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label-field mb-0">Final Diagnosis *</label>
                {aiBadge('diagnosis')}
              </div>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => {
                  setDiagnosis(e.target.value);
                  if (!icd10Code) setIcd10Code(inferIcd10(e.target.value));
                }}
                placeholder="e.g. Senile Immature Cataract"
                className="input-field text-xs font-semibold"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="label-field">ICD-10</label>
              <input
                type="text"
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value.toUpperCase())}
                placeholder="H25.1"
                className="input-field font-mono text-xs font-bold uppercase"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-field mb-0">Procedure Performed *</label>
              {aiBadge('procedure_name')}
            </div>
            <input
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="e.g. Phacoemulsification with Foldable PCIOL"
              className="input-field text-xs font-semibold"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect label="Anaesthesia" value={anesthesia} onChange={setAnesthesia} options={ANESTHESIA_OPTIONS} />
            <CustomSelect label="Eye Dressing" value={dressingStatus} onChange={setDressingStatus} options={DRESSING_OPTIONS} />
          </div>

          {/* IOL Implant Details */}
          <div className="space-y-2.5 rounded-2xl border border-gold-400/30 bg-clinic-50/45 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-field mb-0">
                IOL Implant {requiresIol && !noIolConfirmed ? '* (Required)' : '(Optional)'}
              </span>
              <div className="flex items-center gap-2">
                {aiBadge('iol')}
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-ivory-300">
                  <input
                    type="checkbox"
                    checked={noIolConfirmed}
                    onChange={(e) => setNoIolConfirmed(e.target.checked)}
                    className="h-3.5 w-3.5 rounded"
                  />
                  No IOL / Aphakia
                </label>
              </div>
            </div>
            {!noIolConfirmed && (
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  value={iolModel}
                  onChange={(e) => setIolModel(e.target.value)}
                  placeholder="Model (e.g. Alcon AcrySof)"
                  className="input-field !min-h-[42px] text-xs font-semibold"
                />
                <input
                  value={iolPower}
                  onChange={(e) => setIolPower(e.target.value)}
                  placeholder="Power (+21.5 D)"
                  className="input-field !min-h-[42px] text-xs font-bold"
                />
                <input
                  value={iolBatch}
                  onChange={(e) => setIolBatch(e.target.value)}
                  placeholder="Serial / Batch No."
                  className="input-field !min-h-[42px] text-xs font-semibold"
                />
              </div>
            )}
          </div>

          {/* Pre-Op Vitals */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <div>
              <span className="mb-1 block text-[10px] font-semibold text-ivory-400">VA (RE)</span>
              <input value={vaRe} onChange={(e) => setVaRe(e.target.value)} placeholder="6/36" className="input-field !min-h-[40px] text-xs" />
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-semibold text-ivory-400">VA (LE)</span>
              <input value={vaLe} onChange={(e) => setVaLe(e.target.value)} placeholder="6/18" className="input-field !min-h-[40px] text-xs" />
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-semibold text-ivory-400">IOP (RE)</span>
              <input value={iopRe} onChange={(e) => setIopRe(e.target.value)} placeholder="14" className="input-field !min-h-[40px] text-xs" />
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-semibold text-ivory-400">IOP (LE)</span>
              <input value={iopLe} onChange={(e) => setIopLe(e.target.value)} placeholder="15" className="input-field !min-h-[40px] text-xs" />
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-semibold text-ivory-400">BP</span>
              <input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="130/80" className="input-field !min-h-[40px] text-xs" />
            </div>
            <div>
              <span className="mb-1 block text-[10px] font-semibold text-ivory-400">RBS</span>
              <input value={rbs} onChange={(e) => setRbs(e.target.value)} placeholder="124" className="input-field !min-h-[40px] text-xs" />
            </div>
          </div>

          {/* Allergies & Comorbidities */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="label-field mb-0">Drug Allergies *</label>
                <button
                  type="button"
                  onClick={() => {
                    setAllergies('NKDA');
                    setAllergyConfirmed(true);
                    setAiTaggedFields((p) => ({ ...p, allergies: false }));
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    allergyConfirmed && allergies.toUpperCase() === 'NKDA'
                      ? 'bg-emerald-700 text-white'
                      : 'border border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  Confirm NKDA
                </button>
              </div>
              <input
                type="text"
                value={allergies}
                onChange={(e) => {
                  setAllergies(e.target.value);
                  setAllergyConfirmed(Boolean(e.target.value.trim()));
                  setAiTaggedFields((p) => ({ ...p, allergies: false }));
                }}
                placeholder="Type allergy or tap Confirm NKDA"
                className={`input-field text-xs font-bold ${
                  allergies && allergies.toUpperCase() !== 'NKDA'
                    ? 'border-red-400 bg-red-50/70 text-red-800'
                    : ''
                }`}
              />
            </div>

            <div>
              <label className="label-field">Systemic Conditions</label>
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
                      className={`choice-chip !min-h-[34px] !px-2.5 !text-[11px] ${
                        active ? 'choice-chip-on' : 'choice-chip-off'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="label-field">Intra-Operative Course</label>
            <textarea
              rows={2}
              value={intraOpNotes}
              onChange={(e) => setIntraOpNotes(e.target.value)}
              placeholder="Uneventful clear corneal phacoemulsification…"
              className="input-field resize-none text-xs"
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <div>
              <label className="label-field">Admission</label>
              <input type="datetime-local" value={admissionAt} onChange={(e) => setAdmissionAt(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">Surgery</label>
              <input type="datetime-local" value={surgeryAt} onChange={(e) => setSurgeryAt(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">Discharge</label>
              <input type="datetime-local" value={dischargeAt} onChange={(e) => setDischargeAt(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
          </div>
        </div>

        {/* Section 3: Post-Op Medications */}
        <div className="card-surface space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ivory-50/10 pb-3">
            <h4 className="font-display text-lg font-medium text-ivory-50">Post-Op Drops & Tablets</h4>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setEyeDrops((p) => [
                    ...p,
                    { name: '', eye: 'Operated Eye', schedule: '4 times/day', duration: '14 Days' },
                  ])
                }
                className="btn-ghost !min-h-[36px] !px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 text-gold-500" /> Drop
              </button>
              <button
                type="button"
                onClick={() =>
                  setOralMeds((p) => [
                    ...p,
                    { name: '', dosage: '1 - 0 - 1', timing: 'After Food', duration: '5 Days' },
                  ])
                }
                className="btn-ghost !min-h-[36px] !px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 text-gold-500" /> Tablet
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {eyeDrops.map((d, idx) => (
              <div key={idx} className="grid gap-2 rounded-2xl border border-ivory-50/10 bg-ink-950 p-2.5 sm:grid-cols-12">
                <input
                  value={d.name}
                  onChange={(e) => setEyeDrops((p) => p.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                  placeholder="Eye Drop Name"
                  className="input-field !min-h-[38px] text-xs font-semibold sm:col-span-4"
                />
                <input
                  value={d.eye}
                  onChange={(e) => setEyeDrops((p) => p.map((x, i) => (i === idx ? { ...x, eye: e.target.value } : x)))}
                  placeholder="Operated Eye"
                  className="input-field !min-h-[38px] text-xs sm:col-span-2"
                />
                <input
                  value={d.schedule}
                  onChange={(e) => setEyeDrops((p) => p.map((x, i) => (i === idx ? { ...x, schedule: e.target.value } : x)))}
                  placeholder="Schedule / Taper"
                  className="input-field !min-h-[38px] text-xs sm:col-span-3"
                />
                <div className="flex items-center gap-1.5 sm:col-span-3">
                  <input
                    value={d.duration}
                    onChange={(e) => setEyeDrops((p) => p.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))}
                    placeholder="Duration"
                    className="input-field !min-h-[38px] flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setEyeDrops((p) => p.filter((_, i) => i !== idx))}
                    className="p-1.5 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {oralMeds.length > 0 && (
            <div className="space-y-2 border-t border-ivory-50/10 pt-3">
              <span className="label-field">Oral Tablets</span>
              {oralMeds.map((m, idx) => (
                <div key={idx} className="grid gap-2 rounded-2xl border border-ivory-50/10 bg-ink-950 p-2.5 sm:grid-cols-12">
                  <input
                    value={m.name}
                    onChange={(e) => setOralMeds((p) => p.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                    placeholder="Tablet Name"
                    className="input-field !min-h-[38px] text-xs font-semibold sm:col-span-4"
                  />
                  <input
                    value={m.dosage}
                    onChange={(e) => setOralMeds((p) => p.map((x, i) => (i === idx ? { ...x, dosage: e.target.value } : x)))}
                    placeholder="1 - 0 - 1"
                    className="input-field !min-h-[38px] text-xs sm:col-span-2"
                  />
                  <input
                    value={m.timing}
                    onChange={(e) => setOralMeds((p) => p.map((x, i) => (i === idx ? { ...x, timing: e.target.value } : x)))}
                    placeholder="After Food"
                    className="input-field !min-h-[38px] text-xs sm:col-span-3"
                  />
                  <div className="flex items-center gap-1.5 sm:col-span-3">
                    <input
                      value={m.duration}
                      onChange={(e) => setOralMeds((p) => p.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))}
                      placeholder="5 Days"
                      className="input-field !min-h-[38px] flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setOralMeds((p) => p.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Follow-Up, TPA & Safety Sign-Off */}
        <div className="card-surface space-y-4 p-4 sm:p-5">
          <h4 className="font-display text-lg font-medium text-ivory-50">Follow-Up, Insurance & Sign-Off</h4>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div>
              <label className="label-field">Day 1 Visit</label>
              <input type="date" value={followUp1} onChange={(e) => setFollowUp1(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">1 Week Visit</label>
              <input type="date" value={followUp2} onChange={(e) => setFollowUp2(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">Glasses Visit</label>
              <input type="date" value={followUp3} onChange={(e) => setFollowUp3(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">No Water (Days)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={headBathDays}
                onChange={(e) => setHeadBathDays(parseInt(e.target.value, 10) || 14)}
                className="input-field !min-h-[42px] text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <CustomSelect
              label="Case Type"
              value={caseType}
              onChange={(v) => setCaseType(v as 'Day Care' | 'In-Patient')}
              options={CASE_TYPE_OPTIONS}
            />
            <CustomSelect
              label="Payer / Scheme"
              value={billingCategory}
              onChange={setBillingCategory}
              options={BILLING_SCHEME_OPTIONS}
            />
            <CustomSelect
              label="Discharge Status"
              value={dischargeStatus}
              onChange={(v) => setDischargeStatus(v as 'Routine' | 'DAMA' | 'Referred')}
              options={DISCHARGE_STATUS_OPTIONS}
            />
          </div>

          {billingCategory !== 'Cash' && (
            <div className="grid gap-2.5 rounded-2xl border border-gold-400/30 bg-clinic-50/70 p-3.5 sm:grid-cols-3">
              <div>
                <label className="label-field">TPA / Insurer</label>
                <input value={tpaName} onChange={(e) => setTpaName(e.target.value)} placeholder="Star Health / MediAssist" className="input-field !min-h-[40px] text-xs" />
              </div>
              <div>
                <label className="label-field">Policy / Card No.</label>
                <input value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} placeholder="Policy / AB-ArK ID" className="input-field !min-h-[40px] text-xs" />
              </div>
              <div>
                <label className="label-field">Claim / Pre-Auth ID</label>
                <input value={claimNo} onChange={(e) => setClaimNo(e.target.value)} placeholder="Claim No." className="input-field !min-h-[40px] text-xs" />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label-field">Discharge Condition</label>
              <input value={dischargeCondition} onChange={(e) => setDischargeCondition(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">Prepared By</label>
              <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">Attendant Name</label>
              <input value={attendantName} onChange={(e) => setAttendantName(e.target.value)} placeholder="For sign-off" className="input-field !min-h-[42px] text-xs" />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gold-400/35 bg-clinic-50 p-4">
            <input
              type="checkbox"
              checked={safetyVerified}
              onChange={(e) => setSafetyVerified(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-gold-500 text-gold-500"
            />
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-ivory-50">
                <ShieldAlert className="h-4 w-4 text-gold-500" />
                Final Clinical Safety Verification
              </div>
              <p className="mt-0.5 text-ivory-300">
                Verified: <strong>Eye ({operatedEye || 'UNSELECTED'})</strong> ·{' '}
                <strong>IOL ({noIolConfirmed ? 'No IOL' : iolPower || 'MISSING'})</strong> ·{' '}
                <strong>Allergies ({allergies || 'UNCONFIRMED'})</strong> match Dr. Malathesh&apos;s OT notes.
              </p>
            </div>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="button" disabled={saving} onClick={handleSave} className="btn-primary w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Generate & Save Discharge Summary
          </button>
        </div>
      </div>

      {/* RIGHT PANE: DESKTOP LIVE A4 PREVIEW */}
      <div className="hidden xl:col-span-5 xl:block">
        <div className="sticky top-20 space-y-2.5">
          <div className="no-print flex items-center justify-between gap-2 rounded-2xl border border-ivory-50/10 bg-ink-900 px-3.5 py-2.5 shadow-soft">
            <span className="text-xs font-semibold text-ivory-200">Live 1-Page A4 Preview</span>
            <div className="inline-flex rounded-full border border-ivory-50/15 bg-ink-950 p-0.5 text-[11px]">
              {(['en', 'kn', 'bilingual'] as PrintLang[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPrintLang(m)}
                  className={`rounded-full px-2.5 py-0.5 font-semibold transition ${
                    printLang === m ? 'bg-ivory-50 text-ink-900' : 'text-ivory-400'
                  }`}
                >
                  {m === 'en' ? 'EN' : m === 'kn' ? 'ಕನ್ನಡ' : 'Bilingual'}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-2xl border border-ivory-50/10 bg-white p-2 shadow-soft">
            <PrintableDischargeSummary
              clinic={clinic}
              patient={patient}
              summary={livePreviewSummary}
              printLang={printLang}
            />
          </div>
        </div>
      </div>

      {/* MOBILE FULL-SCREEN A4 PREVIEW MODAL */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory-50/60 p-3 backdrop-blur-md xl:hidden">
          <div className="mx-auto max-w-2xl rounded-3xl bg-ink-900 p-3.5 shadow-lift">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-ivory-50/10 pb-2.5">
              <div className="inline-flex rounded-full border border-ivory-50/15 bg-ink-950 p-0.5 text-[11px]">
                {(['en', 'kn', 'bilingual'] as PrintLang[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPrintLang(m)}
                    className={`rounded-full px-2.5 py-1 font-semibold transition ${
                      printLang === m ? 'bg-ivory-50 text-ink-900' : 'text-ivory-400'
                    }`}
                  >
                    {m === 'en' ? 'EN' : m === 'kn' ? 'ಕನ್ನಡ' : 'Bilingual'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory-50/15 bg-ink-950 text-ivory-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PrintableDischargeSummary
              clinic={clinic}
              patient={patient}
              summary={livePreviewSummary}
              printLang={printLang}
            />
          </div>
        </div>
      )}
    </div>
  );
}
