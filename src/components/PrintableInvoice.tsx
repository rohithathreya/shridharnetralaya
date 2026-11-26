import { formatDisplayDate, formatINR } from '../lib/dates';
import { BILL_HEADS, groupItemsByBillHead } from '../lib/invoiceHeads';
import { A4PreviewSheet } from './A4PreviewSheet';
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
  const grouped = groupItemsByBillHead(invoice.items);

  return (
    <A4PreviewSheet>
      <div className="print-sheet-a5 relative flex min-h-[1047px] flex-col justify-between overflow-hidden bg-white p-8 font-sans text-xs text-stone-900">
        {/* ── SUBTLE CENTERED WATERMARK ── */}
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
          <ClinicMark className="w-[340px] opacity-[0.045]" variant="watermark" />
        </div>

        {invoice.status === 'voided' && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="-rotate-12 rounded-xl border-4 border-red-600/60 px-6 py-2 text-4xl font-black uppercase tracking-widest text-red-600/40">
              VOIDED
            </div>
          </div>
        )}

        <div className="relative z-[1]">
          {/* ── TOP HEADER: Symmetrical Transparent Logos + Prestige Letterhead ── */}
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#13345B] pb-4">
            <ClinicMark className="h-14 w-[4.5rem] shrink-0" showWordmark />

            <div className="min-w-0 flex-1 text-center">
              <h1 className="font-display text-[25px] font-bold uppercase tracking-[0.06em] text-[#13345B]">
                {clinic.clinic_name}
              </h1>
              <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#A67C46]">
                {clinic.tagline}
              </p>
              <p className="mt-1 text-[11px] text-stone-600">{clinic.address}</p>
              <p className="mt-0.5 text-[11px] font-medium text-stone-800">
                Mob: +91 {clinic.phone}, 7026200077 · Email: shridharnetra@gmail.com
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium italic text-stone-500">
                Timings: Mon – Sat 10:00 AM – 5:00 PM · Sunday Holiday
              </p>
            </div>

            <ClinicMark className="h-14 w-[4.5rem] shrink-0" showWordmark />
          </div>
          <div className="h-[2px] w-full bg-[#C09556]/45" />

          {/* ── RECEIPT NUMBER & DATE ── */}
          <div className="mt-4 flex items-baseline justify-between gap-4 text-[13px]">
            <div className="font-bold text-[#13345B]">
              Details of Cash Receipt No:{' '}
              <span className="font-mono font-extrabold text-stone-950">{invoice.invoice_no}</span>
            </div>
            <div className="font-semibold text-stone-600">
              Date: <span className="font-bold text-stone-950">{formatDisplayDate(invoice.created_at)}</span>
            </div>
          </div>

          {/* ── COMPACT AT-A-GLANCE PATIENT STRIP ── */}
          <div className="mt-2.5 flex items-center justify-between gap-4 rounded-lg border border-stone-200/90 bg-[#FAF8F5]/90 px-3.5 py-2 text-[11.5px] text-stone-700">
            <div>
              <span className="text-stone-500">Patient:</span>{' '}
              <span className="font-bold uppercase text-stone-950">{patient.full_name}</span>
              <span className="ml-2 font-mono text-[11px] font-semibold text-[#13345B]">
                ({patient.patient_code})
              </span>
              {invoice.ipd_no ? <span className="ml-2 font-mono text-[11px]">· {invoice.ipd_no}</span> : null}
            </div>
            <div className="flex items-center gap-4">
              <span>
                {patient.age ?? '—'} Yrs / {patient.sex || '—'}
              </span>
              <span>
                Mode: <strong className="text-stone-950">{invoice.payment_mode}</strong>
                {invoice.payment_ref ? ` (${invoice.payment_ref})` : ''}
              </span>
            </div>
          </div>

          {/* ── ALWAYS-ON 10-HEAD RECEIPT TABLE WITH INDENTED SUB-ITEMS ── */}
          <div className="mt-4 overflow-hidden rounded-lg border border-stone-300 bg-white/80">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-300 bg-[#13345B]/[0.05] text-[#13345B]">
                  <th className="w-14 border-r border-stone-200 px-3 py-2.5 text-center font-bold">Sl.No</th>
                  <th className="border-r border-stone-200 px-4 py-2.5 text-left font-bold">Details</th>
                  <th className="w-32 whitespace-nowrap px-4 py-2.5 text-right font-bold">Amount in Rs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80">
                {BILL_HEADS.map((head, idx) => {
                  const headItems = grouped[head];
                  const subItems = headItems.filter((sub) => sub.name !== head);
                  const headTotal = headItems.reduce((s, it) => s + it.amount, 0);

                  return (
                    <tr key={head} className={headTotal > 0 ? 'bg-white/90' : 'bg-stone-50/30'}>
                      <td className="border-r border-stone-200 px-3 py-2 text-center align-top font-medium text-stone-500 tabular-nums">
                        {idx + 1}.
                      </td>
                      <td className="border-r border-stone-200 px-4 py-2 align-top">
                        <div className={`font-semibold ${headTotal > 0 ? 'text-stone-950' : 'text-stone-400'}`}>
                          {head}
                        </div>
                        {subItems.length > 0 && (
                          <div className="mt-1 space-y-0.5 pl-4">
                            {subItems.map((sub, subIdx) => (
                              <div
                                key={`${sub.name}-${subIdx}`}
                                className="flex items-baseline justify-between gap-3 text-[11px] text-stone-600"
                              >
                                <span>
                                  ↳ {sub.name}
                                  {sub.qty > 1 ? ` (×${sub.qty})` : ''}
                                </span>
                                <span className="shrink-0 font-medium text-stone-700 tabular-nums">
                                  {sub.amount.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right align-top font-bold text-stone-950 tabular-nums">
                        {headTotal > 0 ? headTotal.toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {invoice.discount > 0 && (
                  <tr className="border-t border-stone-200 bg-stone-50/70 text-[11.5px] text-emerald-800">
                    <td className="border-r border-stone-200 px-3 py-2" />
                    <td className="border-r border-stone-200 px-4 py-2 text-right font-semibold">
                      Concession / Discount
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-bold tabular-nums">
                      - {invoice.discount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-[#13345B]/30 bg-[#FAF8F5] font-bold text-[#13345B]">
                  <td className="border-r border-stone-200 px-3 py-2.5" />
                  <td className="border-r border-stone-200 px-4 py-2.5 text-right text-xs uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-base font-extrabold text-stone-950 tabular-nums">
                    {formatINR(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── TPA / NOTES / VOIDED ── */}
          {(invoice.tpa_name || invoice.policy_no || invoice.notes) && (
            <div className="mt-3 space-y-1 text-[11px] text-stone-700">
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
            <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              VOIDED — Reason: {invoice.void_reason}
            </div>
          )}
        </div>

        {/* ── FOOTER: Amount in words (Left) + Doctor Signature & KMC Reg (Right) ── */}
        <div className="relative z-[1] mt-8 flex items-end justify-between gap-6 border-t border-stone-200 pt-4 text-xs text-stone-800">
          <div className="min-w-0 flex-1 space-y-1">
            <div>
              <span className="font-semibold text-stone-500">Amount in words:</span>{' '}
              <span className="font-bold text-stone-950">
                Rupees {numberToIndianWords(invoice.total)} Only
              </span>
            </div>
            <div className="text-[10px] text-stone-400">
              Healthcare services are exempt from GST (SAC 9993) · Thank you for choosing {clinic.clinic_name}.
            </div>
          </div>

          <div className="shrink-0 text-right leading-snug">
            <div className="text-[11px] font-semibold text-stone-500">Signature:</div>
            <div className="mt-6 font-bold text-[#13345B]">{clinic.doctor_name}</div>
            <div className="text-[10.5px] font-semibold text-stone-600">KMC Reg no: {kmcNo}</div>
          </div>
        </div>
      </div>
    </A4PreviewSheet>
  );
}
