import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomSelect, CustomSelectOption } from './CustomSelect';
import type { Patient } from '../types/database';

const SEX_OPTIONS: CustomSelectOption[] = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

const COMORBIDITY_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'Cardiac / IHD',
  'Asthma / COPD',
  'Thyroid',
  'Blood Thinners',
];
const WIZARD_STEPS = ['Contact & MRD', 'Demographics', 'Clinical'] as const;

interface PatientModalProps {
  initialPhone?: string;
  editingPatient?: Patient | null;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
}

function friendlyDbError(code: string | undefined, message: string): string {
  if (code === '23505' || message.includes('patients_patient_code_key')) {
    return 'This MRD No. is already assigned to another patient. Enter a unique MRD No. or leave blank to auto-generate.';
  }
  if (message.includes('permission denied for table patients')) {
    return 'Run supabase/migrations/002_table_grants.sql in Supabase SQL Editor, then try again.';
  }
  if (message.includes('row-level security')) {
    return 'Session expired. Sign out and sign in with your PIN again.';
  }
  return message;
}

export function PatientModal({ initialPhone = '', editingPatient, onClose, onSaved }: PatientModalProps) {
  const isEdit = Boolean(editingPatient);
  const [step, setStep] = useState(0);

  const [mrdNo, setMrdNo] = useState(editingPatient?.patient_code || '');
  const [fullName, setFullName] = useState(editingPatient?.full_name || '');
  const [phone, setPhone] = useState(editingPatient?.phone || initialPhone);
  const [age, setAge] = useState(editingPatient?.age ? String(editingPatient.age) : '');
  const [sex, setSex] = useState<'M' | 'F' | 'O'>(editingPatient?.sex || 'M');
  const [village, setVillage] = useState(editingPatient?.village_address || '');
  const [allergies, setAllergies] = useState(editingPatient?.allergies || '');
  const [comorbidities, setComorbidities] = useState<string[]>(editingPatient?.comorbidities || []);
  const [nextFollowUp, setNextFollowUp] = useState(editingPatient?.next_follow_up || '');
  const [notes, setNotes] = useState(editingPatient?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  function toggleComorbidity(item: string) {
    setComorbidities((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  function validateContact(): string | null {
    if (!fullName.trim()) return 'Enter the patient full name.';
    if (cleanPhone.length !== 10) return 'Enter a valid 10-digit mobile number.';
    if (isEdit && !mrdNo.trim()) return 'MRD No. cannot be blank when editing an existing patient.';
    return null;
  }

  function goNext() {
    if (step === 0) {
      const err = validateContact();
      if (err) {
        setError(err);
        return;
      }
    }
    setError('');
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSave() {
    const err = validateContact();
    if (err) {
      setError(err);
      if (!isEdit) setStep(0);
      return;
    }

    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      full_name: fullName.trim(),
      phone: cleanPhone,
      age: age ? parseInt(age, 10) : null,
      sex,
      village_address: village.trim(),
      allergies: allergies.trim(),
      comorbidities,
      next_follow_up: nextFollowUp || null,
      notes: notes.trim(),
    };

    if (mrdNo.trim()) {
      payload.patient_code = mrdNo.trim().toUpperCase();
    } else if (!isEdit) {
      payload.patient_code = '';
    }

    const res = editingPatient
      ? await supabase.from('patients').update(payload).eq('id', editingPatient.id).select().single()
      : await supabase.from('patients').insert(payload).select().single();

    setSaving(false);
    if (res.error || !res.data) {
      setError(friendlyDbError(res.error?.code, res.error?.message || 'Could not save patient'));
      return;
    }

    onSaved(res.data as Patient);
  }

  const contactFields = (
    <div className="space-y-4">
      <div>
        <label className="label-field">MRD No. (Hospital Record ID)</label>
        <input
          type="text"
          value={mrdNo}
          onChange={(e) => setMrdNo(e.target.value.toUpperCase())}
          placeholder={isEdit ? 'e.g. MRD-26-0042' : 'Blank = auto-generate, or enter paper register MRD'}
          className="input-field font-mono text-sm font-semibold uppercase tracking-wider"
        />
        <p className="mt-1 text-[11px] text-ivory-400">
          Permanent patient ID. Editable anytime to match existing clinic registers.
        </p>
      </div>
      <div>
        <label className="label-field">Mobile Number (10 digits) *</label>
        <input
          type="tel"
          inputMode="numeric"
          autoFocus={!isEdit && step === 0}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Patient or family attendant mobile"
          className="input-field text-base tracking-wide"
        />
        <p className="mt-1 text-[11px] text-ivory-400">
          Multiple family members can safely share one mobile number.
        </p>
      </div>
      <div>
        <label className="label-field">Full Name *</label>
        <input
          type="text"
          autoCapitalize="words"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="As on Aadhaar / hospital records"
          className="input-field text-base font-medium"
        />
      </div>
    </div>
  );

  const profileFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Age (years)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 64"
            className="input-field"
          />
        </div>
        <CustomSelect
          label="Sex"
          value={sex}
          onChange={(val) => setSex(val as 'M' | 'F' | 'O')}
          options={SEX_OPTIONS}
        />
      </div>
      <div>
        <label className="label-field">Village / Town / Area</label>
        <input
          type="text"
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          placeholder="e.g. Kudur, Solur, Magadi Town"
          className="input-field"
        />
      </div>
    </div>
  );

  const clinicalFields = (
    <div className="space-y-4">
      <div>
        <label className="label-field">Systemic Conditions · tap all that apply</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {COMORBIDITY_OPTIONS.map((item) => {
            const on = comorbidities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleComorbidity(item)}
                className={`choice-chip ${on ? 'choice-chip-on' : 'choice-chip-off'}`}
              >
                {on ? '✓ ' : '+ '}
                {item}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="label-field mb-0">Drug Allergies</label>
          <button
            type="button"
            onClick={() => setAllergies('NKDA')}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
              allergies.toUpperCase() === 'NKDA'
                ? 'bg-emerald-700 text-white'
                : 'border border-ivory-50/20 bg-ink-950 text-ivory-300 hover:border-gold-400'
            }`}
          >
            {allergies.toUpperCase() === 'NKDA' ? '✓ NKDA Confirmed' : 'Tap if No Known Allergies'}
          </button>
        </div>
        <input
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Enter drug allergy or tap NKDA above"
          className="input-field"
        />
      </div>
      <div>
        <label className="label-field">Next Follow-Up Date</label>
        <input
          type="date"
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="label-field">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Attendant relationship, previous eye surgery, etc."
          className="input-field resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="sheet-modal" role="dialog" aria-modal="true">
      <div className="sheet-panel sm:max-h-[88dvh]">
        <header className="flex items-start justify-between gap-3 border-b border-ivory-50/10 px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{isEdit ? 'Edit Patient Profile' : 'New Registration'}</p>
            <h2 className="mt-1 truncate font-display text-2xl text-ivory-50 sm:text-3xl">
              {isEdit ? editingPatient!.full_name : 'Register Patient'}
            </h2>
            {!isEdit && (
              <>
                <div className="wizard-progress mt-3">
                  {WIZARD_STEPS.map((label, i) => (
                    <div key={label} className={`wizard-dot ${i <= step ? 'wizard-dot-active' : ''}`} title={label} />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-ivory-400">
                  Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory-50/15 bg-ink-950 text-ivory-400 hover:text-ivory-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isEdit ? (
            <div className="space-y-6">
              {contactFields}
              <div className="border-t border-ivory-50/10 pt-5">{profileFields}</div>
              <div className="border-t border-ivory-50/10 pt-5">{clinicalFields}</div>
            </div>
          ) : (
            <>
              {step === 0 && contactFields}
              {step === 1 && profileFields}
              {step === 2 && clinicalFields}
            </>
          )}
          {error && (
            <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {error}
            </p>
          )}
        </div>

        <footer className="wizard-footer">
          {isEdit ? (
            <>
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Changes
              </button>
            </>
          ) : step < WIZARD_STEPS.length - 1 ? (
            <>
              {step > 0 ? (
                <button type="button" onClick={goBack} className="btn-ghost flex-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <button type="button" onClick={onClose} className="btn-ghost flex-1">
                  Cancel
                </button>
              )}
              <button type="button" onClick={goNext} className="btn-primary flex-[2]">
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={goBack} className="btn-ghost flex-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-[2]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create Patient Record
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
