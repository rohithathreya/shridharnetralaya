-- ============================================================================
-- Shridhar Netralaya (Magadi) — Production Schema, RLS, RPCs & Seed Data
-- Run this entire script once in Supabase SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: generate secure random hex token (works regardless of pgcrypto schema)
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  RETURN encode(gen_random_bytes(20), 'hex');
END;
$$;

-- Helper: extract authenticated clinic_role from Supabase JWT app_metadata
CREATE OR REPLACE FUNCTION public.current_clinic_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'clinic_role', '');
$$;

-- ============================================================================
-- 1. CLINIC SETTINGS (Public metadata + Admin editable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  clinic_name TEXT NOT NULL DEFAULT 'Shridhar Netralaya',
  tagline TEXT NOT NULL DEFAULT 'Comprehensive Eye Care & Microsurgery Centre',
  doctor_name TEXT NOT NULL DEFAULT 'Dr. L. S. Malathesh',
  doctor_qualification TEXT NOT NULL DEFAULT 'MBBS, DOMS, FGO',
  doctor_kmc_no TEXT NOT NULL DEFAULT '',
  kpme_reg_no TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT 'Eye Hospital Road, Near Gramadevate Temple, Magadi, Karnataka 562120',
  phone TEXT NOT NULL DEFAULT '7026046677',
  emergency_phone TEXT NOT NULL DEFAULT '7026046677',
  timings TEXT NOT NULL DEFAULT 'Mon - Sat: 9:30 AM - 2:00 PM & 4:30 PM - 7:30 PM | Sun: Emergency & Post-Op Only',
  default_head_bath_days INTEGER NOT NULL DEFAULT 14,
  google_maps_url TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=Shridhar+Netralaya+Magadi+Karnataka+562120',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.clinic_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ACCESS CODES (Strictly private — service_role / SECURITY DEFINER only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_access_codes (
  role TEXT PRIMARY KEY CHECK (role IN ('staff', 'admin')),
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial access codes: Staff = 2026, Admin = 9090 (Change immediately in Admin Settings!)
DO $$
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);
  IF NOT EXISTS (SELECT 1 FROM public.clinic_access_codes WHERE role = 'staff') THEN
    INSERT INTO public.clinic_access_codes (role, pin_hash)
    VALUES ('staff', crypt('2026', gen_salt('bf', 10)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clinic_access_codes WHERE role = 'admin') THEN
    INSERT INTO public.clinic_access_codes (role, pin_hash)
    VALUES ('admin', crypt('9090', gen_salt('bf', 10)));
  END IF;
END;
$$;

-- Verify PIN (service_role ONLY — called by pin-login Edge Function)
CREATE OR REPLACE FUNCTION public.verify_clinic_pin(p_pin TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
    RETURN NULL;
  END IF;

  -- Check admin first in case codes ever overlap
  SELECT role INTO v_role
  FROM public.clinic_access_codes
  WHERE role = 'admin' AND pin_hash = crypt(trim(p_pin), pin_hash)
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  SELECT role INTO v_role
  FROM public.clinic_access_codes
  WHERE role = 'staff' AND pin_hash = crypt(trim(p_pin), pin_hash)
  LIMIT 1;

  RETURN v_role;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_clinic_pin(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_clinic_pin(TEXT) TO service_role;

-- Admin-only RPC to rotate Staff or Admin PIN from the Admin Dashboard
CREATE OR REPLACE FUNCTION public.update_clinic_pin(p_target_role TEXT, p_new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF public.current_clinic_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can update access codes';
  END IF;

  IF p_target_role NOT IN ('staff', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF p_new_pin IS NULL OR length(trim(p_new_pin)) < 4 OR length(trim(p_new_pin)) > 12 THEN
    RAISE EXCEPTION 'PIN must be between 4 and 12 characters';
  END IF;

  INSERT INTO public.clinic_access_codes (role, pin_hash, updated_at)
  VALUES (p_target_role, crypt(trim(p_new_pin), gen_salt('bf', 10)), NOW())
  ON CONFLICT (role) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash,
        updated_at = NOW();

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.update_clinic_pin(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_clinic_pin(TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 3. SERVICE & PROCEDURE CATALOG (Top-down invoice presets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Consultation', 'Diagnostic', 'Procedure', 'Surgery', 'Optical', 'Other')),
  default_price INTEGER NOT NULL DEFAULT 0 CHECK (default_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed realistic Magadi Eye Hospital services (Admin can edit/add/disable anytime)
INSERT INTO public.service_catalog (name, category, default_price, sort_order)
SELECT * FROM (VALUES
  ('OPD Consultation (New)', 'Consultation', 300, 10),
  ('OPD Follow-Up Consultation', 'Consultation', 150, 20),
  ('Emergency / After-Hours Consultation', 'Consultation', 500, 30),
  ('Refraction & Spectacle Power Check', 'Consultation', 200, 40),
  ('A-Scan Biometry (IOL Power)', 'Diagnostic', 500, 50),
  ('Syringing & Probing (Sac Test)', 'Diagnostic', 300, 60),
  ('Applanation Tonometry (IOP)', 'Diagnostic', 150, 70),
  ('Automated Perimetry (Visual Field)', 'Diagnostic', 800, 80),
  ('Fundus Examination (Dilated)', 'Diagnostic', 250, 90),
  ('Corneal Foreign Body Removal', 'Procedure', 500, 100),
  ('Epilation / Lash Removal', 'Procedure', 300, 110),
  ('Chalazion Incision & Curettage', 'Procedure', 1500, 120),
  ('YAG Laser Capsulotomy', 'Procedure', 2500, 130),
  ('YAG Laser Peripheral Iridotomy (PI)', 'Procedure', 2500, 140),
  ('Intravitreal Anti-VEGF Injection', 'Procedure', 6000, 150),
  ('SICS with PMMA IOL (Day Care)', 'Surgery', 12000, 160),
  ('SICS with Foldable IOL (Day Care)', 'Surgery', 16000, 170),
  ('Phacoemulsification + Indian Foldable IOL', 'Surgery', 22000, 180),
  ('Phacoemulsification + Imported Hydrophobic IOL', 'Surgery', 35000, 190),
  ('Phacoemulsification + Toric / Multifocal IOL', 'Surgery', 55000, 200),
  ('Pterygium Excision + Conjunctival Autograft (CAG)', 'Surgery', 8500, 210),
  ('Trabeculectomy (Glaucoma Surgery)', 'Surgery', 18000, 220),
  ('DCR / DCT (Lacrimal Surgery)', 'Surgery', 15000, 230),
  ('Lid Surgery (Entropion / Ectropion / Ptosis)', 'Surgery', 10000, 240),
  ('Squint Correction Surgery', 'Surgery', 22000, 250),
  ('Post-Op Dark Glasses & Shield Kit', 'Other', 250, 260)
) AS v(name, category, default_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.service_catalog LIMIT 1);

-- ============================================================================
-- 4. SURGICAL PROTOCOLS (1-click discharge summary presets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.surgical_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_label TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  default_diagnosis TEXT NOT NULL DEFAULT '',
  default_anesthesia TEXT NOT NULL DEFAULT 'Topical',
  default_dressing TEXT NOT NULL DEFAULT 'Dark Glasses',
  default_intra_op_notes TEXT NOT NULL DEFAULT '',
  default_in_clinic_meds TEXT NOT NULL DEFAULT '',
  eye_drops JSONB NOT NULL DEFAULT '[]'::jsonb,
  oral_meds JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_days INTEGER[] NOT NULL DEFAULT '{1, 7, 30}',
  head_bath_days INTEGER NOT NULL DEFAULT 14,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 100
);

INSERT INTO public.surgical_protocols (
  name, short_label, procedure_name, default_diagnosis, default_anesthesia,
  default_dressing, default_intra_op_notes, default_in_clinic_meds,
  eye_drops, oral_meds, follow_up_days, head_bath_days, sort_order
)
SELECT * FROM (VALUES
  (
    'Phacoemulsification + Foldable IOL',
    'Phaco + Foldable IOL',
    'Phacoemulsification with Foldable PCIOL',
    'Senile Immature Cataract',
    'Topical',
    'Dark Glasses',
    'Uneventful clear corneal phacoemulsification. Foldable PCIOL well-centered in the capsular bag. Corneal wound hydrated and watertight. Post-op condition stable.',
    'Pre-op Tropicamide + Phenylephrine drops; Intracameral Moxifloxacin 0.5% administered.',
    '[
      {"name":"Moxifloxacin 0.5% Eye Drops","eye":"Operated Eye","schedule":"4 times/day (8am, 12pm, 4pm, 8pm)","duration":"14 Days"},
      {"name":"Prednisolone Acetate 1% Eye Drops (Shake well)","eye":"Operated Eye","schedule":"Wk1: 6x -> Wk2: 4x -> Wk3: 3x -> Wk4: 2x -> Wk5: 1x","duration":"5 Weeks (Taper)"},
      {"name":"Nepafenac 0.1% Eye Drops","eye":"Operated Eye","schedule":"3 times/day","duration":"4 Weeks"},
      {"name":"Carboxymethylcellulose 0.5% (Lubricant)","eye":"Operated Eye","schedule":"4 times/day","duration":"1 Month"}
    ]'::jsonb,
    '[
      {"name":"Tab. Ciprofloxacin 500 mg","dosage":"1 - 0 - 1","timing":"After Food","duration":"5 Days"},
      {"name":"Tab. Pantoprazole 40 mg","dosage":"1 - 0 - 0","timing":"Before Breakfast","duration":"5 Days"},
      {"name":"Tab. Aceclofenac + Paracetamol","dosage":"SOS (if pain)","timing":"After Food","duration":"3 Days"}
    ]'::jsonb,
    ARRAY[1, 7, 30],
    14,
    10
  ),
  (
    'SICS + PCIOL (Standard)',
    'SICS + PCIOL',
    'Small Incision Cataract Surgery (SICS) with PCIOL',
    'Senile Mature / Immature Cataract',
    'Peribulbar',
    'Pad & Bandage',
    'Uneventful SICS via superior scleral tunnel. PCIOL well-centered in the capsular bag. Self-sealing wound secure. Eye patched with sterile pad and bandage.',
    'Pre-op dilating drops; Subconjunctival / Intracameral antibiotic given.',
    '[
      {"name":"Moxifloxacin 0.5% Eye Drops (Start after pad removal)","eye":"Operated Eye","schedule":"4 times/day","duration":"14 Days"},
      {"name":"Prednisolone Acetate 1% Eye Drops (Shake well)","eye":"Operated Eye","schedule":"Wk1: 6x -> Wk2: 4x -> Wk3: 3x -> Wk4: 2x -> Wk5: 1x","duration":"5 Weeks (Taper)"},
      {"name":"Nepafenac 0.1% Eye Drops","eye":"Operated Eye","schedule":"3 times/day","duration":"4 Weeks"},
      {"name":"Carboxymethylcellulose 0.5% (Lubricant)","eye":"Operated Eye","schedule":"4 times/day","duration":"1 Month"}
    ]'::jsonb,
    '[
      {"name":"Tab. Ciprofloxacin 500 mg","dosage":"1 - 0 - 1","timing":"After Food","duration":"5 Days"},
      {"name":"Tab. Pantoprazole 40 mg","dosage":"1 - 0 - 0","timing":"Before Breakfast","duration":"5 Days"},
      {"name":"Tab. Aceclofenac + Paracetamol","dosage":"1 - 0 - 1","timing":"After Food","duration":"3 Days"}
    ]'::jsonb,
    ARRAY[1, 7, 30],
    21,
    20
  ),
  (
    'Pterygium Excision + CAG',
    'Pterygium + CAG',
    'Pterygium Excision with Conjunctival Autograft (CAG)',
    'Progressive Nasal Pterygium',
    'Peribulbar',
    'Pad & Bandage',
    'Pterygium head and body excised cleanly from cornea and sclera. Superior conjunctival autograft harvested and secured smoothly in place. Hemostasis achieved.',
    'Topical antibiotic ointment applied; sterile eye pad placed.',
    '[
      {"name":"Moxifloxacin 0.5% Eye Drops","eye":"Operated Eye","schedule":"4 times/day","duration":"14 Days"},
      {"name":"Loteprednol 0.5% / FML Eye Drops (Shake well)","eye":"Operated Eye","schedule":"Wk1: 4x -> Wk2: 3x -> Wk3: 2x -> Wk4: 1x","duration":"4 Weeks (Taper)"},
      {"name":"Lubricating Eye Gel / Drops (CMC 1%)","eye":"Operated Eye","schedule":"6 times/day","duration":"1 Month"}
    ]'::jsonb,
    '[
      {"name":"Tab. Aceclofenac + Paracetamol","dosage":"1 - 0 - 1","timing":"After Food","duration":"3 Days"},
      {"name":"Tab. Pantoprazole 40 mg","dosage":"1 - 0 - 0","timing":"Before Breakfast","duration":"3 Days"}
    ]'::jsonb,
    ARRAY[1, 7, 28],
    14,
    30
  ),
  (
    'Intravitreal Injection (Anti-VEGF)',
    'Intravitreal Inj.',
    'Intravitreal Anti-VEGF Injection',
    'Diabetic Macular Edema / Wet AMD / RVO',
    'Topical',
    'Clear Protective Shield',
    'Intravitreal injection administered under strict aseptic OT precautions via pars plana after Povidone-Iodine 5% wash. Optic disc perfusion and IOP confirmed normal.',
    'Topical Proparacaine 0.5%, Povidone-Iodine 5% prep, Moxifloxacin drop post-injection.',
    '[
      {"name":"Moxifloxacin 0.5% Eye Drops","eye":"Operated Eye","schedule":"4 times/day","duration":"5 Days"},
      {"name":"Carboxymethylcellulose 0.5% (Lubricant)","eye":"Operated Eye","schedule":"4 times/day","duration":"7 Days"}
    ]'::jsonb,
    '[]'::jsonb,
    ARRAY[1, 7, 30],
    3,
    40
  ),
  (
    'General / Other Eye Surgery',
    'Other Surgery',
    'Ophthalmic Microsurgery',
    '',
    'Local Infiltration',
    'Pad & Bandage',
    'Surgery completed uneventfully under aseptic precautions. Post-operative vitals stable.',
    'Standard aseptic prep and topical antibiotic prophylaxis.',
    '[
      {"name":"Moxifloxacin 0.5% Eye Drops","eye":"Operated Eye","schedule":"4 times/day","duration":"14 Days"}
    ]'::jsonb,
    '[
      {"name":"Tab. Aceclofenac + Paracetamol","dosage":"SOS (if pain)","timing":"After Food","duration":"3 Days"}
    ]'::jsonb,
    ARRAY[1, 7, 30],
    14,
    50
  )
) AS v(
  name, short_label, procedure_name, default_diagnosis, default_anesthesia,
  default_dressing, default_intra_op_notes, default_in_clinic_meds,
  eye_drops, oral_meds, follow_up_days, head_bath_days, sort_order
)
WHERE NOT EXISTS (SELECT 1 FROM public.surgical_protocols LIMIT 1);

