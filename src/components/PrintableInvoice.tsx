import { formatDisplayDate, formatINR } from '../lib/dates';
import { ClinicMark } from './ClinicMark';
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
  const kmcNo = clinic.doctor_kmc_no || '26550';

  return (
    <div className="print-sheet-a5 relative mx-auto w-full max-w-[680px] rounded-2xl border border-stone-200 bg-white p-4 font-sans text-xs text-stone-900 shadow-sm sm:p-7">
      {invoice.status === 'voided' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-12 rounded-xl border-4 border-red-600/60 px-6 py-2 text-4xl font-black uppercase tracking-widest text-red-600/40">
            VOIDED
          </div>
        </div>
      )}

      {/* ── TOP HEADER: Symmetrical Logos on Either Side + Crisp Centered Clinic Details ── */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-300 pb-3 sm:gap-4">
        <ClinicMark className="h-10 w-10 shrink-0 sm:h-14 sm:w-14" />

        <div className="min-w-0 flex-1 text-center">
          <h1 className="whitespace-nowrap font-display text-[15px] font-bold uppercase tracking-wide text-stone-950 sm:text-xl">
            {clinic.clinic_name}
          </h1>
          <p className="mt-0.5 text-[9.5px] leading-snug text-stone-600 sm:text-[10.5px]">
            {clinic.address}
          </p>
          <p className="mt-0.5 text-[9.5px] font-medium text-stone-800 sm:text-[10.5px]">
            Mob: +91 {clinic.phone}, 7026200077 · shridharnetra@gmail.com
          </p>
          <p className="mt-0.5 text-[9.5px] font-semibold italic text-stone-600 sm:text-[10.5px]">
            Timings: Mon – Sat 10:00 AM – 5:00 PM · Sunday Holiday
          </p>
        </div>

        <ClinicMark className="h-10 w-10 shrink-0 sm:h-14 sm:w-14" />
      </div>

      {/* ── RECEIPT NUMBER & DATE ── */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-xs sm:text-[13px]">
        <div className="font-bold text-stone-950">
          Details of Cash Receipt No:{' '}
          <span className="font-mono font-extrabold">{invoice.invoice_no}</span>
        </div>
        <div className="font-semibold text-stone-700">
          Date: <span className="font-bold text-stone-950">{formatDisplayDate(invoice.created_at)}</span>
        </div>
      </div>

      {/* ── COMPACT AT-A-GLANCE PATIENT STRIP ── */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-stone-200 bg-stone-50/70 px-2.5 py-1.5 text-[11px] text-stone-700">
        <div>
          <span className="text-stone-500">Patient:</span>{' '}
          <span className="font-bold uppercase text-stone-950">{patient.full_name}</span>
          <span className="ml-1.5 font-mono text-[10px] font-semibold text-stone-600">
            ({patient.patient_code})
          </span>
          {invoice.ipd_no ? <span className="ml-1.5 font-mono text-[10px]">· {invoice.ipd_no}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3">
          <span>
            {patient.age ?? '—'} Yrs / {patient.sex || '—'}
          </span>
          <span>
            Mode: <strong className="text-stone-950">{invoice.payment_mode}</strong>
            {invoice.payment_ref ? ` (${invoice.payment_ref})` : ''}
          </span>
        </div>
      </div>

      {/* ── CLEAN 3-COLUMN TABLE (Sl.No | Details | Amount in Rs.) ── */}
      <div className="mt-3 overflow-hidden rounded-lg border border-stone-400">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-400 bg-stone-100/90 text-stone-900">
              <th className="w-10 border-r border-stone-300 px-2 py-2 text-center font-bold sm:w-12">Sl.No</th>
              <th className="border-r border-stone-300 px-2.5 py-2 text-left font-bold sm:px-3">Details</th>
              <th className="w-24 whitespace-nowrap px-2.5 py-2 text-right font-bold sm:w-28 sm:px-3">
                Amount in Rs.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-stone-400">
                  Add items on the left to preview receipt
                </td>
              </tr>
            ) : (
              invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border-r border-stone-300 px-2 py-1.5 text-center font-medium text-stone-600 tabular-nums">
                    {idx + 1}.
                  </td>
                  <td className="border-r border-stone-300 px-2.5 py-1.5 font-medium text-stone-900 sm:px-3">
                    {item.name}
                    {item.qty > 1 && (
                      <span className="ml-1.5 text-[10.5px] text-stone-500">
                        ({item.qty} × ₹{item.unit_price.toLocaleString('en-IN')})
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-semibold text-stone-950 tabular-nums sm:px-3">
                    {item.amount > 0 ? item.amount.toLocaleString('en-IN') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            {invoice.discount > 0 && (
              <tr className="border-t border-stone-300 bg-stone-50/70 text-[11px] text-emerald-800">
                <td className="border-r border-stone-300 px-2 py-1.5" />
                <td className="border-r border-stone-300 px-2.5 py-1.5 text-right font-semibold sm:px-3">
                  Concession / Discount
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-bold tabular-nums sm:px-3">
                  - {invoice.discount.toLocaleString('en-IN')}
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-stone-500 bg-stone-50 font-bold text-stone-950">
              <td className="border-r border-stone-300 px-2 py-2" />
              <td className="border-r border-stone-300 px-2.5 py-2 text-right text-xs uppercase tracking-wide sm:px-3">
                Total:
              </td>
              <td className="whitespace-nowrap px-2.5 py-2 text-right text-sm font-extrabold tabular-nums sm:px-3">
                {formatINR(invoice.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── TPA / NOTES / VOIDED ── */}
      {(invoice.tpa_name || invoice.policy_no || invoice.notes) && (
        <div className="mt-2 space-y-1 text-[10.5px] text-stone-700">
          {(invoice.tpa_name || invoice.policy_no) && (
            <div>
              <strong>TPA / Scheme:</strong> {[invoice.tpa_name, invoice.policy_no].filter(Boolean).join(' · ')}
            </div>
          )}
          {invoice.notes && (
            <div>
              <strong>Remarks:</strong> {invoice.notes}
            </div>
          )}
        </div>
      )}

      {invoice.status === 'voided' && invoice.void_reason && (
        <div className="mt-2 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700">
          VOIDED — Reason: {invoice.void_reason}
        </div>
      )}

      {/* ── FOOTER: Amount in words (Left) + Doctor Signature & KMC Reg (Right) ── */}
      <div className="mt-5 flex items-end justify-between gap-4 pt-2 text-[11px] text-stone-800">
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-stone-600">Amount in words:</span>{' '}
          <span className="font-bold text-stone-950">
            Rupees {numberToIndianWords(invoice.total)} Only
          </span>
        </div>

        <div className="shrink-0 text-right leading-snug">
          <div className="text-[10.5px] font-semibold text-stone-600">Signature:</div>
          <div className="mt-5 font-bold text-stone-950">{clinic.doctor_name}</div>
          <div className="text-[10px] font-semibold text-stone-700">KMC Reg no: {kmcNo}</div>
        </div>
      </div>
    </div>
  );
}
