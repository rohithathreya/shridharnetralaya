import { formatDisplayDate, formatINR } from './dates';
import type { ClinicSettings, DischargeSummary, Invoice, Patient } from '../types/database';

export function normalizeIndianPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length >= 10) {
    return `91${digits.slice(-10)}`;
  }
  return digits;
}

export function buildShareLink(token: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/share/${token}`;
}

export function openWhatsApp(phone: string, text: string) {
  const intl = normalizeIndianPhone(phone);
  if (intl.length < 12) return;
  const url = `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function shareInvoiceOnWhatsApp(
  patient: Pick<Patient, 'full_name' | 'patient_code' | 'phone'>,
  invoice: Invoice,
  clinic: ClinicSettings,
) {
  const link = buildShareLink(invoice.share_token);
  const msg = [
    `*${clinic.clinic_name}, Magadi*`,
    `Receipt / Invoice: *${invoice.invoice_no}*`,
    `Patient: ${patient.full_name}`,
    `MRD No.: *${patient.patient_code}*`,
    `Amount Paid: *${formatINR(invoice.total)}* (${invoice.payment_mode})`,
    `Date: ${formatDisplayDate(invoice.created_at)}`,
    ``,
    `View / Download Receipt (unlock with last 4 digits of registered phone):`,
    link,
    ``,
    `ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ | ಸಹಾಯವಾಣಿ: ${clinic.phone}`,
  ].join('\n');
  openWhatsApp(patient.phone, msg);
}

export function shareDischargeSummaryOnWhatsApp(
  patient: Pick<Patient, 'full_name' | 'patient_code' | 'phone'>,
  summary: DischargeSummary,
  clinic: ClinicSettings,
) {
  const link = buildShareLink(summary.share_token);
  const msg = [
    `*${clinic.clinic_name}, Magadi*`,
    `*DISCHARGE SUMMARY (${summary.summary_no})*`,
    `Patient: ${patient.full_name}`,
    `MRD No.: *${patient.patient_code}*${summary.ipd_no ? ` | IPD: ${summary.ipd_no}` : ''}`,
    `Operated Eye: *${summary.operated_eye}*`,
    `Procedure: ${summary.procedure_name}`,
    summary.follow_up_1 ? `Next Follow-Up: *${formatDisplayDate(summary.follow_up_1)}*` : '',
    ``,
    `View Eye Drops, Care Rules & PDF (unlock with last 4 digits of registered phone):`,
    link,
    ``,
    `24/7 Emergency Helpline / ತುರ್ತು ಸಂಪರ್ಕ: ${clinic.emergency_phone || clinic.phone}`,
  ]
    .filter(Boolean)
    .join('\n');
  openWhatsApp(patient.phone, msg);
}

export function shareDocumentLinkOnWhatsApp(
  patient: Pick<Patient, 'full_name' | 'patient_code' | 'phone'>,
  docType: string,
  visitDate: string,
  signedUrl: string,
  clinic: ClinicSettings,
) {
  const msg = [
    `*${clinic.clinic_name}, Magadi*`,
    `Document: *${docType}* (${formatDisplayDate(visitDate)})`,
    `Patient: ${patient.full_name} (MRD: ${patient.patient_code})`,
    ``,
    `View Record (valid for 7 days):`,
    signedUrl,
    ``,
    `Helpline: ${clinic.phone}`,
  ].join('\n');
  openWhatsApp(patient.phone, msg);
}

export function sendFollowUpReminderWhatsApp(patient: Patient, clinic: ClinicSettings) {
  const dateStr = formatDisplayDate(patient.next_follow_up);
  const msg = [
    `Namaste ${patient.full_name},`,
    `Reminder from *${clinic.clinic_name}, Magadi* for your eye follow-up scheduled on *${dateStr}* (MRD: ${patient.patient_code}).`,
    `Please bring your eye drops and previous prescription/discharge summary.`,
    ``,
    `ನಮಸ್ಕಾರ, ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ (ಮಾಗಡಿ) ದಿಂದ ನಿಮ್ಮ ಕಣ್ಣಿನ ಮರು ತಪಾಸಣೆ (${dateStr}) ನೆನಪಿಸುತ್ತಿದ್ದೇವೆ. ದಯವಿಟ್ಟು ಕಣ್ಣಿನ ಡ್ರಾಪ್ಸ್ ಮತ್ತು ಹಳೆಯ ಚೀಟಿಯನ್ನು ತರಲು ಮರೆಯಬೇಡಿ.`,
    `Phone: ${clinic.phone}`,
  ].join('\n');
  openWhatsApp(patient.phone, msg);
}
