import { formatDisplayDate, formatDisplayDateTime } from '../lib/dates';
import type { ClinicSettings, DischargeSummary, Patient } from '../types/database';

interface PrintableDischargeSummaryProps {
  clinic: ClinicSettings;
  patient: Pick<Patient, 'patient_code' | 'full_name' | 'age' | 'sex' | 'village_address'> & { phone?: string };
  summary: DischargeSummary;
}

export function PrintableDischargeSummary({ clinic, patient, summary }: PrintableDischargeSummaryProps) {
  const emergencyNo = clinic.emergency_phone || clinic.phone;

  return (
    <div className="print-sheet-a4 mx-auto bg-white text-[11px] leading-snug text-slate-950">
      {/* 1. HEADER */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2">
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-clinic-900">
            {clinic.clinic_name}
          </h1>
          <div className="text-[10.5px] font-semibold text-slate-700">{clinic.tagline}</div>
          <div className="mt-0.5 text-[10px] text-slate-700">{clinic.address}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] font-semibold text-slate-800">
            <span>Ph: {clinic.phone}</span>
            <span className="text-red-700">24/7 Emergency: {emergencyNo}</span>
            {clinic.kpme_reg_no && <span>KPME Reg: {clinic.kpme_reg_no}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block rounded bg-slate-900 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
            DISCHARGE SUMMARY
          </div>
          <div className="mt-1 text-[10px] font-bold text-slate-700">
            {summary.case_type} • {summary.summary_no}
          </div>
          <div className="text-[10px] font-semibold text-slate-600">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          {clinic.doctor_kmc_no && (
            <div className="text-[9.5px] text-slate-600">KMC Reg: {clinic.doctor_kmc_no}</div>
          )}
        </div>
      </div>

      {/* 2. PATIENT & TIMESTAMPS GRID */}
      <div className="mt-2 grid grid-cols-3 gap-2 rounded border border-slate-400 bg-slate-50/70 p-2 text-[10.5px]">
        <div className="space-y-0.5">
          <div>
            <span className="font-bold">Patient:</span>{' '}
            <span className="font-extrabold uppercase">{patient.full_name}</span>
          </div>
          <div>
            <span className="font-bold">Age / Sex:</span> {patient.age ?? '—'} Yrs / {patient.sex || '—'}
          </div>
          {patient.village_address && (
            <div>
              <span className="font-bold">Place:</span> {patient.village_address}
            </div>
          )}
          {patient.phone && (
            <div>
              <span className="font-bold">Phone:</span> {patient.phone}
            </div>
          )}
        </div>

        <div className="space-y-0.5 border-l border-slate-300 pl-2">
          <div>
            <span className="font-bold">Patient ID:</span>{' '}
            <span className="font-extrabold">{patient.patient_code}</span>
          </div>
          <div>
            <span className="font-bold">Admitted:</span> {formatDisplayDateTime(summary.admission_at)}
          </div>
          <div>
            <span className="font-bold">Surgery:</span> {formatDisplayDateTime(summary.surgery_at)}
          </div>
          <div>
            <span className="font-bold">Discharged:</span> {formatDisplayDateTime(summary.discharge_at)}
          </div>
        </div>

        <div className="space-y-0.5 border-l border-slate-300 pl-2">
          <div>
            <span className="font-bold">Status:</span> {summary.discharge_status}
          </div>
          <div>
            <span className="font-bold">Category:</span> {summary.billing_category}
            {summary.policy_no ? ` (${summary.policy_no})` : ''}
          </div>
          <div>
            <span className="font-bold">Allergies:</span>{' '}
            <span
              className={
                summary.allergies && summary.allergies.toUpperCase() !== 'NKDA'
                  ? 'font-extrabold text-red-700'
                  : 'font-semibold'
              }
            >
              {summary.allergies || 'NKDA'}
            </span>
          </div>
          <div>
            <span className="font-bold">Conditions:</span>{' '}
            {summary.comorbidities?.length ? summary.comorbidities.join(', ') : 'None'}
          </div>
        </div>
      </div>

      {/* 3. OPERATED EYE BANNER + CLINICAL / IOL STICKER SPLIT */}
      <div className="mt-2 grid grid-cols-12 gap-2">
        <div className="col-span-8 space-y-1.5">
          <div className="flex items-center justify-between rounded border-2 border-slate-900 bg-slate-900 px-2.5 py-1 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wide">OPERATED EYE:</span>
            <span className="text-sm font-extrabold tracking-wide">{summary.operated_eye}</span>
          </div>

          <div className="rounded border border-slate-300 p-2 space-y-1">
            <div>
              <span className="font-bold">Final Diagnosis:</span> {summary.diagnosis}
            </div>
            <div>
              <span className="font-bold">Procedure Performed:</span>{' '}
              <span className="font-bold">{summary.procedure_name}</span>{' '}
              <span className="text-slate-600">({summary.anesthesia} Anesthesia)</span>
            </div>
            <div className="flex flex-wrap gap-x-3 border-t border-slate-200 pt-1 text-[10px]">
              <span>
                <strong>VA:</strong> RE {summary.pre_op_va_re || '—'} | LE {summary.pre_op_va_le || '—'}
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
            <div className="border-t border-slate-200 pt-1 text-[10px]">
              <span className="font-bold">Intra-Op / Course Notes:</span> {summary.intra_op_notes}
            </div>
            {summary.in_clinic_meds && (
              <div className="text-[9.5px] text-slate-700">
                <span className="font-bold">In-Clinic Meds Given:</span> {summary.in_clinic_meds}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 text-[10px]">
              <span>
                <strong>Condition at Discharge:</strong> {summary.discharge_condition}
              </span>
              <span>
                <strong>Eye Dressing:</strong> {summary.dressing_status}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated 60mm x 35mm IOL Sticker Zone */}
        <div className="col-span-4 flex flex-col justify-between rounded border border-slate-400 p-2">
          <div className="flex min-h-[34mm] flex-col items-center justify-center rounded border-2 border-dashed border-slate-400 bg-slate-50/50 p-1.5 text-center">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
              Affix IOL / Implant Sticker Here
            </span>
          </div>
          <div className="mt-1.5 space-y-0.5 text-[9.5px]">
            <div>
              <strong>Lens Model:</strong> {summary.iol_model || '__________________'}
            </div>
            <div className="flex justify-between gap-1">
              <span>
                <strong>Power:</strong> {summary.iol_power || '________'}
              </span>
              <span>
                <strong>SN/Batch:</strong> {summary.iol_batch || '________'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. POST-OPERATIVE MEDICATIONS (HERO SECTION — CLEAR & READABLE) */}
      <div className="mt-2 rounded border border-slate-800">
        <div className="bg-slate-800 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
          Post-Operative Medications / ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಔಷಧಿಗಳು
        </div>

        <div className="p-2 space-y-2">
          {summary.eye_drops && summary.eye_drops.length > 0 && (
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100 text-left">
                  <th className="px-1.5 py-1 font-bold">Eye Drops / Ointment</th>
                  <th className="w-24 px-1.5 py-1 font-bold">Which Eye</th>
                  <th className="px-1.5 py-1 font-bold">Dosage / Tapering Schedule</th>
                  <th className="w-24 px-1.5 py-1 font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {summary.eye_drops.map((d, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="px-1.5 py-1 font-bold">{d.name}</td>
                    <td className="px-1.5 py-1 font-semibold">
                      {d.eye === 'Operated Eye' ? summary.operated_eye : d.eye}
                    </td>
                    <td className="px-1.5 py-1">{d.schedule}</td>
                    <td className="px-1.5 py-1 font-semibold">{d.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {summary.oral_meds && summary.oral_meds.length > 0 && (
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100 text-left">
                  <th className="px-1.5 py-1 font-bold">Oral Tablets</th>
                  <th className="w-28 px-1.5 py-1 font-bold">Dose (M-A-N)</th>
                  <th className="w-32 px-1.5 py-1 font-bold">Food Timing</th>
                  <th className="w-24 px-1.5 py-1 font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {summary.oral_meds.map((m, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="px-1.5 py-1 font-bold">{m.name}</td>
                    <td className="px-1.5 py-1 font-semibold">{m.dosage}</td>
                    <td className="px-1.5 py-1">{m.timing}</td>
                    <td className="px-1.5 py-1 font-semibold">{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="rounded bg-slate-100 px-2 py-1 text-[9.5px] font-semibold text-slate-800">
            • Wash hands before applying drops • Shake milky drops well • Keep 5 minutes gap between two drops • Continue your regular BP / Sugar / Heart tablets as advised by your physician.
          </div>
        </div>
      </div>

      {/* 5. FOLLOW-UP + BILINGUAL PRECAUTIONS & RED FLAGS */}
      <div className="mt-2 grid grid-cols-12 gap-2">
        <div className="col-span-6 space-y-1.5 rounded border border-slate-400 p-2">
          <div className="text-[10.5px] font-extrabold uppercase text-slate-900">
            Follow-Up Dates / ಮರು ತಪಾಸಣೆ ದಿನಾಂಕಗಳು
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="rounded border border-slate-300 bg-slate-50 p-1">
              <div className="text-[9px] font-semibold text-slate-500">1st Visit (Next Day)</div>
              <div className="font-extrabold">{formatDisplayDate(summary.follow_up_1)}</div>
            </div>
            <div className="rounded border border-slate-300 bg-slate-50 p-1">
              <div className="text-[9px] font-semibold text-slate-500">2nd Visit (1 Wk)</div>
              <div className="font-extrabold">{formatDisplayDate(summary.follow_up_2)}</div>
            </div>
            <div className="rounded border border-slate-300 bg-slate-50 p-1">
              <div className="text-[9px] font-semibold text-slate-500">Glasses Check</div>
              <div className="font-extrabold">{formatDisplayDate(summary.follow_up_3)}</div>
            </div>
          </div>
          <div className="text-[9.5px] font-bold text-slate-700">
            * Bring all eye drops & this sheet on every visit.
          </div>

          <div className="border-t border-slate-200 pt-1 text-[9.5px] space-y-0.5">
            <div className="font-extrabold text-slate-900">
              Post-Op Care / ಎಚ್ಚರಿಕೆಗಳು:
            </div>
            <div>• Do NOT rub, press, or splash water in operated eye for <strong>{summary.head_bath_days} days</strong> (head bath restricted).</div>
            <div className="font-kannada text-slate-800">• ಕಣ್ಣನ್ನು ಉಜ್ಜಬೇಡಿ. {summary.head_bath_days} ದಿನಗಳವರೆಗೆ ಕಣ್ಣಿಗೆ ನೀರು ತಾಗಿಸಬೇಡಿ (ತಲೆ ಸ್ನಾನ ಬೇಡ).</div>
            <div>• Wear dark glasses outdoors & protective shield at night. Avoid smoke, dust & heavy lifting.</div>
            <div className="font-kannada text-slate-800">• ಹೊರಗೆ ಹೋಗುವಾಗ ಕಪ್ಪು ಕನ್ನಡಕ ಧರಿಸಿ. ಹೊಗೆ, ಧೂಳು ಮತ್ತು ಭಾರ ಎತ್ತುವುದನ್ನು ತಪ್ಪಿಸಿ.</div>
          </div>
        </div>

        <div className="col-span-6 flex flex-col justify-between rounded border-2 border-red-700 bg-red-50/40 p-2">
          <div>
            <div className="rounded bg-red-700 px-2 py-0.5 text-center text-[10.5px] font-extrabold uppercase tracking-wide text-white">
              EMERGENCY WARNING SIGNS / ತುರ್ತು ಎಚ್ಚರಿಕೆ ಲಕ್ಷಣಗಳು
            </div>
            <div className="mt-1.5 space-y-1 text-[10px]">
              <div className="font-bold text-red-900">
                Report IMMEDIATELY or call if you notice any of these:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 font-semibold text-slate-900">
                <li>Sudden or severe eye pain / ತೀವ್ರವಾದ ಕಣ್ಣಿನ ನೋವು</li>
                <li>Sudden decrease or blurring of vision / ದೃಷ್ಟಿ ಹಠಾತ್ ಮಂಜಾಗುವುದು</li>
                <li>Increasing redness or eyelid swelling / ಕಣ್ಣು ಕೆಂಪಾಗುವುದು ಅಥವಾ ಊತ</li>
                <li>Yellowish/white pus discharge / ಕಣ್ಣಿನಿಂದ ಕೀವು ಅಥವಾ ಹಳದಿ ಸ್ರಾವ</li>
                <li>Accidental hit or injury to eye / ಕಣ್ಣಿಗೆ ಪೆಟ್ಟು ಬಿದ್ದರೆ</li>
              </ul>
            </div>
          </div>

          <div className="mt-2 rounded border border-red-300 bg-white px-2 py-1 text-center text-[10.5px] font-extrabold text-red-800">
            24/7 Emergency Helpline: {emergencyNo}
          </div>
        </div>
      </div>

      {/* 6. SIGN-OFF BAR */}
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-400 pt-2 text-[9.5px]">
        <div>
          <div className="h-8" />
          <div className="border-t border-slate-400 pt-0.5 font-bold">
            Prepared By: {summary.prepared_by || 'Assistant'}
          </div>
          <div className="text-[9px] text-slate-500">Staff Signature</div>
        </div>

        <div className="text-center">
          <div className="h-8" />
          <div className="border-t border-slate-400 pt-0.5 font-bold">
            {clinic.doctor_name}, {clinic.doctor_qualification}
          </div>
          <div className="text-[9px] text-slate-500">
            Operating Surgeon Sign & Stamp {clinic.doctor_kmc_no ? `• KMC: ${clinic.doctor_kmc_no}` : ''}
          </div>
        </div>

        <div className="text-right">
          <div className="h-8" />
          <div className="border-t border-slate-400 pt-0.5 font-bold">
            Patient / Attendant Sign or Thumbprint
          </div>
          <div className="text-[8.5px] text-slate-600">
            Summary received; eye drops & warning signs explained.
          </div>
        </div>
      </div>
    </div>
  );
}
