import { formatDisplayDate, formatDisplayDateTime } from '../lib/dates';
import type { ClinicSettings, DischargeSummary, Patient } from '../types/database';

function scheduleSteps(schedule: string): string[] {
  const parts = schedule
    .replace(/\r/g, '')
    .split(/\s*(?:->|→)\s*/)
    .flatMap((part) => part.split('\n'))
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [schedule];
}

interface PrintableDischargeSummaryProps {
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'> & { phone?: string };
  summary: DischargeSummary;
}

export function PrintableDischargeSummary({ clinic, patient, summary }: PrintableDischargeSummaryProps) {
  const emergencyNo = clinic.emergency_phone || clinic.phone;

  return (
    <div className="print-sheet-a4 mx-auto bg-white p-4 sm:p-7 text-[11px] leading-snug text-stone-900 font-sans shadow-sm rounded-2xl border border-stone-200">
      {/* ── 1. CLINIC & CERTIFICATE HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-stone-800 pb-3 gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-stone-950 font-display">
              {clinic.clinic_name}
            </h1>
            <span className="font-kannada text-xs font-semibold text-stone-700">
              ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ
            </span>
          </div>
          <div className="text-[11px] font-semibold text-stone-700">{clinic.tagline}</div>
          <div className="mt-0.5 text-[10px] text-stone-600">{clinic.address}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] font-medium text-stone-800">
            <span>Ph: <strong>{clinic.phone}</strong></span>
            <span className="text-amber-900 font-bold">24/7 Helpline: {emergencyNo}</span>
            {clinic.kpme_reg_no && <span className="text-stone-600">KPME: {clinic.kpme_reg_no}</span>}
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="inline-block rounded-md border border-stone-800 bg-stone-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Surgical Discharge Summary
          </div>
          <div className="mt-1.5 text-[11px] font-bold text-stone-800">
            {summary.case_type} · {summary.summary_no}
          </div>
          <div className="text-[10.5px] font-semibold text-stone-700">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          {clinic.doctor_kmc_no && (
            <div className="text-[10px] text-stone-500">KMC Reg No: {clinic.doctor_kmc_no}</div>
          )}
        </div>
      </div>

      {/* ── 2. PATIENT & ADMINISTRATIVE GRID ── */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-[10.5px]">
        <div className="space-y-1">
          <div>
            <span className="text-stone-500">Patient:</span>{' '}
            <span className="font-bold uppercase text-stone-950">{patient.full_name}</span>
          </div>
          <div>
            <span className="text-stone-500">Age / Sex:</span>{' '}
            <span className="font-semibold">{patient.age ?? '—'} Yrs / {patient.sex || '—'}</span>
          </div>
          {patient.village_address && (
            <div>
              <span className="text-stone-500">Place:</span>{' '}
              <span className="font-medium">{patient.village_address}</span>
            </div>
          )}
          {patient.phone && (
            <div>
              <span className="text-stone-500">Phone:</span>{' '}
              <span className="font-medium">{patient.phone}</span>
            </div>
          )}
        </div>

        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-stone-200 pt-2 sm:pt-0 sm:pl-3">
          <div>
            <span className="text-stone-500">Patient ID:</span>{' '}
            <span className="font-bold text-stone-950">{patient.patient_code}</span>
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

        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-stone-200 pt-2 sm:pt-0 sm:pl-3">
          <div>
            <span className="text-stone-500">Status:</span>{' '}
            <span className="font-semibold text-stone-900">{summary.discharge_status}</span>
          </div>
          <div>
            <span className="text-stone-500">Category:</span>{' '}
            <span className="font-medium">{summary.billing_category}{summary.policy_no ? ` (${summary.policy_no})` : ''}</span>
          </div>
          <div>
            <span className="text-stone-500">Allergies:</span>{' '}
            <span className={summary.allergies && summary.allergies.toUpperCase() !== 'NKDA' ? 'font-bold text-red-700' : 'font-semibold text-stone-800'}>
              {summary.allergies || 'NKDA'}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Conditions:</span>{' '}
            <span className="font-medium text-stone-800">{summary.comorbidities?.length ? summary.comorbidities.join(', ') : 'None reported'}</span>
          </div>
        </div>
      </div>

      {/* ── 3. OPERATED EYE & CLINICAL PROCEDURE ── */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 space-y-2">
          {/* Operated Eye Banner */}
          <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900 px-3 py-1.5 text-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-300">Operated Eye</span>
            <span className="text-sm font-extrabold tracking-wide text-amber-300">{summary.operated_eye}</span>
          </div>

          {/* Diagnosis & Procedure box */}
          <div className="rounded-xl border border-stone-200 p-3 space-y-1.5 bg-white">
            <div>
              <span className="text-stone-500">Final Diagnosis:</span>{' '}
              <span className="font-bold text-stone-950">{summary.diagnosis}</span>
            </div>
            <div>
              <span className="text-stone-500">Procedure Performed:</span>{' '}
              <span className="font-bold text-stone-950">{summary.procedure_name}</span>{' '}
              <span className="text-stone-600">({summary.anesthesia} Anesthesia)</span>
            </div>
            <div className="flex flex-wrap gap-x-4 border-t border-stone-100 pt-1.5 text-[10px] text-stone-700">
              <span><strong>VA:</strong> RE {summary.pre_op_va_re || '—'} | LE {summary.pre_op_va_le || '—'}</span>
              <span><strong>IOP:</strong> RE {summary.pre_op_iop_re || '—'} | LE {summary.pre_op_iop_le || '—'}</span>
              <span><strong>BP:</strong> {summary.pre_op_bp || '—'}</span>
              <span><strong>RBS:</strong> {summary.pre_op_rbs || '—'}</span>
            </div>
            {summary.intra_op_notes && (
              <div className="border-t border-stone-100 pt-1.5 text-[10px] text-stone-700">
                <span className="font-bold text-stone-900">Intra-Op Course:</span> {summary.intra_op_notes}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 text-[10px] text-stone-700">
              <span><strong>Discharge Condition:</strong> {summary.discharge_condition}</span>
              <span><strong>Eye Dressing:</strong> {summary.dressing_status}</span>
            </div>
          </div>
        </div>

        {/* Dedicated IOL Sticker Box (Standard 60mm x 35mm implant sticker area) */}
        <div className="sm:col-span-4 flex flex-col justify-between rounded-xl border border-stone-300 bg-stone-50/60 p-3">
          <div className="flex min-h-[32mm] flex-col items-center justify-center rounded-lg border border-dashed border-stone-400 bg-white/80 p-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Affix IOL / Implant Sticker
            </span>
            <span className="mt-0.5 text-[8.5px] text-stone-400">Standard 60mm × 35mm sticker</span>
          </div>
          <div className="mt-2 space-y-0.5 text-[10px] text-stone-800">
            <div><strong>Lens:</strong> {summary.iol_model || '—'}</div>
            <div className="flex justify-between gap-1">
              <span><strong>Power:</strong> {summary.iol_power || '—'}</span>
              <span><strong>Batch:</strong> {summary.iol_batch || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. POST-OPERATIVE MEDICATIONS (BILINGUAL TABLE) ── */}
      <div className="mt-4">
        <div className="flex items-end justify-between gap-3 border-b-2 border-stone-800 pb-1">
          <p className="text-[12px] font-bold uppercase tracking-wide text-stone-950">After the operation</p>
          <p className="font-kannada text-[11px] text-stone-600">ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಔಷಧಿಗಳು</p>
        </div>

        {summary.eye_drops && summary.eye_drops.length > 0 && (
          <div className="mt-3 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Eye drops and ointment</p>
            {summary.eye_drops.map((d, idx) => {
              const steps = scheduleSteps(d.schedule);
              const eye = d.eye === 'Operated Eye' ? summary.operated_eye : d.eye;
              return (
                <article key={idx} className="break-inside-avoid rounded-lg border border-stone-200 p-3">
                  <p className="text-[13px] font-semibold leading-snug text-stone-950">{d.name}</p>
                  <dl className="mt-2 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5 text-[12px] leading-relaxed">
                    <dt className="text-stone-500">Eye</dt>
                    <dd className="text-stone-900">{eye}</dd>
                    <dt className="text-stone-500">How often</dt>
                    <dd>
                      {steps.length === 1 ? (
                        <span className="text-stone-900">{steps[0]}</span>
                      ) : (
                        <ol className="space-y-1 border-l-2 border-stone-300 pl-3">
                          {steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="text-stone-900">
                              {stepIndex > 0 ? <span className="mr-1 text-stone-400">↓</span> : null}
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                    </dd>
                    <dt className="text-stone-500">For</dt>
                    <dd className="font-medium text-stone-950">{d.duration}</dd>
                  </dl>
                </article>
              );
            })}
          </div>
        )}

        {summary.oral_meds && summary.oral_meds.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Tablets</p>
            {summary.oral_meds.map((m, idx) => (
              <article key={idx} className="break-inside-avoid rounded-lg border border-stone-200 p-3">
                <p className="text-[13px] font-semibold leading-snug text-stone-950">{m.name}</p>
                <dl className="mt-2 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5 text-[12px] leading-relaxed">
                  <dt className="text-stone-500">Dose</dt>
                  <dd className="text-stone-900">{m.dosage}</dd>
                  <dt className="text-stone-500">When</dt>
                  <dd className="text-stone-900">{m.timing}</dd>
                  <dt className="text-stone-500">For</dt>
                  <dd className="font-medium text-stone-950">{m.duration}</dd>
                </dl>
              </article>
            ))}
          </div>
        )}

        <ul className="mt-4 space-y-1.5 pl-4 text-[12px] leading-relaxed text-stone-800" style={{ listStyle: 'disc' }}>
          <li>Wash your hands before putting in a drop.</li>
          <li>Shake the bottle if it says “shake”.</li>
          <li>Wait five minutes between two different drops.</li>
          <li>Keep taking your blood pressure, sugar, and heart tablets as usual.</li>
        </ul>
      </div>

      {/* ── 5. FOLLOW-UP DATES & PRECAUTIONS ── */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Follow-up & Care */}
        <div className="sm:col-span-7 space-y-2 rounded-xl border border-stone-300 p-3 bg-white">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-900 border-b border-stone-150 pb-1">
            <span className="uppercase tracking-wider">Follow-Up Schedule</span>
            <span className="font-kannada text-xs font-normal text-stone-600">ಮರು ತಪಾಸಣೆ</span>
          </div>

          <dl className="space-y-2 text-[12px]">
            <div className="flex items-baseline justify-between gap-3 border-b border-stone-100 pb-1.5">
              <dt className="text-stone-500">Next day</dt>
              <dd className="font-semibold text-stone-950">{formatDisplayDate(summary.follow_up_1)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-stone-100 pb-1.5">
              <dt className="text-stone-500">One week</dt>
              <dd className="font-semibold text-stone-950">{formatDisplayDate(summary.follow_up_2)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-stone-500">Glasses check</dt>
              <dd className="font-semibold text-stone-950">{formatDisplayDate(summary.follow_up_3)}</dd>
            </div>
          </dl>

          <ul className="space-y-2 border-t border-stone-200 pt-3 pl-4 text-[12px] leading-relaxed text-stone-800" style={{ listStyle: 'disc' }}>
            <li>
              Do not rub the operated eye, and do not let water into it for <strong>{summary.head_bath_days} days</strong>. No head bath in that time.
              <p className="font-kannada mt-1 text-stone-600">ಕಣ್ಣನ್ನು ಉಜ್ಜಬೇಡಿ. {summary.head_bath_days} ದಿನಗಳವರೆಗೆ ಕಣ್ಣಿಗೆ ನೀರು ತಾಗಿಸಬೇಡಿ. ತಲೆ ಸ್ನಾನ ಬೇಡ.</p>
            </li>
            <li>
              Dark glasses outdoors. Eye shield while sleeping. Avoid dust and heavy lifting.
              <p className="font-kannada mt-1 text-stone-600">ಹೊರಗೆ ಕಪ್ಪು ಕನ್ನಡಕ. ಮಲಗುವಾಗ ಶೀಲ್ಡ್. ಧೂಳು ಮತ್ತು ಭಾರ ಎತ್ತುವುದನ್ನು ತಪ್ಪಿಸಿ.</p>
            </li>
          </ul>
        </div>

        {/* Emergency Warning Signs */}
        <div className="sm:col-span-5 flex flex-col justify-between rounded-xl border border-amber-300 bg-amber-50/50 p-3">
          <div>
            <div className="rounded-md bg-stone-900 px-2.5 py-1 text-center text-[10.5px] font-bold uppercase tracking-wider text-white">
              Emergency Warning Signs / ತುರ್ತು ಎಚ್ಚರಿಕೆ
            </div>
            <div className="mt-2 space-y-1 text-[10px] text-stone-800">
              <div className="font-bold text-amber-950">Call helpline immediately if you notice:</div>
              <ul className="mt-1 space-y-1.5 pl-4 leading-relaxed" style={{ listStyle: 'disc' }}>
                <li>Severe sudden eye pain / ತೀವ್ರ ಕಣ್ಣಿನ ನೋವು</li>
                <li>Sudden drop in vision / ದೃಷ್ಟಿ ಮಂಜಾಗುವುದು</li>
                <li>Excessive redness or swelling / ಕಣ್ಣು ಕೆಂಪಾಗುವುದು</li>
                <li>White/yellow discharge / ಕಣ್ಣಿನಲ್ಲಿ ಸ್ರಾವ</li>
              </ul>
            </div>
          </div>

          <div className="mt-2.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-center text-[11px] font-bold text-amber-950 shadow-sm">
            24/7 Helpline: {emergencyNo}
          </div>
        </div>
      </div>

      {/* ── 6. FORMAL DOCTOR & STAFF SIGN-OFF ── */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t-2 border-stone-800 pt-3 text-[10px]">
        <div>
          <div className="h-9" />
          <div className="border-t border-stone-300 pt-1 font-bold text-stone-900">
            {summary.prepared_by || 'Staff Assistant'}
          </div>
          <div className="text-[9px] text-stone-500">Prepared By (Staff Signature)</div>
        </div>

        <div className="text-center">
          <div className="h-9" />
          <div className="border-t border-stone-300 pt-1 font-bold text-stone-950">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          <div className="text-[9px] text-stone-500">
            Surgeon Signature & Hospital Stamp {clinic.doctor_kmc_no ? `· KMC: ${clinic.doctor_kmc_no}` : ''}
          </div>
        </div>

        <div className="text-right">
          <div className="h-9" />
          <div className="border-t border-stone-300 pt-1 font-bold text-stone-900">
            Patient / Attendant
          </div>
          <div className="text-[9px] text-stone-500">Signature / Thumb Impression</div>
        </div>
      </div>
    </div>
  );
}
