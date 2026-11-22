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
      <div className="card-surface p-4 sm:p-5">
        <label className="label-field">Step 1 · Search patient</label>
        <p className="mb-3 text-sm text-slate-400">
          Mobile number, name, or patient ID · multiple family members can share one phone
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="9845012345 or patient name…"
              className="input-field py-3.5 pl-11 pr-10 text-base"
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-clinic-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => onRequestNewPatient(phoneDigits.length >= 6 ? phoneDigits : '')}
            className="btn-primary py-3.5"
          >
            <UserPlus className="h-5 w-5" />
            New Patient
          </button>
        </div>

        {query.trim().length >= 2 && !searching && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-clinic-500/20 bg-clinic-900/20 px-3.5 py-2.5 text-xs text-clinic-200">
            <span>
              {results.length === 0
                ? `No match for “${query}”.`
                : `${results.length} patient(s) found.`}
            </span>
            <button
              type="button"
              onClick={() => onRequestNewPatient(phoneDigits)}
              className="rounded-lg border border-white/10 bg-obsidian-800 px-3 py-1.5 font-bold text-clinic-300 hover:bg-obsidian-700"
            >
              + Add member {phoneDigits ? `· ${phoneDigits}` : ''}
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="label-field mb-3">
          {query.trim().length >= 2 ? 'Matching patients' : 'Recent patients'}
        </h3>
        {displayList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-obsidian-900/40 p-10 text-center text-sm text-slate-500">
            No patients yet. Use <span className="text-clinic-400">New Patient</span> above to register the first one.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {displayList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p)}
                className="card-surface flex flex-col items-start p-4 text-left transition hover:border-clinic-500/35 hover:shadow-glow"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-base font-bold text-white">{p.full_name}</span>
                  <span className="rounded-md bg-obsidian-800 px-2 py-0.5 text-xs font-bold text-gold-400 ring-1 ring-gold-500/20">
                    {p.patient_code}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>
                    {p.age ? `${p.age} yrs` : 'Age —'} / {p.sex || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-clinic-400" />
                    {p.phone}
                  </span>
                  {p.village_address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      {p.village_address}
                    </span>
                  )}
                </div>
                {p.next_follow_up && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold-500/25 bg-gold-500/10 px-2.5 py-0.5 text-[11px] font-bold text-gold-300">
                    <Calendar className="h-3 w-3" />
                    Follow-up {formatDisplayDate(p.next_follow_up)}
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