import { formatDisplayDateTime, formatINR } from '../lib/dates';
import type { ClinicSettings, Invoice, Patient } from '../types/database';

function numberToIndianWords(num: number): string {
  const n = Math.floor(Math.max(0, num));
  if (n === 0) return 'Zero';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (x: number) =>
    x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ''}`;

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ones[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(' ');
}

interface PrintableInvoiceProps {
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'> & {
    phone?: string;
  };
  invoice: Invoice;
}

export function PrintableInvoice({ clinic, patient, invoice }: PrintableInvoiceProps) {
  return (
    <div className="print-sheet-a5 relative mx-auto rounded-2xl border border-stone-200 bg-white p-5 font-sans text-xs text-stone-900 shadow-sm">
      {invoice.status === 'voided' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-12 rounded-xl border-4 border-red-600/60 px-6 py-2 text-4xl font-black uppercase tracking-widest text-red-600/40">
            VOIDED
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 border-b-2 border-stone-900 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-tight text-stone-950">
            {clinic.clinic_name}
          </h1>
          <div className="text-[11px] font-semibold text-stone-700">{clinic.tagline}</div>
          <div className="mt-0.5 text-[10.5px] text-stone-600">{clinic.address}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-2.5 text-[10px] font-semibold text-stone-800">
            <span>Ph: {clinic.phone}</span>
            {clinic.kpme_reg_no && <span>KPME: {clinic.kpme_reg_no}</span>}
            {clinic.rohini_id && <span>ROHINI: {clinic.rohini_id}</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="inline-block rounded border border-stone-900 bg-stone-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            PAYMENT RECEIPT
          </div>
          <div className="mt-1.5 text-sm font-extrabold text-stone-900">{invoice.invoice_no}</div>
          <div className="text-[10px] text-stone-600">{formatDisplayDateTime(invoice.created_at)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-[11px]">
        <div className="space-y-0.5">
          <div>
            <span className="text-stone-500">Patient:</span>{' '}
            <span className="font-extrabold uppercase text-stone-950">{patient.full_name}</span>
          </div>
          <div>
            <span className="text-stone-500">MRD No.:</span>{' '}
            <span className="font-mono font-bold text-stone-950">{patient.patient_code}</span>
            {invoice.ipd_no ? <span className="ml-2 font-mono text-stone-700">· {invoice.ipd_no}</span> : null}
          </div>
          {patient.village_address && (
            <div>
              <span className="text-stone-500">Address:</span> {patient.village_address}
            </div>
          )}
        </div>
        <div className="space-y-0.5 text-right">
          <div>
            <span className="text-stone-500">Age / Sex:</span> {patient.age ?? '—'} Yrs / {patient.sex || '—'}
          </div>
          <div>
            <span className="text-stone-500">Consultant:</span> {clinic.doctor_name}
          </div>
          <div>
            <span className="text-stone-500">Payment:</span>{' '}
            <span className="font-extrabold">{invoice.payment_mode}</span>
            {invoice.payment_ref ? ` (${invoice.payment_ref})` : ''}
          </div>
          {(invoice.tpa_name || invoice.policy_no) && (
            <div className="text-[10px] text-stone-700">
              TPA: {[invoice.tpa_name, invoice.policy_no].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>

      <table className="mt-3 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-stone-800 bg-stone-100 text-left text-[11px]">
            <th className="w-8 px-2 py-1.5 font-bold">#</th>
            <th className="px-2 py-1.5 font-bold">Particulars / Service Head</th>
            <th className="w-12 px-2 py-1.5 text-center font-bold">Qty</th>
            <th className="w-20 px-2 py-1.5 text-right font-bold">Rate (₹)</th>
            <th className="w-24 px-2 py-1.5 text-right font-bold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-2 py-4 text-center text-stone-400">
                Tap services on the left to build itemized receipt
              </td>
            </tr>
          ) : (
            invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-stone-200">
                <td className="px-2 py-1.5 text-stone-500">{idx + 1}</td>
                <td className="px-2 py-1.5 font-semibold">
                  {item.name}
                  <span className="ml-1.5 text-[10px] font-normal text-stone-500">({item.category})</span>
                </td>
                <td className="px-2 py-1.5 text-center">{item.qty}</td>
                <td className="px-2 py-1.5 text-right">{item.unit_price.toLocaleString('en-IN')}</td>
                <td className="px-2 py-1.5 text-right font-bold">{item.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-3 flex flex-col items-end space-y-1 text-xs">
        <div className="flex w-60 justify-between">
          <span className="text-stone-600">Subtotal:</span>
          <span className="font-semibold">{formatINR(invoice.subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex w-60 justify-between text-emerald-700">
            <span>Concession / Discount:</span>
            <span className="font-semibold">- {formatINR(invoice.discount)}</span>
          </div>
        )}
        <div className="flex w-60 justify-between border-t-2 border-stone-900 pt-1.5 text-sm font-extrabold">
          <span>Total Received:</span>
          <span>{formatINR(invoice.total)}</span>
        </div>
      </div>

      <div className="mt-2 rounded bg-stone-50 px-2.5 py-1.5 text-[10.5px] text-stone-700">
        <strong>Amount in words:</strong> Rupees {numberToIndianWords(invoice.total)} Only
      </div>

      {invoice.notes && (
        <div className="mt-2 rounded bg-stone-50 px-2.5 py-1.5 text-[10.5px] text-stone-700">
          <strong>Remarks:</strong> {invoice.notes}
        </div>
      )}

      {invoice.status === 'voided' && invoice.void_reason && (
        <div className="mt-2 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700">
          VOIDED — Reason: {invoice.void_reason}
        </div>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-stone-300 pt-3 text-[10px] text-stone-600">
        <div>
          <div>Healthcare services are exempt from GST (SAC 9993).</div>
          <div>Thank you for trusting {clinic.clinic_name}, Magadi.</div>
        </div>
        <div className="text-right">
          <div className="h-6" />
          <div className="border-t border-stone-400 pt-0.5 font-bold text-stone-900">
            Authorized Signatory ({invoice.created_by})
          </div>
        </div>
      </div>
    </div>
  );
}
