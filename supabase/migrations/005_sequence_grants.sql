-- Run this in the Supabase SQL Editor if saving a discharge summary
-- fails with: permission denied for sequence ipd_no_seq
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