-- ============================================================================
-- 5. PATIENTS (Phone is NON-UNIQUE so family members can share one mobile no.)
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.patient_code_seq START 1;

CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER CHECK (age IS NULL OR (age >= 0 AND age <= 125)),
  sex TEXT CHECK (sex IN ('M', 'F', 'O')),
  phone TEXT NOT NULL,
  village_address TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT 'NKDA',
  comorbidities TEXT[] NOT NULL DEFAULT '{}',
  next_follow_up DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients USING gin (to_tsvector('simple', full_name));
CREATE INDEX IF NOT EXISTS idx_patients_follow_up ON public.patients (next_follow_up) WHERE next_follow_up IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_patient_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.patient_code IS NULL OR trim(NEW.patient_code) = '' THEN
    NEW.patient_code := 'SN-' || to_char(NOW(), 'YY') || '-' || lpad(nextval('public.patient_code_seq')::text, 4, '0');
  END IF;
  NEW.phone := regexp_replace(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g');
  IF length(NEW.phone) > 10 AND left(NEW.phone, 2) = '91' THEN
    NEW.phone := right(NEW.phone, 10);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_patients_code ON public.patients;
CREATE TRIGGER trg_patients_code
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.assign_patient_code();

-- ============================================================================
-- 6. INVOICES (Sequential, non-deletable by staff, Admin can void with reason)
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.invoice_no_seq START 1;

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'TPA / Scheme')),
  payment_ref TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  share_token TEXT UNIQUE NOT NULL DEFAULT public.generate_share_token(),
  created_by TEXT NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices (share_token);

