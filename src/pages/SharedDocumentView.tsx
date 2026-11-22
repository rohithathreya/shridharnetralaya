import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, PhoneCall, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PrintableDischargeSummary } from '../components/PrintableDischargeSummary';
import { PrintableInvoice } from '../components/PrintableInvoice';
import type { ClinicSettings, DischargeSummary, Invoice, Patient } from '../types/database';

interface SharedPayload {
  type: 'invoice' | 'discharge_summary';
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'>;
  document: Invoice | DischargeSummary;
}

export function SharedDocumentView() {
  const { token } = useParams<{ token: string }>();
  const [payload, setPayload] = useState<SharedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('get_shared_document', { p_token: token });
      if (error || !data) {
        setNotFound(true);
      } else {
        setPayload(data as SharedPayload);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-clinic-600" />
      </div>
    );
  }

  if (notFound || !payload) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">Document Link Invalid</h1>
        <p className="mt-1 text-sm text-slate-600">
          This record link could not be verified. Please contact Shridhar Netralaya, Magadi at{' '}
          <strong>7026046677</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-6 space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="text-xs sm:text-sm">
          <div className="font-extrabold text-stone-900 font-display text-base">
            {payload.type === 'invoice' ? 'Payment Receipt' : 'Surgical Discharge Summary'}
          </div>
          <div className="text-stone-500 font-medium">
            {payload.patient.full_name} ({payload.patient.patient_code})
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${payload.clinic.emergency_phone || payload.clinic.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100"
          >
            <PhoneCall className="h-3.5 w-3.5 text-amber-800" /> 24/7 Emergency Call
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 sm:p-4 shadow-sm">
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
          />
        )}
      </div>
    </div>
  );
}
