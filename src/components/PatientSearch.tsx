import { useEffect, useState } from 'react';
import { UserPlus, Loader2, Search, User, Phone, MapPin, Calendar, Clock } from 'lucide-react';
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
        .limit(12);
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
  const hasQuery = query.trim().length >= 2;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="step-badge">Patient Directory</span>
            <h2 className="mt-1 text-xl font-black text-slate-900">Find or Register Patient</h2>
            <p className="mt-1 text-xs text-slate-500">
              Search by 10-digit mobile number, patient name, or ID. Multiple family members can share one mobile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRequestNewPatient(phoneDigits.length >= 6 ? phoneDigits : '')}
            className="btn-primary !min-h-[44px] text-xs"
          >
            <UserPlus className="h-4 w-4" />
            + New Patient Registration
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type 10-digit mobile number, patient name, or ID (e.g. 9845... or SN-26-0001)"
            className="input-field pl-12 pr-12 text-base font-medium"
          />
          {searching && (
            <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-clinic-600" />
          )}
        </div>

        {hasQuery && !searching && results.length === 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            No patient found matching “{query}”.{' '}
            <button
              type="button"
              onClick={() => onRequestNewPatient(phoneDigits)}
              className="font-bold underline text-amber-900"
            >
              Register this patient now →
            </button>
          </div>
        )}
      </header>

      {/* Patient List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          <span>{hasQuery ? `Search Results (${results.length})` : `Recently Visited (${recentPatients.length})`}</span>
          <span>Tap row to open file</span>
        </div>

        {displayList.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            No patients found. Click <strong className="text-slate-700">+ New Patient</strong> above to register the first patient.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {displayList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition hover:border-clinic-500 hover:shadow-md active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-clinic-50 px-2 py-0.5 text-xs font-extrabold text-clinic-800 border border-clinic-200">
                      {p.patient_code}
                    </span>
                    {p.next_follow_up && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Calendar className="h-3 w-3" />
                        Due {formatDisplayDate(p.next_follow_up)}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900 group-hover:text-clinic-800 transition truncate">
                    {p.full_name}
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Phone className="h-3 w-3 text-slate-400" /> {p.phone}
                    </span>
                    {p.age && <span>{p.age} Yrs</span>}
                    {p.sex && <span>({p.sex})</span>}
                    {p.village_address && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="h-3 w-3 text-slate-400" /> {p.village_address}
                      </span>
                    )}
                  </div>
                </div>

                {p.allergies && p.allergies.toUpperCase() !== 'NKDA' && (
                  <div className="mt-2 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    ⚠ Allergy: {p.allergies}
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
