import { useEffect, useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
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
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="step-badge">Step 1 · Find patient</span>
        <p className="text-sm font-light text-ivory-400">
          Search by mobile, name, or ID. One phone number can belong to multiple family members.
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mobile or name"
            className="input-field pr-12"
          />
          {searching && (
            <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-gold-400" />
          )}
        </div>

        {hasQuery && !searching && results.length === 0 && (
          <p className="text-sm text-ivory-500">
            No match for “{query}”.{' '}
            <button
              type="button"
              onClick={() => onRequestNewPatient(phoneDigits)}
              className="text-gold-300 underline underline-offset-4"
            >
              Register new patient
            </button>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="label-field mb-0">
          {hasQuery ? `Matches (${results.length})` : 'Recent'}
        </h3>

        {displayList.length === 0 ? (
          <div className="border border-dashed border-ivory-50/15 px-4 py-12 text-center text-sm font-light text-ivory-500">
            No patients yet. Tap <span className="text-ivory-200">New patient</span> below.
          </div>
        ) : (
          <ul className="divide-y divide-ivory-50/10 border border-ivory-50/10">
            {displayList.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => onSelectPatient(p)} className="list-row !border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-left">
                      <p className="truncate font-medium text-ivory-50">{p.full_name}</p>
                      <p className="mt-1 text-xs text-ivory-500">
                        {p.phone}
                        {p.age ? ` · ${p.age} yrs` : ''}
                        {p.village_address ? ` · ${p.village_address}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs uppercase tracking-widest text-gold-400">{p.patient_code}</span>
                  </div>
                  {p.next_follow_up && (
                    <p className="text-xs text-gold-400/90">Follow-up {formatDisplayDate(p.next_follow_up)}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ivory-50/10 bg-ink-950/95 p-4 backdrop-blur-md sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={() => onRequestNewPatient(phoneDigits.length >= 6 ? phoneDigits : '')}
            className="btn-primary !min-h-[52px] sm:max-w-xs"
          >
            <UserPlus className="h-4 w-4" />
            New patient
          </button>
        </div>
      </div>
    </div>
  );
}