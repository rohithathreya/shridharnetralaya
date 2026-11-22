import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types/database';

const COMORBIDITY_OPTIONS = ['Diabetes', 'Hypertension', 'Cardiac / IHD', 'Asthma / COPD', 'Thyroid', 'Blood Thinners'];

interface PatientModalProps {
  initialPhone?: string;
  editingPatient?: Patient | null;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
}

function friendlyDbError(message: string): string {
  if (message.includes('permission denied for table patients')) {
    return 'Database access not configured. In Supabase SQL Editor, run supabase/migrations/002_table_grants.sql, then try again.';
  }
  if (message.includes('row-level security')) {
    return 'Session expired or missing staff role. Lock the desk and sign in with your PIN again.';
  }
  return message;
}

export function PatientModal({ initialPhone = '', editingPatient, onClose, onSaved }: PatientModalProps) {
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

  function toggleComorbidity(item: string) {
    setComorbidities((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md">
      <div className="card-surface max-h-[92vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              {editingPatient ? `Edit · ${editingPatient.patient_code}` : 'Register new patient'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Patient ID is assigned automatically on save.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Mobile *</label>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9845012345"
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Full name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ramesh Gowda"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Age</label>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Sex</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['M', 'F', 'O'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSex(opt)}
                    className={`rounded-xl border py-2.5 text-sm font-bold ${
                      sex === opt
                        ? 'border-clinic-500/50 bg-clinic-600/30 text-clinic-100'
                        : 'border-white/10 bg-obsidian-950/60 text-slate-400'
                    }`}
                  >
                    {opt === 'M' ? 'Male' : opt === 'F' ? 'Female' : 'Other'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label-field">Village / address</label>
            <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label-field">Medical conditions</label>
            <div className="flex flex-wrap gap-1.5">
              {COMORBIDITY_OPTIONS.map((item) => {
                const selected = comorbidities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleComorbidity(item)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      selected
                        ? 'bg-gold-600/80 text-obsidian-950'
                        : 'border border-white/10 bg-obsidian-800/80 text-slate-400'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Drug allergies</label>
              <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Next follow-up</label>
              <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-field">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingPatient ? 'Save' : 'Create patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}