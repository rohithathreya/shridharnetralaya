import { formatDisplayDate, formatINR } from './dates';
import type { ClinicSettings, DischargeSummary, Invoice, Patient } from '../types/database';

export function normalizeIndianPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export function buildShareLink(token: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/share/${token}`;
}

export function openWhatsApp(phone: string, text: string) {
  const intl = normalizeIndianPhone(phone);
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
    `Patient: ${patient.full_name} (${patient.patient_code})`,
    `Amount Paid: *${formatINR(invoice.total)}* (${invoice.payment_mode})`,
    `Date: ${formatDisplayDate(invoice.created_at)}`,
    ``,
    `View / Download Receipt:`,
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
    `Patient: ${patient.full_name} (${patient.patient_code})`,
    `Operated Eye: *${summary.operated_eye}*`,
    `Procedure: ${summary.procedure_name}`,
    summary.follow_up_1 ? `Next Follow-Up: *${formatDisplayDate(summary.follow_up_1)}*` : '',
    ``,
    `View Eye Drops, Care Rules & PDF:`,
    link,
    ``,
    `ತುರ್ತು ಸಂಪರ್ಕ / 24x7 Emergency: ${clinic.emergency_phone || clinic.phone}`,
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
    `Patient: ${patient.full_name} (${patient.patient_code})`,
    ``,
    `View Prescription / Record (valid for 7 days):`,
    signedUrl,
    ``,
    `Helpline: ${clinic.phone}`,
  ].join('\n');
  openWhatsApp(patient.phone, msg);
}

export function sendFollowUpReminderWhatsApp(patient: Patient, clinic: ClinicSettings) {
  const msg = [
    `Namaste ${patient.full_name},`,
    `This is a gentle reminder from *${clinic.clinic_name}, Magadi* for your eye check-up follow-up scheduled on *${formatDisplayDate(patient.next_follow_up)}*.`,
    `Please bring your eye drops and previous prescription/discharge summary.`,
    ``,
    `ನಮಸ್ಕಾರ, ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ (ಮಾಗಡಿ) ದಿಂದ ಕಣ್ಣಿನ ತಪಾಸಣೆಗೆ (${formatDisplayDate(patient.next_follow_up)}) ಬರಲು ನೆನಪಿಸುತ್ತಿದ್ದೇವೆ. ದಯವಿಟ್ಟು ಕಣ್ಣಿನ ಡ್ರಾಪ್ಸ್ ಮತ್ತು ಹಳೆಯ ಚೀಟಿಯನ್ನು ತರಲು ಮರೆಯಬೇಡಿ.`,
    `Phone: ${clinic.phone}`,
  ].join('\n');
  openWhatsApp(patient.phone, msg);
}
