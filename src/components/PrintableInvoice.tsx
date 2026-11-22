import { formatDisplayDateTime, formatINR } from '../lib/dates';
import type { ClinicSettings, Invoice, Patient } from '../types/database';

interface PrintableInvoiceProps {
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'> & { phone?: string };
  invoice: Invoice;
}

export function PrintableInvoice({ clinic, patient, invoice }: PrintableInvoiceProps) {
  return (
    <div className="print-sheet-a5 relative mx-auto rounded-xl border border-slate-300 bg-white p-5 text-xs text-slate-950">
      {invoice.status === 'voided' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-12 rounded-xl border-4 border-red-600/60 px-6 py-2 text-4xl font-black uppercase tracking-widest text-red-600/40">
            VOIDED
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-clinic-900">
            {clinic.clinic_name}
          </h1>
          <div className="text-[11px] font-semibold text-slate-700">{clinic.tagline}</div>
          <div className="mt-0.5 text-[10.5px] text-slate-600">{clinic.address}</div>
          <div className="mt-0.5 text-[10.5px] font-semibold text-slate-800">
            Phone: {clinic.phone}
            {clinic.kpme_reg_no ? ` • KPME Reg: ${clinic.kpme_reg_no}` : ''}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block rounded bg-slate-900 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
            PAYMENT RECEIPT
          </div>
          <div className="mt-1.5 text-sm font-extrabold text-slate-900">{invoice.invoice_no}</div>
          <div className="text-[10.5px] text-slate-600">{formatDisplayDateTime(invoice.created_at)}</div>
        </div>
      </div>

      {/* Patient Meta */}
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
        <div className="space-y-0.5">
          <div>
            <span className="font-bold">Patient:</span>{' '}
            <span className="font-extrabold uppercase">{patient.full_name}</span>
          </div>
          <div>
            <span className="font-bold">Patient ID:</span>{' '}
            <span className="font-bold">{patient.patient_code}</span>
          </div>
          {patient.village_address && (
            <div>
              <span className="font-bold">Place:</span> {patient.village_address}
            </div>
          )}
        </div>
        <div className="space-y-0.5 text-right">
          <div>
            <span className="font-bold">Age / Sex:</span> {patient.age ?? '—'} Yrs / {patient.sex || '—'}
          </div>
          <div>
            <span className="font-bold">Consultant:</span> {clinic.doctor_name}
          </div>
          <div>
            <span className="font-bold">Payment Mode:</span>{' '}
            <span className="font-extrabold">{invoice.payment_mode}</span>
            {invoice.payment_ref ? ` (${invoice.payment_ref})` : ''}
          </div>
        </div>
      </div>

      {/* Line items */}
      <table className="mt-3 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-slate-800 bg-slate-100 text-left">
            <th className="w-8 px-2 py-1.5 font-bold">#</th>
            <th className="px-2 py-1.5 font-bold">Particulars / Service</th>
            <th className="w-14 px-2 py-1.5 text-center font-bold">Qty</th>
            <th className="w-24 px-2 py-1.5 text-right font-bold">Rate (₹)</th>
            <th className="w-24 px-2 py-1.5 text-right font-bold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="px-2 py-2 text-slate-500">{idx + 1}</td>
              <td className="px-2 py-2 font-semibold">
                {item.name}
                <span className="ml-1.5 text-[10px] font-normal text-slate-500">({item.category})</span>
              </td>
              <td className="px-2 py-2 text-center">{item.qty}</td>
              <td className="px-2 py-2 text-right">{item.unit_price.toLocaleString('en-IN')}</td>
              <td className="px-2 py-2 text-right font-bold">{item.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-3 flex flex-col items-end space-y-1 text-xs">
        <div className="flex w-56 justify-between">
          <span className="text-slate-600">Subtotal:</span>
          <span className="font-semibold">{formatINR(invoice.subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex w-56 justify-between text-emerald-700">
            <span>Concession / Discount:</span>
            <span className="font-semibold">- {formatINR(invoice.discount)}</span>
          </div>
        )}
        <div className="flex w-56 justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-extrabold">
          <span>Total Received:</span>
          <span>{formatINR(invoice.total)}</span>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-3 rounded bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
          <strong>Remarks:</strong> {invoice.notes}
        </div>
      )}

      {invoice.status === 'voided' && invoice.void_reason && (
        <div className="mt-2 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700">
          VOIDED — Reason: {invoice.void_reason}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-end justify-between border-t border-slate-300 pt-3 text-[10px] text-slate-600">
        <div>
          <div>Healthcare services are exempt from GST (SAC 9993).</div>
          <div>Thank you for trusting {clinic.clinic_name}, Magadi.</div>
        </div>
        <div className="text-right">
          <div className="h-6" />
          <div className="border-t border-slate-400 pt-0.5 font-bold text-slate-900">
            Authorized Signatory ({invoice.created_by})
          </div>
        </div>
      </div>
    </div>
  );
}
