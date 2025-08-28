-- Harden RLS on event_registrations and allow only admins or the authenticated owner (by email)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Ensure no overly permissive SELECT policies exist (noop if missing)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='event_registrations' AND policyname='public read'
  ) THEN
    DROP POLICY "public read" ON public.event_registrations;
  END IF;
END $$;

-- Policy: authenticated users can read their own rows (match JWT email to email column)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='event_registrations' AND policyname='Users can view their own registration'
  ) THEN
    CREATE POLICY "Users can view their own registration"
    ON public.event_registrations
    FOR SELECT
    TO authenticated
    USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email')::text, '')));
  END IF;
END $$;

-- Keep existing admin policies intact. Explicitly add if missing (idempotent add)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_registrations' AND policyname='event_registrations_admin_read_only'
  ) THEN
    CREATE POLICY event_registrations_admin_read_only
    ON public.event_registrations
    FOR SELECT
    USING ((NOT is_admin_root_user(current_setting('app.current_user_email'::text, true))) AND is_current_user_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_registrations' AND policyname='event_registrations_admin_root_full_access'
  ) THEN
    CREATE POLICY event_registrations_admin_root_full_access
    ON public.event_registrations
    FOR ALL
    USING (is_admin_root_user(current_setting('app.current_user_email'::text, true)))
    WITH CHECK (is_admin_root_user(current_setting('app.current_user_email'::text, true)));
  END IF;
END $$;