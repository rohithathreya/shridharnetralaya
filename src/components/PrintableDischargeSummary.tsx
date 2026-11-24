import { formatDisplayDate, formatDisplayDateTime } from '../lib/dates';
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
  const showEn = printLang === 'en' || printLang === 'bilingual';
  const showKn = printLang === 'kn' || printLang === 'bilingual';
  const hasAllergy = Boolean(summary.allergies && summary.allergies.toUpperCase() !== 'NKDA');

  return (
    <div className="print-sheet-a4 mx-auto rounded-2xl border border-stone-200 bg-white p-4 text-[10.5px] leading-snug text-stone-900 shadow-sm sm:p-5">
      {/* 1. HEADER */}
      <div className="flex flex-col items-start justify-between gap-2 border-b-2 border-stone-900 pb-2 sm:flex-row">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-lg font-bold uppercase tracking-tight text-stone-950 sm:text-xl">
              {clinic.clinic_name}
            </h1>
            {showKn && (
              <span className="font-kannada text-xs font-semibold text-stone-700">
                ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ
              </span>
            )}
          </div>
          <div className="text-[10px] font-semibold text-stone-700">{clinic.tagline}</div>
          <div className="text-[9.5px] text-stone-600">{clinic.address}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9.5px] font-medium text-stone-800">
            <span>
              Ph: <strong>{clinic.phone}</strong>
            </span>
            <span className="font-bold text-amber-900">24/7 Helpline: {emergencyNo}</span>
            {clinic.kpme_reg_no && <span>KPME: {clinic.kpme_reg_no}</span>}
            {clinic.rohini_id && <span>ROHINI: {clinic.rohini_id}</span>}
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <div className="inline-block rounded border border-stone-900 bg-stone-900 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
            Surgical Discharge Summary
          </div>
          <div className="mt-1 text-[10px] font-bold text-stone-900">
            {summary.case_type} · {summary.summary_no}
            {summary.ipd_no ? ` · ${summary.ipd_no}` : ''}
          </div>
          <div className="text-[10px] font-semibold text-stone-700">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          {clinic.doctor_kmc_no && (
            <div className="text-[9.5px] text-stone-600">KMC Reg. No: {clinic.doctor_kmc_no}</div>
          )}
        </div>
      </div>

      {/* 2. PATIENT, MRD & INSURANCE GRID */}
      <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border border-stone-300 bg-stone-50/70 p-2 text-[10px] sm:grid-cols-3">
        <div className="space-y-0.5">
          <div>
            <span className="text-stone-500">Patient:</span>{' '}
            <span className="font-bold uppercase text-stone-950">{patient.full_name}</span>
          </div>
          <div>
            <span className="text-stone-500">Age / Sex:</span>{' '}
            <span className="font-semibold">
              {patient.age ?? '—'} Yrs / {patient.sex || '—'}
            </span>
          </div>
          {patient.village_address && (
            <div>
              <span className="text-stone-500">Address:</span>{' '}
              <span className="font-medium">{patient.village_address}</span>
            </div>
          )}
          {patient.phone && (
            <div>
              <span className="text-stone-500">Mobile:</span>{' '}
              <span className="font-medium">{patient.phone}</span>
            </div>
          )}
        </div>

        <div className="space-y-0.5 border-t border-stone-200 pt-1.5 sm:border-l sm:border-t-0 sm:pl-2.5 sm:pt-0">
          <div>
            <span className="text-stone-500">MRD No.:</span>{' '}
            <span className="font-mono font-bold text-stone-950">{patient.patient_code}</span>
          </div>
          <div>
            <span className="text-stone-500">Admitted:</span>{' '}
            <span className="font-medium">{formatDisplayDateTime(summary.admission_at)}</span>
          </div>
          <div>
            <span className="text-stone-500">Surgery:</span>{' '}
            <span className="font-medium">{formatDisplayDateTime(summary.surgery_at)}</span>
          </div>
          <div>
            <span className="text-stone-500">Discharged:</span>{' '}
            <span className="font-medium">{formatDisplayDateTime(summary.discharge_at)}</span>
          </div>
        </div>

        <div className="space-y-0.5 border-t border-stone-200 pt-1.5 sm:border-l sm:border-t-0 sm:pl-2.5 sm:pt-0">
          <div>
            <span className="text-stone-500">Payer:</span>{' '}
            <span className="font-semibold text-stone-900">
              {summary.billing_category}
              {summary.tpa_name ? ` · ${summary.tpa_name}` : ''}
            </span>
          </div>
          {(summary.policy_no || summary.claim_no) && (
            <div>
              <span className="text-stone-500">Policy / Claim:</span>{' '}
              <span className="font-medium">
                {[summary.policy_no, summary.claim_no].filter(Boolean).join(' / ')}
              </span>
            </div>
          )}
          <div>
            <span className="text-stone-500">Allergies:</span>{' '}
            <span className={hasAllergy ? 'font-bold text-red-700' : 'font-semibold text-stone-800'}>
              {summary.allergies || '—'}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Systemic Hx:</span>{' '}
            <span className="font-medium text-stone-800">
              {summary.comorbidities?.length ? summary.comorbidities.join(', ') : 'Nil reported'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. OPERATED EYE, CLINICAL DETAILS & IOL STICKER BOX */}
      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
        <div className="space-y-1.5 sm:col-span-8">
          <div className="flex items-center justify-between rounded bg-stone-900 px-3 py-1 text-white">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-300">
              Operated Eye / ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮಾಡಿದ ಕಣ್ಣು
            </span>
            <span className="text-xs font-extrabold tracking-wide text-amber-300">
              {summary.operated_eye || 'UNSPECIFIED'}
            </span>
          </div>

          <div className="space-y-1 rounded-lg border border-stone-300 bg-white p-2 text-[10px]">
            {summary.chief_complaints && (
              <div>
                <span className="text-stone-500">Chief Complaints:</span>{' '}
                <span className="font-medium text-stone-900">{summary.chief_complaints}</span>
              </div>
            )}
            <div>
              <span className="text-stone-500">Final Diagnosis:</span>{' '}
              <span className="font-bold text-stone-950">{summary.diagnosis || '—'}</span>
              {summary.icd10_code && (
                <span className="ml-1.5 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-stone-700">
                  ICD-10: {summary.icd10_code}
                </span>
              )}
            </div>
            <div>
              <span className="text-stone-500">Procedure:</span>{' '}
              <span className="font-bold text-stone-950">{summary.procedure_name || '—'}</span>{' '}
              <span className="text-stone-600">({summary.anesthesia} Anaesthesia)</span>
            </div>
            <div className="flex flex-wrap gap-x-3 border-t border-stone-200 pt-1 text-[9.5px] text-stone-700">
              <span>
                <strong>Pre-Op VA:</strong> RE {summary.pre_op_va_re || '—'} | LE {summary.pre_op_va_le || '—'}
              </span>
              <span>
                <strong>IOP:</strong> RE {summary.pre_op_iop_re || '—'} | LE {summary.pre_op_iop_le || '—'}
              </span>
              <span>
                <strong>BP:</strong> {summary.pre_op_bp || '—'}
              </span>
              <span>
                <strong>RBS:</strong> {summary.pre_op_rbs || '—'}
              </span>
            </div>
            {summary.intra_op_notes && (
              <div className="border-t border-stone-200 pt-1 text-[9.5px] text-stone-700">
                <strong className="text-stone-900">Intra-Op Course:</strong> {summary.intra_op_notes}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 text-[9.5px] text-stone-700">
              <span>
                <strong>Discharge Status:</strong> {summary.discharge_status} ({summary.discharge_condition})
              </span>
              <span>
                <strong>Dressing:</strong> {summary.dressing_status}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated 60mm x 35mm Physical IOL Sticker Box */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-300 bg-stone-50/60 p-2 sm:col-span-4">
          <div className="flex min-h-[30mm] flex-col items-center justify-center rounded border border-dashed border-stone-400 bg-white p-1.5 text-center">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-600">
              Affix Physical IOL Sticker
            </span>
            <span className="mt-0.5 text-[8px] text-stone-400">60mm × 35mm Implant Barcode Area</span>
          </div>
          <div className="mt-1.5 space-y-0.5 text-[9.5px] text-stone-800">
            <div>
              <strong>IOL Model:</strong>{' '}
              {summary.no_iol_confirmed ? 'No IOL / Aphakia' : summary.iol_model || '—'}
            </div>
            <div className="flex justify-between gap-1">
              <span>
                <strong>Power:</strong> {summary.no_iol_confirmed ? 'N/A' : summary.iol_power || '—'}
              </span>
              <span>
                <strong>SN/Lot:</strong> {summary.no_iol_confirmed ? 'N/A' : summary.iol_batch || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPACT POST-OP MEDICATION TABLE */}
      <div className="mt-2.5">
        <div className="flex items-baseline justify-between border-b border-stone-800 pb-0.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-950">
            {showEn ? 'Post-Operative Medications' : 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಔಷಧಿಗಳು'}
          </span>
          {printLang === 'bilingual' && (
            <span className="font-kannada text-[10px] font-medium text-stone-600">
              ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಔಷಧಿಗಳು
            </span>
          )}
        </div>

        {summary.eye_drops && summary.eye_drops.length > 0 && (
          <table className="mt-1 w-full border-collapse text-[9.5px]">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[9px] uppercase text-stone-700">
                <th className="px-1.5 py-1 font-bold">Eye Drop / Ointment</th>
                <th className="w-24 px-1.5 py-1 font-bold">Eye</th>
                <th className="px-1.5 py-1 font-bold">Schedule / Tapering</th>
                <th className="w-24 px-1.5 py-1 text-right font-bold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {summary.eye_drops.map((d, idx) => (
                <tr key={idx}>
                  <td className="px-1.5 py-1 font-semibold text-stone-950">{d.name}</td>
                  <td className="px-1.5 py-1 font-medium text-stone-800">
                    {d.eye === 'Operated Eye' ? summary.operated_eye || 'Operated Eye' : d.eye}
                  </td>
                  <td className="px-1.5 py-1 text-stone-800">{d.schedule}</td>
                  <td className="px-1.5 py-1 text-right font-semibold text-stone-900">{d.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {summary.oral_meds && summary.oral_meds.length > 0 && (
          <table className="mt-1.5 w-full border-collapse text-[9.5px]">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[9px] uppercase text-stone-700">
                <th className="px-1.5 py-1 font-bold">Oral Tablet / Medicine</th>
                <th className="w-24 px-1.5 py-1 font-bold">Dose</th>
                <th className="w-28 px-1.5 py-1 font-bold">Timing</th>
                <th className="w-24 px-1.5 py-1 text-right font-bold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {summary.oral_meds.map((m, idx) => (
                <tr key={idx}>
                  <td className="px-1.5 py-1 font-semibold text-stone-950">{m.name}</td>
                  <td className="px-1.5 py-1 font-medium text-stone-800">{m.dosage}</td>
                  <td className="px-1.5 py-1 text-stone-800">{m.timing}</td>
                  <td className="px-1.5 py-1 text-right font-semibold text-stone-900">{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-1 rounded bg-stone-50 px-2 py-1 text-[9px] text-stone-700">
          {showEn && (
            <span>
              <strong>Drop Rules:</strong> Wash hands before drops · Shake white/steroid bottles · Keep 5 min gap between drops · Continue regular BP, Sugar & Heart tablets.
            </span>
          )}
          {showKn && (
            <span className={`font-kannada block ${showEn ? 'mt-0.5 text-stone-600' : ''}`}>
              ಡ್ರಾಪ್ಸ್ ಹಾಕುವ ಮುನ್ನ ಕೈ ತೊಳೆಯಿರಿ · ಎರಡು ಡ್ರಾಪ್ಸ್ ನಡುವೆ 5 ನಿಮಿಷ ಅಂತರವಿರಲಿ · ನಿಮ್ಮ ಬಿ.ಪಿ., ಶುಗರ್ ಮತ್ತು ಹೃದಯದ ಮಾತ್ರೆಗಳನ್ನು ಎಂದಿನಂತೆ ಮುಂದುವರಿಸಿ.
            </span>
          )}
        </div>
      </div>

      {/* 5. FOLLOW-UP DATES, CARE & RED FLAGS */}
      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
        <div className="space-y-1.5 rounded-lg border border-stone-300 bg-white p-2 sm:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-200 pb-0.5 text-[10px] font-bold text-stone-900">
            <span className="uppercase tracking-wider">
              {showEn ? 'Follow-Up & Eye Care' : 'ಮರು ತಪಾಸಣೆ ಮತ್ತು ಕಾಳಜಿ'}
            </span>
            {printLang === 'bilingual' && (
              <span className="font-kannada font-medium text-stone-600">ಮರು ತಪಾಸಣೆ</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded bg-stone-50 p-1.5 text-center text-[9.5px]">
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
                  Do NOT rub the eye or let water enter for <strong>{summary.head_bath_days} days</strong> (no head bath).
                </span>
              )}
              {showKn && (
                <span className={`font-kannada block ${showEn ? 'text-[9px] text-stone-600' : ''}`}>
                  ಕಣ್ಣನ್ನು ಉಜ್ಜಬೇಡಿ. {summary.head_bath_days} ದಿನಗಳವರೆಗೆ ಕಣ್ಣಿಗೆ ನೀರು ತಾಗಿಸಬೇಡಿ ಮತ್ತು ತಲೆ ಸ್ನಾನ ಮಾಡಬೇಡಿ.
                </span>
              )}
            </li>
            <li>
              {showEn && (
                <span>Wear dark glasses outdoors & shield while sleeping. Avoid dust, smoke & heavy lifting.</span>
              )}
              {showKn && (
                <span className={`font-kannada block ${showEn ? 'text-[9px] text-stone-600' : ''}`}>
                  ಹೊರಗೆ ಕಪ್ಪು ಕನ್ನಡಕ ಮತ್ತು ಮಲಗುವಾಗ ಶೀಲ್ಡ್ ಧರಿಸಿ. ಧೂಳು, ಹೊಗೆ ಮತ್ತು ಭಾರ ಎತ್ತುವುದನ್ನು ತಪ್ಪಿಸಿ.
                </span>
              )}
            </li>
          </ul>
        </div>

        {/* Emergency Red Flags */}
        <div className="flex flex-col justify-between rounded-lg border border-amber-400 bg-amber-50/50 p-2 sm:col-span-5">
          <div>
            <div className="rounded bg-stone-900 px-2 py-0.5 text-center text-[9.5px] font-bold uppercase tracking-wider text-white">
              {showEn && showKn
                ? 'Emergency Warning / ತುರ್ತು ಎಚ್ಚರಿಕೆ'
                : showEn
                  ? 'Emergency Warning Signs'
                  : 'ತುರ್ತು ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು'}
            </div>
            <ul className="mt-1.5 space-y-0.5 pl-3.5 text-[9px] text-stone-900" style={{ listStyle: 'disc' }}>
              <li>
                {showEn && 'Sudden severe eye pain'}
                {showEn && showKn && ' / '}
                {showKn && <span className="font-kannada">ತೀವ್ರ ಕಣ್ಣಿನ ನೋವು</span>}
              </li>
              <li>
                {showEn && 'Sudden drop or blur in vision'}
                {showEn && showKn && ' / '}
                {showKn && <span className="font-kannada">ದೃಷ್ಟಿ ಮಂಜಾಗುವುದು</span>}
              </li>
              <li>
                {showEn && 'Increasing redness or swelling'}
                {showEn && showKn && ' / '}
                {showKn && <span className="font-kannada">ಕಣ್ಣು ಕೆಂಪಾಗುವುದು / ಊತ</span>}
              </li>
              <li>
                {showEn && 'Yellow/white sticky discharge'}
                {showEn && showKn && ' / '}
                {showKn && <span className="font-kannada">ಕಣ್ಣಿನಲ್ಲಿ ಕೀವು / ಸ್ರಾವ</span>}
              </li>
            </ul>
          </div>
          <div className="mt-1.5 rounded border border-amber-400 bg-white px-2 py-1 text-center text-[10px] font-bold text-amber-950">
            24/7 Helpline: {emergencyNo}
          </div>
        </div>
      </div>

      {/* 6. SIGN-OFF & THUMB IMPRESSION */}
      <div className="mt-2.5 grid grid-cols-3 gap-3 border-t-2 border-stone-900 pt-2 text-[9px]">
        <div>
          <div className="h-7" />
          <div className="border-t border-stone-400 pt-0.5 font-bold text-stone-900">
            {summary.prepared_by || 'OT Assistant'}
          </div>
          <div className="text-stone-500">Prepared By (Staff)</div>
        </div>

        <div className="text-center">
          <div className="h-7" />
          <div className="border-t border-stone-400 pt-0.5 font-bold text-stone-950">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          <div className="text-stone-500">
            Surgeon Signature & Stamp{clinic.doctor_kmc_no ? ` · KMC: ${clinic.doctor_kmc_no}` : ''}
          </div>
        </div>

        <div className="text-right">
          <div className="h-7" />
          <div className="border-t border-stone-400 pt-0.5 font-bold text-stone-900">
            {summary.attendant_name || 'Patient / Attendant'}
          </div>
          <div className="text-stone-500">Signature / Thumb Impression</div>
        </div>
      </div>
    </div>
  );
}
