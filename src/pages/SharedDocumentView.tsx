import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Lock, PhoneCall, Printer, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PrintableDischargeSummary, type PrintLang } from '../components/PrintableDischargeSummary';
import { PrintableInvoice } from '../components/PrintableInvoice';
import type { ClinicSettings, DischargeSummary, Invoice, Patient } from '../types/database';

interface ShareMeta {
  exists: boolean;
  type?: 'invoice' | 'discharge_summary';
  clinic_name?: string;
}

interface SharedPayload {
  type: 'invoice' | 'discharge_summary';
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'>;
  document: Invoice | DischargeSummary;
}

export function SharedDocumentView() {
  const { token } = useParams<{ token: string }>();
  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [payload, setPayload] = useState<SharedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [last4, setLast4] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [printLang, setPrintLang] = useState<PrintLang>('bilingual');

  useEffect(() => {
    async function checkMeta() {
      if (!token) {
        setMeta({ exists: false });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('get_shared_document_meta', { p_token: token });
      if (error || !data || !(data as ShareMeta).exists) {
        setMeta({ exists: false });
      } else {
        setMeta(data as ShareMeta);
      }
      setLoading(false);
    }
    checkMeta();
  }, [token]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    const digits = last4.replace(/\D/g, '');
    if (digits.length !== 4 || !token) {
      setVerifyError('Enter the last 4 digits of the registered mobile number.');
      return;
    }
    setVerifying(true);
    setVerifyError('');

    const { data, error } = await supabase.rpc('get_shared_document', {
      p_token: token,
      p_phone_last4: digits,
    });

    setVerifying(false);
    if (error || !data) {
      setVerifyError('Last 4 digits did not match our patient record. Please check and try again.');
      return;
    }
    setPayload(data as SharedPayload);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!meta?.exists) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ivory-50">Document Link Invalid</h1>
        <p className="mt-2 text-sm text-ivory-300">
          This record link could not be verified. Contact Shridhar Netralaya, Magadi at{' '}
          <strong>7026046677</strong>.
        </p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-[82vh] max-w-md flex-col justify-center px-4 py-10">
        <form onSubmit={handleUnlock} className="card-surface space-y-5 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ivory-50 text-gold-300 shadow-soft">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">{meta.clinic_name || 'Shridhar Netralaya'}</p>
              <h1 className="font-display text-xl font-semibold text-ivory-50">
                {meta.type === 'invoice' ? 'View Payment Receipt' : 'View Discharge Summary'}
              </h1>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ivory-300">
            For patient privacy, enter the <strong>last 4 digits</strong> of the mobile number registered at the hospital.
            <span className="mt-1 block font-kannada text-ivory-400">
              ರೋಗಿಯ ಗೌಪ್ಯತೆಗಾಗಿ, ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ನೋಂದಾಯಿಸಿದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯ ಕೊನೆಯ 4 ಅಂಕೆಗಳನ್ನು ನಮೂದಿಸಿ.
            </span>
          </p>

          <div>
            <label className="label-field">Last 4 digits of mobile number</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={last4}
              onChange={(e) => {
                setLast4(e.target.value.replace(/\D/g, '').slice(0, 4));
                setVerifyError('');
              }}
              placeholder="• • • •"
              className="input-field text-center font-mono text-2xl font-bold tracking-[0.35em]"
            />
          </div>

          {verifyError && (
            <p className="rounded-2xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {verifyError}
            </p>
          )}

          <button type="submit" disabled={verifying || last4.length !== 4} className="btn-primary w-full">
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {verifying ? 'Verifying…' : 'Unlock Record'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-3 py-5 sm:px-6">
      <div className="no-print card-surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-xs sm:text-sm">
          <div className="font-display text-lg font-semibold text-ivory-50">
            {payload.type === 'invoice' ? 'Payment Receipt' : 'Surgical Discharge Summary'}
          </div>
          <div className="text-xs text-ivory-400">
            {payload.patient.full_name} · MRD: <strong className="text-ivory-100">{payload.patient.patient_code}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {payload.type === 'discharge_summary' && (
            <div className="inline-flex rounded-full border border-ivory-50/15 bg-ink-950 p-0.5 text-xs">
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
          )}

          <a
            href={`tel:${payload.clinic.emergency_phone || payload.clinic.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 transition"
          >
            <PhoneCall className="h-3.5 w-3.5 text-amber-800" />
            24/7 Emergency
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-ivory-50 px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-gold-500 hover:text-white transition"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ivory-50/10 bg-white p-2 shadow-soft sm:p-4">
        {payload.type === 'invoice' ? (
          <PrintableInvoice
            clinic={payload.clinic}
            patient={payload.patient}
            invoice={payload.document as Invoice}
          />
        ) : (
          <PrintableDischargeSummary
            clinic={payload.clinic}
            patient={payload.patient}
            summary={payload.document as DischargeSummary}
            printLang={printLang}
          />
        )}
      </div>
    </div>
  );
}