CREATE OR REPLACE FUNCTION public.assign_invoice_no()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_no IS NULL OR trim(NEW.invoice_no) = '' THEN
    NEW.invoice_no := 'INV-' || to_char(NOW(), 'YY') || '-' || lpad(nextval('public.invoice_no_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoices_no ON public.invoices;
CREATE TRIGGER trg_invoices_no
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.assign_invoice_no();

-- Admin-only RPC to void an invoice cleanly
CREATE OR REPLACE FUNCTION public.void_invoice(p_invoice_id UUID, p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_clinic_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can void invoices';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Please provide a reason for voiding';
  END IF;

  UPDATE public.invoices
  SET status = 'voided',
      void_reason = trim(p_reason),
      voided_at = NOW()
  WHERE id = p_invoice_id AND status = 'active';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.void_invoice(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.void_invoice(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 7. DISCHARGE SUMMARIES (1-page bilingual clinical record)
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.summary_no_seq START 1;

CREATE TABLE IF NOT EXISTS public.discharge_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_no TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_type TEXT NOT NULL DEFAULT 'Day Care' CHECK (case_type IN ('Day Care', 'In-Patient')),
  admission_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  surgery_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operated_eye TEXT NOT NULL CHECK (operated_eye IN ('RE (OD)', 'LE (OS)', 'BE (OU)')),
  diagnosis TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  anesthesia TEXT NOT NULL DEFAULT 'Topical',
  pre_op_va_re TEXT NOT NULL DEFAULT '',
  pre_op_va_le TEXT NOT NULL DEFAULT '',
  pre_op_iop_re TEXT NOT NULL DEFAULT '',
  pre_op_iop_le TEXT NOT NULL DEFAULT '',
  pre_op_bp TEXT NOT NULL DEFAULT '',
  pre_op_rbs TEXT NOT NULL DEFAULT '',
  comorbidities TEXT[] NOT NULL DEFAULT '{}',
  allergies TEXT NOT NULL DEFAULT 'NKDA',
  intra_op_notes TEXT NOT NULL DEFAULT '',
  in_clinic_meds TEXT NOT NULL DEFAULT '',
  iol_model TEXT NOT NULL DEFAULT '',
  iol_power TEXT NOT NULL DEFAULT '',
  iol_batch TEXT NOT NULL DEFAULT '',
  discharge_condition TEXT NOT NULL DEFAULT 'Stable & Comfortable',
  dressing_status TEXT NOT NULL DEFAULT 'Dark Glasses',
  eye_drops JSONB NOT NULL DEFAULT '[]'::jsonb,
  oral_meds JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_1 DATE,
  follow_up_2 DATE,
  follow_up_3 DATE,
  head_bath_days INTEGER NOT NULL DEFAULT 14,
  prepared_by TEXT NOT NULL DEFAULT 'Clinic Assistant',
  discharge_status TEXT NOT NULL DEFAULT 'Routine' CHECK (discharge_status IN ('Routine', 'DAMA', 'Referred')),
  billing_category TEXT NOT NULL DEFAULT 'Cash',
  policy_no TEXT NOT NULL DEFAULT '',
  ai_assisted BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT UNIQUE NOT NULL DEFAULT public.generate_share_token(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ds_patient ON public.discharge_summaries (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ds_share_token ON public.discharge_summaries (share_token);

CREATE OR REPLACE FUNCTION public.assign_summary_no_and_sync_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.summary_no IS NULL OR trim(NEW.summary_no) = '' THEN
    NEW.summary_no := 'DS-' || to_char(NOW(), 'YY') || '-' || lpad(nextval('public.summary_no_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ds_no ON public.discharge_summaries;
CREATE TRIGGER trg_ds_no
  BEFORE INSERT ON public.discharge_summaries
  FOR EACH ROW EXECUTE FUNCTION public.assign_summary_no_and_sync_patient();

CREATE OR REPLACE FUNCTION public.sync_patient_followup_after_ds()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.follow_up_1 IS NOT NULL THEN
    UPDATE public.patients
    SET next_follow_up = NEW.follow_up_1,
        allergies = COALESCE(NULLIF(trim(NEW.allergies), ''), allergies),
        comorbidities = CASE WHEN array_length(NEW.comorbidities, 1) > 0 THEN NEW.comorbidities ELSE comorbidities END,
        updated_at = NOW()
    WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ds_sync_followup ON public.discharge_summaries;
CREATE TRIGGER trg_ds_sync_followup
  AFTER INSERT ON public.discharge_summaries
  FOR EACH ROW EXECUTE FUNCTION public.sync_patient_followup_after_ds();

-- ============================================================================
-- 8. UPLOADED HANDWRITTEN PRESCRIPTIONS & DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('Medicine Rx', 'Spectacle Rx', 'Surgery / OT Slip', 'Lab / Scan Report', 'IOL Sticker', 'Old File', 'Other')),
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  file_size_kb INTEGER NOT NULL DEFAULT 0,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_patient ON public.patient_documents (patient_id, visit_date DESC, created_at DESC);

-- ============================================================================
-- 9. SECURE TOKENIZED PATIENT SHARE RPC (No direct table exposure, Zero IDOR)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_shared_document(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic JSONB;
  v_inv RECORD;
  v_ds RECORD;
  v_pat JSONB;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 20 THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(c) INTO v_clinic FROM public.clinic_settings c WHERE id = 1;

  -- Check Invoices
  SELECT * INTO v_inv FROM public.invoices WHERE share_token = trim(p_token) LIMIT 1;
  IF FOUND THEN
    SELECT jsonb_build_object(
      'patient_code', p.patient_code,
      'full_name', p.full_name,
      'age', p.age,
      'sex', p.sex,
      'village_address', p.village_address
    ) INTO v_pat FROM public.patients p WHERE p.id = v_inv.patient_id;

    RETURN jsonb_build_object(
      'type', 'invoice',
      'clinic', v_clinic,
      'patient', v_pat,
      'document', to_jsonb(v_inv)
    );
  END IF;

  -- Check Discharge Summaries
  SELECT * INTO v_ds FROM public.discharge_summaries WHERE share_token = trim(p_token) LIMIT 1;
  IF FOUND THEN
    SELECT jsonb_build_object(
      'patient_code', p.patient_code,
      'full_name', p.full_name,
      'age', p.age,
      'sex', p.sex,
      'village_address', p.village_address
    ) INTO v_pat FROM public.patients p WHERE p.id = v_ds.patient_id;

    RETURN jsonb_build_object(
      'type', 'discharge_summary',
      'clinic', v_clinic,
      'patient', v_pat,
      'document', to_jsonb(v_ds)
    );
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_document(TEXT) TO anon, authenticated;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgical_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- clinic_settings: Public read, Admin write
DROP POLICY IF EXISTS "Public read clinic_settings" ON public.clinic_settings;
CREATE POLICY "Public read clinic_settings" ON public.clinic_settings
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admin update clinic_settings" ON public.clinic_settings;
CREATE POLICY "Admin update clinic_settings" ON public.clinic_settings
  FOR UPDATE TO authenticated
  USING (public.current_clinic_role() = 'admin')
  WITH CHECK (public.current_clinic_role() = 'admin');

-- clinic_access_codes: NO policies for anon/authenticated (service_role only!)

-- service_catalog: Staff & Admin read, Admin full write
DROP POLICY IF EXISTS "Staff read service_catalog" ON public.service_catalog;
CREATE POLICY "Staff read service_catalog" ON public.service_catalog
  FOR SELECT TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin manage service_catalog" ON public.service_catalog;
CREATE POLICY "Admin manage service_catalog" ON public.service_catalog
  FOR ALL TO authenticated
  USING (public.current_clinic_role() = 'admin')
  WITH CHECK (public.current_clinic_role() = 'admin');

-- surgical_protocols: Staff & Admin read, Admin full write
DROP POLICY IF EXISTS "Staff read surgical_protocols" ON public.surgical_protocols;
CREATE POLICY "Staff read surgical_protocols" ON public.surgical_protocols
  FOR SELECT TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin manage surgical_protocols" ON public.surgical_protocols;
CREATE POLICY "Admin manage surgical_protocols" ON public.surgical_protocols
  FOR ALL TO authenticated
  USING (public.current_clinic_role() = 'admin')
  WITH CHECK (public.current_clinic_role() = 'admin');

-- patients: Staff & Admin select/insert/update, Admin delete
DROP POLICY IF EXISTS "Staff manage patients" ON public.patients;
CREATE POLICY "Staff manage patients" ON public.patients
  FOR SELECT TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff insert patients" ON public.patients;
CREATE POLICY "Staff insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff update patients" ON public.patients;
CREATE POLICY "Staff update patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin delete patients" ON public.patients;
CREATE POLICY "Admin delete patients" ON public.patients
  FOR DELETE TO authenticated
  USING (public.current_clinic_role() = 'admin');

-- invoices: Staff & Admin select/insert; NEVER delete; Admin updates via void_invoice
DROP POLICY IF EXISTS "Staff read invoices" ON public.invoices;
CREATE POLICY "Staff read invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff insert invoices" ON public.invoices;
CREATE POLICY "Staff insert invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin update invoices" ON public.invoices;
CREATE POLICY "Admin update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.current_clinic_role() = 'admin')
  WITH CHECK (public.current_clinic_role() = 'admin');

-- discharge_summaries: Staff & Admin select/insert/update, Admin delete
DROP POLICY IF EXISTS "Staff read discharge_summaries" ON public.discharge_summaries;
CREATE POLICY "Staff read discharge_summaries" ON public.discharge_summaries
  FOR SELECT TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff insert discharge_summaries" ON public.discharge_summaries;
CREATE POLICY "Staff insert discharge_summaries" ON public.discharge_summaries
  FOR INSERT TO authenticated
  WITH CHECK (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff update discharge_summaries" ON public.discharge_summaries;
CREATE POLICY "Staff update discharge_summaries" ON public.discharge_summaries
  FOR UPDATE TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin delete discharge_summaries" ON public.discharge_summaries;
CREATE POLICY "Admin delete discharge_summaries" ON public.discharge_summaries
  FOR DELETE TO authenticated
  USING (public.current_clinic_role() = 'admin');

-- patient_documents: Staff & Admin select/insert, Admin delete
DROP POLICY IF EXISTS "Staff read patient_documents" ON public.patient_documents;
CREATE POLICY "Staff read patient_documents" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff insert patient_documents" ON public.patient_documents;
CREATE POLICY "Staff insert patient_documents" ON public.patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin delete patient_documents" ON public.patient_documents;
CREATE POLICY "Admin delete patient_documents" ON public.patient_documents
  FOR DELETE TO authenticated
  USING (public.current_clinic_role() = 'admin');

-- ============================================================================
-- 11. PRIVATE STORAGE BUCKET FOR HANDWRITTEN PRESCRIPTIONS & SCANS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-docs',
  'patient-docs',
  FALSE,
  5242880, -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Staff read patient-docs" ON storage.objects;
CREATE POLICY "Staff read patient-docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-docs' AND public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff upload patient-docs" ON storage.objects;
CREATE POLICY "Staff upload patient-docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-docs' AND public.current_clinic_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin delete patient-docs" ON storage.objects;
CREATE POLICY "Admin delete patient-docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-docs' AND public.current_clinic_role() = 'admin');

-- ============================================================================
-- 12. TABLE PRIVILEGES (required for Supabase authenticated role + RLS)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.clinic_settings TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discharge_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgical_protocols TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
