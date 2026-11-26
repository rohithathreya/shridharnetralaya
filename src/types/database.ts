export type ClinicRole = 'staff' | 'admin' | null;

export interface ClinicSettings {
  id: number;
  clinic_name: string;
  tagline: string;
  doctor_name: string;
  doctor_qualification: string;
  doctor_kmc_no: string;
  kpme_reg_no: string;
  rohini_id: string;
  address: string;
  phone: string;
  emergency_phone: string;
  timings: string;
  default_head_bath_days: number;
  google_maps_url: string;
}

export type ServiceCategory =
  | 'Consultation'
  | 'Diagnostic'
  | 'Procedure'
  | 'Surgery'
  | 'Optical'
  | 'Other';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: ServiceCategory;
  default_price: number;
  is_active: boolean;
  sort_order: number;
}

export interface EyeDropItem {
  name: string;
  eye: string;
  schedule: string;
  duration: string;
}

export interface OralMedItem {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
}

export interface SurgicalProtocol {
  id: string;
  name: string;
  short_label: string;
  procedure_name: string;
  default_diagnosis: string;
  default_anesthesia: string;
  default_dressing: string;
  default_intra_op_notes: string;
  default_in_clinic_meds: string;
  eye_drops: EyeDropItem[];
  oral_meds: OralMedItem[];
  follow_up_days: number[];
  head_bath_days: number;
  is_active: boolean;
  sort_order: number;
}

export interface Patient {
  id: string;
  patient_code: string; // Permanent Hospital MRD No.
  full_name: string;
  age: number | null;
  sex: 'M' | 'F' | 'O' | null;
  phone: string;
  village_address: string;
  allergies: string;
  comorbidities: string[];
  next_follow_up: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  name: string;
  category: string;
  qty: number;
  unit_price: number;
  amount: number;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'TPA / Scheme';

export interface Invoice {
  id: string;
  invoice_no: string;
  ipd_no?: string;
  tpa_name?: string;
  policy_no?: string;
  patient_id: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_mode: PaymentMode;
  payment_ref: string;
  notes: string;
  status: 'active' | 'voided';
  void_reason: string | null;
  voided_at: string | null;
  share_token: string;
  created_by: string;
  created_at: string;
  patients?: Pick<Patient, 'patient_code' | 'full_name' | 'phone' | 'age' | 'sex' | 'village_address'>;
}

export type OperatedEye = 'RE (OD)' | 'LE (OS)' | 'BE (OU)';

export interface DischargeSummary {
  id: string;
  summary_no: string;
  ipd_no?: string;
  patient_id: string;
  case_type: 'Day Care' | 'In-Patient';
  admission_at: string;
  surgery_at: string;
  discharge_at: string;
  operated_eye: OperatedEye;
  chief_complaints?: string;
  diagnosis: string;
  icd10_code?: string;
  procedure_name: string;
  anesthesia: string;
  pre_op_va_re: string;
  pre_op_va_le: string;
  pre_op_iop_re: string;
  pre_op_iop_le: string;
  pre_op_bp: string;
  pre_op_rbs: string;
  comorbidities: string[];
  allergies: string;
  intra_op_notes: string;
  in_clinic_meds: string;
  iol_model: string;
  iol_power: string;
  iol_batch: string;
  no_iol_confirmed?: boolean;
  discharge_condition: string;
  dressing_status: string;
  eye_drops: EyeDropItem[];
  oral_meds: OralMedItem[];
  follow_up_1: string | null;
  follow_up_2: string | null;
  follow_up_3: string | null;
  head_bath_days: number;
  prepared_by: string;
  discharge_status: 'Routine' | 'DAMA' | 'Referred';
  billing_category: string;
  tpa_name?: string;
  policy_no: string;
  claim_no?: string;
  attendant_name?: string;
  ai_assisted: boolean;
  share_token: string;
  created_at: string;
}

export type DocumentType =
  | 'Medicine Rx'
  | 'Spectacle Rx'
  | 'Surgery / OT Slip'
  | 'Lab / Scan Report'
  | 'IOL Sticker'
  | 'Old File'
  | 'Other';

export interface PatientDocument {
  id: string;
  patient_id: string;
  doc_type: DocumentType;
  title: string;
  notes: string;
  storage_path: string;
  mime_type: string;
  file_size_kb: number;
  visit_date: string;
  created_at: string;
}

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  id: 1,
  clinic_name: 'Shridhar Netralaya',
  tagline: 'Comprehensive Eye Care & Microsurgery Centre',
  doctor_name: 'Dr. L. S. Malathesh',
  doctor_qualification: 'MBBS, DOMS, FGO',
  doctor_kmc_no: '26550',
  kpme_reg_no: '',
  rohini_id: '',
  address: 'Eye Hospital Road, Near Gramadevate Temple, Magadi, Karnataka 562120',
  phone: '7026046677',
  emergency_phone: '7026046677',
  timings: 'Mon – Sat: 10:00 AM – 5:00 PM · Sunday Holiday',
  default_head_bath_days: 14,
  google_maps_url: 'https://maps.google.com/?q=Shridhar+Netralaya+Magadi+Karnataka+562120',
};
