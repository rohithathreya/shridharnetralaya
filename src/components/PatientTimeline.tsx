import { useState } from 'react';
import {
  FileText,
  Receipt,
  FileImage,
  Printer,
  MessageCircle,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDisplayDate, formatDisplayDateTime, formatINR } from '../lib/dates';
import {
  shareDischargeSummaryOnWhatsApp,
  shareDocumentLinkOnWhatsApp,
  shareInvoiceOnWhatsApp,
} from '../lib/whatsapp';
import { PrintableDischargeSummary } from './PrintableDischargeSummary';
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
      <h3 className="no-print text-xs font-extrabold uppercase tracking-wider text-slate-500">
        Patient Complete History ({combined.length} Records)
      </h3>

      {combined.length === 0 ? (
        <div className="no-print rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No records yet for {patient.full_name}. Use the tabs above to generate an Invoice, Discharge Summary, or upload a Prescription.
        </div>
      ) : (
        <div className="no-print space-y-2.5">
          {combined.map((entry) => {
            if (entry.kind === 'summary') {
              const s = entry.data;
              return (
                <div
                  key={`ds-${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          Discharge Summary • {s.operated_eye}
                        </span>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                          {s.summary_no}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-600">
                        {s.procedure_name} — {s.diagnosis}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {formatDisplayDateTime(s.created_at)}
                        {s.iol_power ? ` • IOL: ${s.iol_power}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview({ kind: 'summary', data: s })}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> View / Print
                    </button>
                    <button
                      type="button"
                      onClick={() => shareDischargeSummaryOnWhatsApp(patient, s, clinic)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
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
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm ${
                    inv.status === 'voided'
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          Receipt {inv.invoice_no} • {formatINR(inv.total)}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {inv.payment_mode}
                        </span>
                        {inv.status === 'voided' && (
                          <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            VOIDED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        {inv.items.map((x) => x.name).join(', ')}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {formatDisplayDateTime(inv.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview({ kind: 'invoice', data: inv })}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> View / Print
                    </button>
                    <button
                      type="button"
                      onClick={() => shareInvoiceOnWhatsApp(patient, inv, clinic)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>
              );
            }

            const doc = entry.data;
            return (
              <div
                key={`doc-${doc.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <FileImage className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{doc.doc_type}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {formatDisplayDate(doc.visit_date)}
                      </span>
                    </div>
                    {doc.notes && <div className="text-xs text-slate-600">{doc.notes}</div>}
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      Uploaded {formatDisplayDateTime(doc.created_at)} • {doc.file_size_kb} KB
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loadingDocId === doc.id}
                    onClick={() => openDocument(doc, false)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                  >
                    {loadingDocId === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    Open Photo
                  </button>
                  <button
                    type="button"
                    disabled={loadingDocId === doc.id}
                    onClick={() => openDocument(doc, true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Preview / Print Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 p-3 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="text-sm font-extrabold text-slate-900">
                {preview.kind === 'summary'
                  ? `Discharge Summary (${preview.data.summary_no})`
                  : preview.kind === 'invoice'
                    ? `Receipt (${preview.data.invoice_no})`
                    : `${preview.data.doc_type} (${formatDisplayDate(preview.data.visit_date)})`}
              </div>
              <div className="flex items-center gap-2">
                {preview.kind !== 'doc' && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <Printer className="h-4 w-4" /> Print / Save PDF
                  </button>
                )}
                {preview.kind === 'doc' && (
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                  >
                    Open Original Tab
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {preview.kind === 'summary' && (
              <PrintableDischargeSummary clinic={clinic} patient={patient} summary={preview.data} />
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
                  className="mx-auto max-h-[80vh] rounded-xl border border-slate-200 object-contain"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
