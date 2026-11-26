import { formatDisplayDate, formatDisplayDateTime } from '../lib/dates';
import { ClinicMark } from './ClinicMark';
import type { ClinicSettings, DischargeSummary, Patient } from '../types/database';

export type PrintLang = 'en' | 'kn' | 'bilingual';

interface PrintableDischargeSummaryProps {
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'> & {
    phone?: string;
  };
  summary: DischargeSummary;
  printLang?: PrintLang;
}

export function PrintableDischargeSummary({
  clinic,
  patient,
  summary,
  printLang = 'bilingual',
}: PrintableDischargeSummaryProps) {
  const emergencyNo = clinic.emergency_phone || clinic.phone;
  const kmcNo = clinic.doctor_kmc_no || '26550';
  const showEn = printLang === 'en' || printLang === 'bilingual';
  const showKn = printLang === 'kn' || printLang === 'bilingual';
  const hasAllergy = Boolean(summary.allergies && summary.allergies.toUpperCase() !== 'NKDA');

  return (
    <div className="print-sheet-a4 mx-auto w-full max-w-[760px] rounded-2xl border border-stone-200 bg-white p-4 font-sans text-[11px] leading-snug text-stone-900 shadow-sm sm:p-6">
      {/* ── 1. TOP HEADER: Symmetrical Logos on Either Side (Matched to Invoice) ── */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-300 pb-3 sm:gap-4">
        <ClinicMark className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />

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

        <ClinicMark className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
      </div>

      {/* ── 2. DOCUMENT TITLE & DATE ROW ── */}
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2 text-xs sm:text-[13px]">
        <div className="font-bold text-stone-950">
          Surgical Discharge Summary:{' '}
          <span className="font-mono font-extrabold">{summary.summary_no}</span>
          <span className="ml-2 rounded border border-stone-300 bg-stone-50 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
            {summary.case_type}
          </span>
        </div>
        <div className="text-xs font-semibold text-stone-700">
          Date: <span className="font-bold text-stone-950">{formatDisplayDate(summary.discharge_at)}</span>
        </div>
      </div>

      {/* ── 3. CLEAN PATIENT & TIMELINE STRIP ── */}
      <div className="mt-2 space-y-1 border-y border-stone-200 bg-stone-50/70 px-3 py-2 text-[10.5px] text-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5">
          <div>
            <span className="text-stone-500">Patient:</span>{' '}
            <span className="font-bold uppercase text-stone-950">{patient.full_name}</span>
            <span className="ml-1.5 font-mono text-[10px] font-semibold text-stone-600">
              ({patient.patient_code})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3">
            <span>
              {patient.age ?? '—'} Yrs / {patient.sex || '—'}
            </span>
            {patient.phone && <span>Ph: {patient.phone}</span>}
            <span>
              Allergies:{' '}
              <strong className={hasAllergy ? 'text-red-700' : 'text-stone-900'}>
                {summary.allergies || 'NKDA'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 border-t border-stone-200/70 pt-1 text-[10px]">
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-stone-500">Admitted:</span> {formatDisplayDateTime(summary.admission_at)}
            </span>
            <span>
              <span className="text-stone-500">Surgery:</span> {formatDisplayDateTime(summary.surgery_at)}
            </span>
            <span>
              <span className="text-stone-500">Discharged:</span> {formatDisplayDateTime(summary.discharge_at)}
            </span>
          </div>
          <span>
            <span className="text-stone-500">Systemic:</span>{' '}
            {summary.comorbidities?.length ? summary.comorbidities.join(', ') : 'Nil'}
          </span>
        </div>
      </div>

      {/* ── 4. OPERATED EYE, DIAGNOSIS & IOL STICKER ── */}
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
        <div className="space-y-2 sm:col-span-8">
          <div className="flex items-center justify-between rounded-lg border border-stone-300 bg-stone-100/80 px-3 py-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-600">
              Operated Eye {showKn ? '/ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮಾಡಿದ ಕಣ್ಣು' : ''}
            </span>
            <span className="text-sm font-extrabold tracking-wide text-stone-950">
              {summary.operated_eye || 'UNSPECIFIED'}
            </span>
          </div>

          <div className="space-y-1.5 rounded-lg border border-stone-300 bg-white p-2.5 text-[10.5px]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-stone-500">Diagnosis:</span>{' '}
                <strong className="text-stone-950">{summary.diagnosis || '—'}</strong>
              </div>
              {summary.icd10_code && (
                <span className="font-mono text-[9.5px] font-semibold text-stone-500">
                  ICD-10: {summary.icd10_code}
                </span>
              )}
            </div>

            <div>
              <span className="text-stone-500">Procedure:</span>{' '}
              <strong className="text-stone-950">{summary.procedure_name || '—'}</strong>{' '}
              <span className="text-stone-600">({summary.anesthesia} Anaesthesia)</span>
            </div>

            <div className="flex flex-wrap gap-x-4 border-t border-stone-100 pt-1 text-[10px] text-stone-700">
              <span>
                <strong>VA:</strong> RE {summary.pre_op_va_re || '—'} · LE {summary.pre_op_va_le || '—'}
              </span>
              <span>
                <strong>IOP:</strong> RE {summary.pre_op_iop_re || '—'} · LE {summary.pre_op_iop_le || '—'}
              </span>
              <span>
                <strong>BP:</strong> {summary.pre_op_bp || '—'}
              </span>
              <span>
                <strong>RBS:</strong> {summary.pre_op_rbs || '—'}
              </span>
            </div>

            {summary.intra_op_notes && (
              <div className="border-t border-stone-100 pt-1 text-[10px] text-stone-700">
                <strong className="text-stone-900">Course:</strong> {summary.intra_op_notes}
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 text-[10px] text-stone-700">
              <span>
                <strong>Status:</strong> {summary.discharge_status} ({summary.discharge_condition})
              </span>
              <span>
                <strong>Dressing:</strong> {summary.dressing_status}
              </span>
            </div>
          </div>
        </div>

        {/* Clean 60mm x 35mm IOL Sticker Zone */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-300 bg-stone-50/50 p-2.5 sm:col-span-4">
          <div className="flex min-h-[28mm] flex-col items-center justify-center rounded border border-dashed border-stone-400 bg-white p-1.5 text-center">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-500">
              Affix IOL Sticker
            </span>
            <span className="mt-0.5 text-[8px] text-stone-400">60mm × 35mm Implant Barcode</span>
          </div>
          <div className="mt-2 space-y-0.5 text-[10px] text-stone-800">
            <div className="truncate">
              <strong>Lens:</strong>{' '}
              {summary.no_iol_confirmed ? 'No IOL / Aphakia' : summary.iol_model || '—'}
            </div>
            <div className="flex justify-between gap-1">
              <span>
                <strong>Power:</strong> {summary.no_iol_confirmed ? 'N/A' : summary.iol_power || '—'}
              </span>
              <span>
                <strong>SN:</strong> {summary.no_iol_confirmed ? 'N/A' : summary.iol_batch || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. GLANCEABLE POST-OP MEDICATIONS ── */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between border-b border-stone-400 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-950">
            {showEn ? 'Post-Operative Medications' : 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಔಷಧಿಗಳು'}
          </span>
          {printLang === 'bilingual' && (
            <span className="font-kannada text-[10px] font-medium text-stone-600">
              ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಔಷಧಿಗಳು
            </span>
          )}
        </div>

        {summary.eye_drops && summary.eye_drops.length > 0 && (
          <div className="mt-1.5 overflow-hidden rounded-lg border border-stone-300">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-stone-300 bg-stone-100/80 text-left text-[9.5px] uppercase text-stone-700">
                  <th className="px-2 py-1.5 font-bold">Eye Drop / Ointment</th>
                  <th className="w-24 px-2 py-1.5 font-bold">Eye</th>
                  <th className="px-2 py-1.5 font-bold">Dosage</th>
                  <th className="w-24 px-2 py-1.5 text-right font-bold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {summary.eye_drops.map((d, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 font-semibold text-stone-950">{d.name}</td>
                    <td className="px-2 py-1 font-medium text-stone-700">
                      {d.eye === 'Operated Eye' ? summary.operated_eye || 'Operated Eye' : d.eye}
                    </td>
                    <td className="px-2 py-1 text-stone-800">{d.schedule}</td>
                    <td className="px-2 py-1 text-right font-semibold text-stone-900">{d.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {summary.oral_meds && summary.oral_meds.length > 0 && (
          <div className="mt-1.5 overflow-hidden rounded-lg border border-stone-300">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-stone-300 bg-stone-100/80 text-left text-[9.5px] uppercase text-stone-700">
                  <th className="px-2 py-1.5 font-bold">Oral Tablet</th>
                  <th className="w-24 px-2 py-1.5 font-bold">Dose</th>
                  <th className="w-28 px-2 py-1.5 font-bold">Timing</th>
                  <th className="w-24 px-2 py-1.5 text-right font-bold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {summary.oral_meds.map((m, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 font-semibold text-stone-950">{m.name}</td>
                    <td className="px-2 py-1 font-medium text-stone-700">{m.dosage}</td>
                    <td className="px-2 py-1 text-stone-800">{m.timing}</td>
                    <td className="px-2 py-1 text-right font-semibold text-stone-900">{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-1.5 rounded bg-stone-50 px-2.5 py-1 text-[9.5px] text-stone-700">
          {showEn && (
            <span>
              Wash hands before drops · Shake white bottles · Keep 5 min gap between drops · Continue regular BP/Sugar tablets.
            </span>
          )}
          {showKn && (
            <span className={`font-kannada block ${showEn ? 'mt-0.5 text-stone-600' : ''}`}>
              ಡ್ರಾಪ್ಸ್ ಹಾಕುವ ಮುನ್ನ ಕೈ ತೊಳೆಯಿರಿ · ಎರಡು ಡ್ರಾಪ್ಸ್ ನಡುವೆ 5 ನಿಮಿಷ ಅಂತರವಿರಲಿ · ಬಿ.ಪಿ./ಶುಗರ್ ಮಾತ್ರೆ ಮುಂದುವರಿಸಿ.
            </span>
          )}
        </div>
      </div>

      {/* ── 6. FOLLOW-UP TIMELINE, PRECAUTIONS & EMERGENCY HELPLINE ── */}
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
        <div className="space-y-2 rounded-lg border border-stone-300 bg-white p-2.5 sm:col-span-7">
          <div className="grid grid-cols-3 gap-1.5 rounded bg-stone-50 p-1.5 text-center text-[10px]">
            <div>
              <div className="text-[8.5px] text-stone-500">
                {showEn ? '1st Visit (Day 1)' : 'ಮೊದಲ ಭೇಟಿ'}
              </div>
              <div className="font-bold text-stone-950">{formatDisplayDate(summary.follow_up_1)}</div>
            </div>
            <div className="border-x border-stone-200">
              <div className="text-[8.5px] text-stone-500">
                {showEn ? '2nd Visit (1 Wk)' : 'ಎರಡನೇ ಭೇಟಿ'}
              </div>
              <div className="font-bold text-stone-950">{formatDisplayDate(summary.follow_up_2)}</div>
            </div>
            <div>
              <div className="text-[8.5px] text-stone-500">
                {showEn ? 'Glasses Check' : 'ಕನ್ನಡಕ ಪರೀಕ್ಷೆ'}
              </div>
              <div className="font-bold text-stone-950">{formatDisplayDate(summary.follow_up_3)}</div>
            </div>
          </div>

          <ul className="space-y-1 pl-3.5 text-[9.5px] text-stone-800" style={{ listStyle: 'disc' }}>
            <li>
              {showEn && (
                <span>
                  No rubbing eye or head bath / water in eye for <strong>{summary.head_bath_days} days</strong>.
                </span>
              )}
              {showKn && (
                <span className={`font-kannada block ${showEn ? 'text-[9px] text-stone-600' : ''}`}>
                  ಕಣ್ಣನ್ನು ಉಜ್ಜಬೇಡಿ · {summary.head_bath_days} ದಿನ ತಲೆ ಸ್ನಾನ ಬೇಡ.
                </span>
              )}
            </li>
            <li>
              {showEn && <span>Wear dark glasses outdoors & protective shield at night. Avoid dust.</span>}
              {showKn && (
                <span className={`font-kannada block ${showEn ? 'text-[9px] text-stone-600' : ''}`}>
                  ಹೊರಗೆ ಕಪ್ಪು ಕನ್ನಡಕ ಮತ್ತು ರಾತ್ರಿ ಶೀಲ್ಡ್ ಧರಿಸಿ · ಧೂಳಿನಿಂದ ದೂರವಿರಿ.
                </span>
              )}
            </li>
          </ul>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-amber-300 bg-amber-50/40 p-2.5 sm:col-span-5">
          <div>
            <div className="border-b border-amber-200 pb-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">
              {showEn ? 'Report Immediately If:' : 'ತುರ್ತು ಎಚ್ಚರಿಕೆ:'}
            </div>
            <ul className="mt-1.5 space-y-0.5 pl-3.5 text-[9.5px] text-stone-800" style={{ listStyle: 'disc' }}>
              <li>
                {showEn ? 'Severe pain' : ''}
                {showEn && showKn ? ' / ' : ''}
                {showKn ? <span className="font-kannada">ತೀವ್ರ ನೋವು</span> : ''}
              </li>
              <li>
                {showEn ? 'Sudden drop in vision' : ''}
                {showEn && showKn ? ' / ' : ''}
                {showKn ? <span className="font-kannada">ದೃಷ್ಟಿ ಮಂಜಾಗುವುದು</span> : ''}
              </li>
              <li>
                {showEn ? 'Redness, swelling or pus' : ''}
                {showEn && showKn ? ' / ' : ''}
                {showKn ? <span className="font-kannada">ಕೆಂಪು / ಊತ / ಕೀವು</span> : ''}
              </li>
            </ul>
          </div>
          <div className="mt-2 rounded border border-amber-300 bg-white px-2 py-1 text-center text-[10.5px] font-bold text-amber-950">
            24/7 Helpline: {emergencyNo}
          </div>
        </div>
      </div>

      {/* ── 7. CLEAN SIGN-OFF BAR (Matched to Invoice) ── */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-stone-300 pt-2.5 text-[10px] text-stone-800">
        <div>
          <div className="h-6" />
          <div className="font-bold text-stone-900">{summary.prepared_by || 'OT Assistant'}</div>
          <div className="text-[9px] text-stone-500">Prepared By</div>
        </div>

        <div className="text-center">
          <div className="h-6" />
          <div className="font-bold text-stone-950">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          <div className="text-[9px] text-stone-500">KMC Reg no: {kmcNo}</div>
        </div>

        <div className="text-right">
          <div className="h-6" />
          <div className="font-bold text-stone-900">{summary.attendant_name || 'Patient / Attendant'}</div>
          <div className="text-[9px] text-stone-500">Signature / Thumbprint</div>
        </div>
      </div>
    </div>
  );
}
