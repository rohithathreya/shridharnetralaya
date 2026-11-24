-- ============================================================================
-- Shridhar Netralaya — MRD No., IRDAI/TPA Fields & 4-Digit Share Verification
-- Run once in Supabase SQL Editor BEFORE deploying the v2 frontend.
-- ============================================================================

-- 1. Hospital ROHINI ID (required by Indian TPAs for cashless & reimbursement)
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS rohini_id TEXT NOT NULL DEFAULT '';

-- 2. Editable MRD No. (stored in patients.patient_code, UNIQUE) + phone cleanup
CREATE OR REPLACE FUNCTION public.assign_patient_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.patient_code IS NULL OR trim(NEW.patient_code) = '' THEN
    NEW.patient_code := 'MRD-' || to_char(NOW(), 'YY') || '-' || lpad(nextval('public.patient_code_seq')::text, 4, '0');
  ELSE
    NEW.patient_code := upper(trim(NEW.patient_code));
  END IF;

  NEW.phone := regexp_replace(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g');
  IF length(NEW.phone) > 10 THEN
    NEW.phone := right(NEW.phone, 10);
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 3. NABH / IRDAI clinical & claim fields on discharge_summaries
CREATE SEQUENCE IF NOT EXISTS public.ipd_no_seq START 1;

ALTER TABLE public.discharge_summaries
  ADD COLUMN IF NOT EXISTS ipd_no TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS icd10_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS chief_complaints TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tpa_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS claim_no TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS attendant_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS no_iol_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.assign_summary_no_and_sync_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.summary_no IS NULL OR trim(NEW.summary_no) = '' THEN
    NEW.summary_no := 'DS-' || to_char(NOW(), 'YY') || '-' || lpad(nextval('public.summary_no_seq')::text, 4, '0');
  END IF;
  IF NEW.ipd_no IS NULL OR trim(NEW.ipd_no) = '' THEN
    NEW.ipd_no := 'IPD-' || to_char(NOW(), 'YY') || '-' || lpad(nextval('public.ipd_no_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. TPA / IPD claim links on invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS ipd_no TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tpa_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS policy_no TEXT NOT NULL DEFAULT '';

-- 5. Replace open share RPC with 4-digit registered mobile verification
DROP FUNCTION IF EXISTS public.get_shared_document(TEXT);

CREATE OR REPLACE FUNCTION public.get_shared_document_meta(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_name TEXT;
  v_doc_type TEXT;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 20 THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  SELECT clinic_name INTO v_clinic_name FROM public.clinic_settings WHERE id = 1;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE share_token = trim(p_token)) THEN
    v_doc_type := 'invoice';
  ELSIF EXISTS (SELECT 1 FROM public.discharge_summaries WHERE share_token = trim(p_token)) THEN
    v_doc_type := 'discharge_summary';
  ELSE
    RETURN jsonb_build_object('exists', false);
  END IF;

  RETURN jsonb_build_object(
    'exists', true,
    'type', v_doc_type,
    'clinic_name', COALESCE(v_clinic_name, 'Shridhar Netralaya')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_document(p_token TEXT, p_phone_last4 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic JSONB;
  v_inv RECORD;
  v_ds RECORD;
  v_pat RECORD;
  v_clean_last4 TEXT;
BEGIN
  v_clean_last4 := regexp_replace(COALESCE(p_phone_last4, ''), '[^0-9]', '', 'g');
  IF p_token IS NULL OR length(trim(p_token)) < 20 OR length(v_clean_last4) <> 4 THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(c) INTO v_clinic FROM public.clinic_settings c WHERE id = 1;

  SELECT * INTO v_inv FROM public.invoices WHERE share_token = trim(p_token) LIMIT 1;
  IF FOUND THEN
    SELECT id, patient_code, full_name, age, sex, village_address, phone
    INTO v_pat FROM public.patients WHERE id = v_inv.patient_id;

    IF right(regexp_replace(COALESCE(v_pat.phone, ''), '[^0-9]', '', 'g'), 4) <> v_clean_last4 THEN
      RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
      'type', 'invoice',
      'clinic', v_clinic,
      'patient', jsonb_build_object(
        'patient_code', v_pat.patient_code,
        'full_name', v_pat.full_name,
        'age', v_pat.age,
        'sex', v_pat.sex,
        'village_address', v_pat.village_address
      ),
      'document', to_jsonb(v_inv)
    );
  END IF;

  SELECT * INTO v_ds FROM public.discharge_summaries WHERE share_token = trim(p_token) LIMIT 1;
  IF FOUND THEN
    SELECT id, patient_code, full_name, age, sex, village_address, phone
    INTO v_pat FROM public.patients WHERE id = v_ds.patient_id;

    IF right(regexp_replace(COALESCE(v_pat.phone, ''), '[^0-9]', '', 'g'), 4) <> v_clean_last4 THEN
      RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
      'type', 'discharge_summary',
      'clinic', v_clinic,
      'patient', jsonb_build_object(
        'patient_code', v_pat.patient_code,
        'full_name', v_pat.full_name,
        'age', v_pat.age,
        'sex', v_pat.sex,
        'village_address', v_pat.village_address
      ),
      'document', to_jsonb(v_ds)
    );
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_document_meta(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_document(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_document_meta(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_document(TEXT, TEXT) TO anon, authenticated;
