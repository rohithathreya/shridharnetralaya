import { useEffect, useState } from 'react';
import { Search, UserPlus, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDisplayDate } from '../lib/dates';
import type { Patient } from '../types/database';

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  onRequestNewPatient: (prefillPhone: string) => void;
}

export function PatientSearch({ onSelectPatient, onRequestNewPatient }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadRecent() {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(8);
      if (data) setRecentPatients(data as Patient[]);
    }
    loadRecent();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setSearching(true);
      const digits = trimmed.replace(/\D/g, '');
      let q = supabase.from('patients').select('*');

      if (digits.length >= 4 && digits.length === trimmed.replace(/[\s+-]/g, '').length) {
        q = q.ilike('phone', `%${digits}%`);
      } else {
        q = q.or(
          `phone.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,patient_code.ilike.%${trimmed}%`,
        );
      }

      const { data } = await q.order('updated_at', { ascending: false }).limit(20);
      setResults((data as Patient[]) || []);
      setSearching(false);
    }, 220);

    return () => clearTimeout(handle);
  }, [query]);

  const phoneDigits = query.replace(/\D/g, '').slice(-10);
  const displayList = query.trim().length >= 2 ? results : recentPatients;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="mb-2 block text-sm font-bold text-slate-800">
          Step 1: Search Patient by Mobile Number, Name, or Patient ID
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter 10-digit mobile number (e.g. 9845012345) or name..."
              className="w-full rounded-xl border-2 border-slate-200 py-3.5 pl-11 pr-10 text-base font-semibold text-slate-900 placeholder:font-normal focus:border-clinic-600 focus:outline-none"
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-clinic-600" />
            )}
          </div>
          <button
            type="button"
            onClick={() => onRequestNewPatient(phoneDigits.length >= 6 ? phoneDigits : '')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clinic-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-clinic-700"
          >
            <UserPlus className="h-5 w-5" />
            <span>New Patient</span>
          </button>
        </div>

        {query.trim().length >= 2 && !searching && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-clinic-50 px-3.5 py-2.5 text-xs font-medium text-clinic-900">
            <span>
              {results.length === 0
                ? `No patient found for "${query}".`
                : `Found ${results.length} patient(s) matching "${query}". Multiple family members can share one phone number.`}
            </span>
            <button
              type="button"
              onClick={() => onRequestNewPatient(phoneDigits)}
              className="rounded-lg bg-white px-3 py-1.5 font-bold text-clinic-700 shadow-sm ring-1 ring-clinic-200 hover:bg-clinic-100"
            >
              + Add New Member {phoneDigits ? `on ${phoneDigits}` : ''}
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          {query.trim().length >= 2 ? 'Matching Patients — Tap to Open' : 'Recent Patients'}
        </h3>
        {displayList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No patients yet. Click <strong>New Patient</strong> above to register the first patient.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {displayList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p)}
                className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-clinic-600 hover:bg-clinic-50/40"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-slate-900">{p.full_name}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {p.patient_code}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600">
                  <span>
                    {p.age ? `${p.age} yrs` : 'Age —'} / {p.sex || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    <Phone className="h-3.5 w-3.5 text-clinic-600" />
                    {p.phone}
                  </span>
                  {p.village_address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {p.village_address}
                    </span>
                  )}
                </div>
                {p.next_follow_up && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                    <Calendar className="h-3 w-3" />
                    Next Follow-Up: {formatDisplayDate(p.next_follow_up)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
