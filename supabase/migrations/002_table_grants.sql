-- ============================================================================
-- Shridhar Netralaya — Table privileges for Supabase API roles
-- Run once in Supabase SQL Editor if you see:
--   "permission denied for table patients" (or invoices, etc.)
-- RLS policies still enforce staff/admin rules; this only grants base access.
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