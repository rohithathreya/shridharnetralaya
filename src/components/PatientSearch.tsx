import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Loader2, MapPin, Phone, Search, UserPlus, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDisplayDate } from '../lib/dates';
import type { Patient } from '../types/database';

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  onRequestNewPatient: (prefillPhone: string) => void;
}

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        .limit(14);
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

    const handle = window.setTimeout(async () => {
      setSearching(true);
      const digits = trimmed.replace(/\D/g, '');
      const isPurePhoneSearch =
        digits.length >= 4 && digits.length === trimmed.replace(/[\s+-]/g, '').length;

      let q = supabase.from('patients').select('*');
      if (isPurePhoneSearch) {
        q = q.ilike('phone', `%${digits}%`);
      } else {
        q = q.or(
          `phone.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,patient_code.ilike.%${trimmed}%,village_address.ilike.%${trimmed}%`,
        );
      }

      const { data } = await q.order('updated_at', { ascending: false }).limit(25);
      setResults((data as Patient[]) || []);
      setSearching(false);
    }, 180);

    return () => window.clearTimeout(handle);
  }, [query]);

  const phoneDigits = query.replace(/\D/g, '').slice(-10);
  const hasQuery = query.trim().length >= 2;
  const displayList = hasQuery ? results : recentPatients;
  const showFamilyAddBanner = hasQuery && phoneDigits.length === 10 && results.length > 0;

  return (
    <div className="space-y-5">
      {/* Spotlight Search Box */}
      <div className="card-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-500" />
            <input
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mobile, MRD No., name, or village…"
              className="input-field !min-h-[50px] pl-11 pr-11 text-sm font-medium"
            />
            {searching && (
              <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold-500" />
            )}
          </div>

          <button
            type="button"
            onClick={() => onRequestNewPatient(phoneDigits.length >= 6 ? phoneDigits : '')}
            className="btn-primary !min-h-[50px] hidden shrink-0 sm:inline-flex"
          >
            <UserPlus className="h-4 w-4" />
            New Patient
          </button>
        </div>

        {/* Family-shared mobile helper */}
        {showFamilyAddBanner && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-gold-400/30 bg-clinic-50 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-ivory-200">
              <Users className="h-4 w-4 shrink-0 text-gold-500" />
              <span>
                <strong>{results.length}</strong> patient(s) on <strong>{phoneDigits}</strong>. Adding a spouse or parent on this same phone?
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRequestNewPatient(phoneDigits)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ivory-50 px-3.5 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gold-500 hover:text-white transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add family member
            </button>
          </div>
        )}

        {hasQuery && !searching && results.length === 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-ivory-50/20 bg-ink-950 px-4 py-3.5 text-xs text-ivory-300">
            <span>No match for &ldquo;{query}&rdquo;.</span>
            <button
              type="button"
              onClick={() => onRequestNewPatient(phoneDigits)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ivory-50 px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-gold-500 hover:text-white transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register New Patient
            </button>
          </div>
        )}
      </div>

      {/* Patient Roster */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="label-field mb-0">
            {hasQuery ? `Search Results (${results.length})` : 'Recent Patients'}
          </h3>
          {!hasQuery && (
            <span className="text-[11px] text-ivory-400">Tap any card to open chart</span>
          )}
        </div>

        {displayList.length === 0 ? (
          <div className="card-surface border-dashed px-4 py-12 text-center text-sm text-ivory-400">
            No patients registered yet. Tap <strong>New Patient</strong> to register the first patient.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {displayList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p)}
                className="card-surface group flex items-start gap-3.5 p-4 text-left transition duration-150 active:scale-[0.985] hover:border-gold-400/50 hover:shadow-lift"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clinic-50 font-display text-sm font-semibold text-gold-600 ring-1 ring-gold-400/20 transition group-hover:bg-ivory-50 group-hover:text-gold-300">
                  {initials(p.full_name)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ivory-50">{p.full_name}</p>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ivory-500 transition group-hover:translate-x-0.5 group-hover:text-gold-500" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-ink-850 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-ivory-200">
                      {p.patient_code}
                    </span>
                    <span className="text-[11px] text-ivory-400">
                      {p.age ? `${p.age}y` : '—'}/{p.sex || '—'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5 text-[11px] text-ivory-400">
                    <span className="inline-flex items-center gap-1 font-medium text-ivory-200">
                      <Phone className="h-3 w-3 text-gold-500" />
                      {p.phone}
                    </span>
                    {p.village_address && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.village_address}</span>
                      </span>
                    )}
                  </div>

                  {p.next_follow_up && (
                    <div className="inline-flex items-center gap-1 pt-0.5 text-[11px] font-semibold text-gold-600">
                      <Calendar className="h-3 w-3" />
                      Follow-up {formatDisplayDate(p.next_follow_up)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thumb-Zone Mobile FAB for New Patient */}
      <div className="mobile-float-dock sm:hidden">
        <button
          type="button"
          onClick={() => onRequestNewPatient(phoneDigits.length >= 6 ? phoneDigits : '')}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FBF9F6] text-xs font-bold text-[#141210] active:scale-[0.98] transition"
        >
          <UserPlus className="h-4 w-4" />
          Register New Patient
        </button>
      </div>
    </div>
  );
}
