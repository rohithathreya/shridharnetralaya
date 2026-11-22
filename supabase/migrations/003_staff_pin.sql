-- Staff access code. Runs in the database so the code is stored as a bcrypt hash.
DO $$
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);
  INSERT INTO public.clinic_access_codes (role, pin_hash, updated_at)
  VALUES ('staff', crypt('23120906', gen_salt('bf', 10)), NOW())
  ON CONFLICT (role) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash,
        updated_at = NOW();
END;
$$;
