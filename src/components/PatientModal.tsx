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
      setError(res.error?.message || 'Could not save patient');
      return;
    }

    onSaved(res.data as Patient);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {editingPatient ? `Edit Patient (${editingPatient.patient_code})` : 'Register New Patient'}
            </h2>
            <p className="text-xs text-slate-500">
              Unique Patient ID is generated automatically upon saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Mobile Number (10 digits) *</label>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-clinic-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Patient Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Gowda"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-clinic-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Age (Years)</label>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 64"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-clinic-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Sex</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['M', 'F', 'O'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSex(opt)}
                    className={`rounded-xl border py-2.5 text-sm font-bold ${
                      sex === opt
                        ? 'border-clinic-600 bg-clinic-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt === 'M' ? 'Male' : opt === 'F' ? 'Female' : 'Other'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Village / Town / Address</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Solur, Magadi Taluk"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-clinic-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Medical Conditions (Tap all that apply)</label>
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
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <label className="mb-1 block text-xs font-bold text-slate-700">Known Drug Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="NKDA (No Known Drug Allergy)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-clinic-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Next Follow-Up Date</label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-clinic-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Quick Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Right eye operated in 2024, lives with son Suresh"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-clinic-600 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-clinic-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-clinic-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingPatient ? 'Save Changes' : 'Create Patient ID'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
