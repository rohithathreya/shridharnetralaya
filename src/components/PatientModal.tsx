import { useState } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types/database';

const COMORBIDITY_OPTIONS = ['Diabetes', 'Hypertension', 'Cardiac / IHD', 'Asthma / COPD', 'Thyroid', 'Blood Thinners'];
const WIZARD_STEPS = ['Contact', 'Profile', 'Clinical'] as const;

interface PatientModalProps {
  initialPhone?: string;
  editingPatient?: Patient | null;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
}

function friendlyDbError(message: string): string {
  if (message.includes('permission denied for table patients')) {
    return 'Run supabase/migrations/002_table_grants.sql in Supabase SQL Editor, then try again.';
  }
  if (message.includes('row-level security')) {
    return 'Lock and sign in with your PIN again.';
  }
  return message;
}

export function PatientModal({ initialPhone = '', editingPatient, onClose, onSaved }: PatientModalProps) {
  const isEdit = Boolean(editingPatient);
  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState(editingPatient?.full_name || '');
  const [phone, setPhone] = useState(editingPatient?.phone || initialPhone);
  const [age, setAge] = useState(editingPatient?.age ? String(editingPatient.age) : '');
  const [sex, setSex] = useState<'M' | 'F' | 'O'>(editingPatient?.sex || 'M');
  const [village, setVillage] = useState(editingPatient?.village_address || '');
  const [allergies, setAllergies] = useState(editingPatient?.allergies || 'NKDA');
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
    if (!fullName.trim()) return 'Enter the patient name.';
    if (cleanPhone.length !== 10) return 'Enter a valid 10-digit mobile number.';
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

    const payload = {
      full_name: fullName.trim(),
      phone: cleanPhone,
      age: age ? parseInt(age, 10) : null,
      sex,
      village_address: village.trim(),
      allergies: allergies.trim() || 'NKDA',
      comorbidities,
      next_follow_up: nextFollowUp || null,
      notes: notes.trim(),
    };

    const res = editingPatient
      ? await supabase.from('patients').update(payload).eq('id', editingPatient.id).select().single()
      : await supabase.from('patients').insert(payload).select().single();

    setSaving(false);
    if (res.error || !res.data) {
      setError(friendlyDbError(res.error?.message || 'Could not save patient'));
      return;
    }

    onSaved(res.data as Patient);
  }

  const contactFields = (
    <div className="space-y-5">
      <div>
        <label className="label-field">Mobile number</label>
        <input
          type="tel"
          inputMode="numeric"
          autoFocus={!isEdit && step === 0}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10 digits"
          className="input-field text-lg tracking-wide"
        />
      </div>
      <div>
        <label className="label-field">Full name</label>
        <input
          type="text"
          autoCapitalize="words"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="As on records"
          className="input-field text-lg"
        />
      </div>
    </div>
  );

  const profileFields = (
    <div className="space-y-5">
      <div>
        <label className="label-field">Age (years)</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Optional"
          className="input-field"
        />
      </div>
      <div>
        <span className="label-field">Sex</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['M', 'F', 'O'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSex(opt)}
              className={`choice-chip ${sex === opt ? 'choice-chip-on' : 'choice-chip-off'}`}
            >
              {opt === 'M' ? 'Male' : opt === 'F' ? 'Female' : 'Other'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label-field">Village / town</label>
        <input
          type="text"
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          placeholder="Optional"
          className="input-field"
        />
      </div>
    </div>
  );

  const clinicalFields = (
    <div className="space-y-5">
      <div>
        <label className="label-field">Conditions · tap all that apply</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMORBIDITY_OPTIONS.map((item) => {
            const on = comorbidities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleComorbidity(item)}
                className={`choice-chip !min-h-[40px] normal-case tracking-normal ${on ? 'choice-chip-on' : 'choice-chip-off'}`}
              >
                {on ? '✓ ' : ''}
                {item}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label-field">Drug allergies</label>
        <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="input-field" />
        <button
          type="button"
          onClick={() => setAllergies('NKDA')}
          className="mt-2 text-xs text-gold-400 underline underline-offset-4"
        >
          Set NKDA
        </button>
      </div>
      <div>
        <label className="label-field">Next follow-up</label>
        <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} className="input-field" />
      </div>
      <div>
        <label className="label-field">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional"
          className="input-field resize-none"
        />
      </div>
      {!isEdit && step === 2 && (
        <div className="border border-ivory-50/10 bg-ink-950/50 p-4 text-sm font-light text-ivory-300">
          <p className="eyebrow mb-3">Summary</p>
          <p className="text-ivory-50">{fullName}</p>
          <p className="mt-1">{cleanPhone}</p>
          <p className="mt-1 text-ivory-500">
            {age ? `${age} yrs` : 'Age —'} · {sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : 'Other'}
            {village ? ` · ${village}` : ''}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="sheet-modal" role="dialog" aria-modal="true">
      <div className="sheet-panel sm:max-h-[85dvh]">
        <header className="flex items-start justify-between gap-3 border-b border-ivory-50/10 px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{isEdit ? 'Edit patient' : 'New registration'}</p>
            <h2 className="mt-2 truncate font-display text-2xl text-ivory-50">
              {isEdit ? editingPatient!.patient_code : 'Create patient ID'}
            </h2>
            {!isEdit && (
              <>
                <div className="wizard-progress mt-4">
                  {WIZARD_STEPS.map((label, i) => (
                    <div key={label} className={`wizard-dot ${i <= step ? 'wizard-dot-active' : ''}`} title={label} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-ivory-500">
                  Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-ivory-50/15 text-ivory-400"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isEdit ? (
            <div className="space-y-10">
              {contactFields}
              <div className="border-t border-ivory-50/10 pt-8">{profileFields}</div>
              <div className="border-t border-ivory-50/10 pt-8">{clinicalFields}</div>
            </div>
          ) : (
            <>
              {step === 0 && contactFields}
              {step === 1 && profileFields}
              {step === 2 && clinicalFields}
            </>
          )}
          {error && (
            <p className="mt-4 border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
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
                Save
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
                Create ID
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}