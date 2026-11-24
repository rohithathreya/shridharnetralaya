import { useState } from 'react';
import {
  Eye,
  FileImage,
  FileText,
  Loader2,
  MessageCircle,
  Printer,
  Receipt,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDisplayDate, formatDisplayDateTime, formatINR } from '../lib/dates';
import {
  shareDischargeSummaryOnWhatsApp,
  shareDocumentLinkOnWhatsApp,
  shareInvoiceOnWhatsApp,
} from '../lib/whatsapp';
import { PrintableDischargeSummary, type PrintLang } from './PrintableDischargeSummary';
import { PrintableInvoice } from './PrintableInvoice';
import type {
  ClinicSettings,
  DischargeSummary,
  Invoice,
  Patient,
  PatientDocument,
} from '../types/database';

interface PatientTimelineProps {
  patient: Patient;
  clinic: ClinicSettings;
  summaries: DischargeSummary[];
  invoices: Invoice[];
  documents: PatientDocument[];
}

type PreviewState =
  | { kind: 'summary'; data: DischargeSummary }
  | { kind: 'invoice'; data: Invoice }
  | { kind: 'doc'; data: PatientDocument; url: string }
  | null;

export function PatientTimeline({
  patient,
  clinic,
  summaries,
  invoices,
  documents,
}: PatientTimelineProps) {
  const [preview, setPreview] = useState<PreviewState>(null);
  const [printLang, setPrintLang] = useState<PrintLang>('bilingual');
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  type TimelineEntry =
    | { kind: 'summary'; date: string; data: DischargeSummary }
    | { kind: 'invoice'; date: string; data: Invoice }
    | { kind: 'doc'; date: string; data: PatientDocument };

  const combined: TimelineEntry[] = [
    ...summaries.map((s) => ({ kind: 'summary' as const, date: s.created_at, data: s })),
    ...invoices.map((i) => ({ kind: 'invoice' as const, date: i.created_at, data: i })),
    ...documents.map((d) => ({ kind: 'doc' as const, date: d.created_at, data: d })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function openDocument(doc: PatientDocument, shareAfter = false) {
    setLoadingDocId(doc.id);
    const { data } = await supabase.storage
      .from('patient-docs')
      .createSignedUrl(doc.storage_path, 60 * 60 * 24 * 7);
    setLoadingDocId(null);

    if (!data?.signedUrl) return;
    if (shareAfter) {
      shareDocumentLinkOnWhatsApp(patient, doc.doc_type, doc.visit_date, data.signedUrl, clinic);
    } else {
      setPreview({ kind: 'doc', data: doc, url: data.signedUrl });
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="no-print label-field mb-0">
        Patient Complete History ({combined.length} Records)
      </h3>

      {combined.length === 0 ? (
        <div className="no-print card-surface border-dashed p-10 text-center text-sm text-ivory-400">
          No records yet for {patient.full_name}. Use the tabs above to create an Invoice, Discharge Summary, or upload a Prescription.
        </div>
      ) : (
        <div className="no-print space-y-2.5">
          {combined.map((entry) => {
            if (entry.kind === 'summary') {
              const s = entry.data;
              return (
                <div key={`ds-${s.id}`} className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clinic-100 text-gold-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ivory-50">
                          Discharge Summary · {s.operated_eye}
                        </span>
                        <span className="rounded-full bg-clinic-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-gold-600">
                          {s.summary_no}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-ivory-300">
                        {s.procedure_name} — {s.diagnosis}
                      </div>
                      <div className="mt-0.5 text-[11px] text-ivory-400">
                        {formatDisplayDateTime(s.created_at)}
                        {s.iol_power ? ` · IOL: ${s.iol_power}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview({ kind: 'summary', data: s })}
                      className="btn-ghost !min-h-[38px] !px-3.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" /> View / Print
                    </button>
                    <button
                      type="button"
                      onClick={() => shareDischargeSummaryOnWhatsApp(patient, s, clinic)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>
              );
            }

            if (entry.kind === 'invoice') {
              const inv = entry.data;
              return (
                <div
                  key={`inv-${inv.id}`}
                  className={`card-surface flex flex-wrap items-center justify-between gap-3 p-4 ${
                    inv.status === 'voided' ? 'border-red-300 bg-red-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ivory-50">
                          Receipt {inv.invoice_no} · {formatINR(inv.total)}
                        </span>
                        <span className="rounded-full bg-ink-850 px-2.5 py-0.5 text-[11px] font-semibold text-ivory-300">
                          {inv.payment_mode}
                        </span>
                        {inv.status === 'voided' && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            VOIDED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ivory-300">
                        {inv.items.map((x) => x.name).join(', ')}
                      </div>
                      <div className="mt-0.5 text-[11px] text-ivory-400">
                        {formatDisplayDateTime(inv.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview({ kind: 'invoice', data: inv })}
                      className="btn-ghost !min-h-[38px] !px-3.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" /> View / Print
                    </button>
                    <button
                      type="button"
                      onClick={() => shareInvoiceOnWhatsApp(patient, inv, clinic)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>
              );
            }

            const doc = entry.data;
            return (
              <div key={`doc-${doc.id}`} className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
                    <FileImage className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ivory-50">{doc.doc_type}</span>
                      <span className="rounded-full bg-ink-850 px-2.5 py-0.5 text-[11px] font-semibold text-ivory-300">
                        {formatDisplayDate(doc.visit_date)}
                      </span>
                    </div>
                    {doc.notes && <div className="text-xs text-ivory-300">{doc.notes}</div>}
                    <div className="mt-0.5 text-[11px] text-ivory-400">
                      Uploaded {formatDisplayDateTime(doc.created_at)} · {doc.file_size_kb} KB
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loadingDocId === doc.id}
                    onClick={() => openDocument(doc, false)}
                    className="btn-ghost !min-h-[38px] !px-3.5 text-xs"
                  >
                    {loadingDocId === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    Open
                  </button>
                  <button
                    type="button"
                    disabled={loadingDocId === doc.id}
                    onClick={() => openDocument(doc, true)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory-50/55 p-3 backdrop-blur-md">
          <div className="mx-auto max-w-4xl rounded-3xl border border-ivory-50/15 bg-ink-900 p-4 shadow-lift">
            <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-ivory-50/10 pb-3">
              <div className="font-display text-base font-semibold text-ivory-50">
                {preview.kind === 'summary'
                  ? `Discharge Summary (${preview.data.summary_no})`
                  : preview.kind === 'invoice'
                    ? `Receipt (${preview.data.invoice_no})`
                    : `${preview.data.doc_type} (${formatDisplayDate(preview.data.visit_date)})`}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {preview.kind === 'summary' && (
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
                {preview.kind !== 'doc' && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-primary !min-h-[38px] !px-4 text-xs"
                  >
                    <Printer className="h-4 w-4" /> Print / PDF
                  </button>
                )}
                {preview.kind === 'doc' && (
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !min-h-[38px] !px-4 text-xs"
                  >
                    Open Original Tab
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-full border border-ivory-50/15 p-2 text-ivory-300 hover:bg-ink-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {preview.kind === 'summary' && (
              <PrintableDischargeSummary
                clinic={clinic}
                patient={patient}
                summary={preview.data}
                printLang={printLang}
              />
            )}
            {preview.kind === 'invoice' && (
              <PrintableInvoice clinic={clinic} patient={patient} invoice={preview.data} />
            )}
            {preview.kind === 'doc' &&
              (preview.data.mime_type === 'application/pdf' ? (
                <iframe src={preview.url} className="h-[75vh] w-full rounded-xl border" title="Document PDF" />
              ) : (
                <img
                  src={preview.url}
                  alt={preview.data.doc_type}
                  className="mx-auto max-h-[80vh] rounded-xl border border-ivory-50/10 object-contain"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
