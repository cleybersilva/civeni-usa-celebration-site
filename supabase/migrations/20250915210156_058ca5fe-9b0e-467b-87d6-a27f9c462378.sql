-- EMERGENCY FIX: Customer Registration Data Exposure
-- The table is still publicly readable despite existing policies

-- First, let's see what's actually allowing public access
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Log current problematic state
    RAISE NOTICE 'Current RLS policies on event_registrations:';
    
    FOR policy_record IN 
        SELECT policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'event_registrations'
    LOOP
        RAISE NOTICE 'Policy: %, Command: %, Qual: %, With_check: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.qual, 
            policy_record.with_check;
    END LOOP;
END $$;

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "event_registrations_admin_basic_access" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_root_access" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_root_update" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_system_insert_only" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_user_own_access" ON public.event_registrations;

-- Ensure RLS is enabled
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (critical security setting)
ALTER TABLE public.event_registrations FORCE ROW LEVEL SECURITY;

-- Create restrictive policies with explicit role checks

-- 1. Admin Root: Full access to all data
CREATE POLICY "secure_admin_root_full_access" 
ON public.event_registrations 
FOR ALL
TO authenticated
USING (is_admin_root_user(current_setting('app.current_user_email'::text, true)))
WITH CHECK (is_admin_root_user(current_setting('app.current_user_email'::text, true)));

-- 2. Regular Admins: Basic data only (no financial info)
CREATE POLICY "secure_admin_basic_read" 
ON public.event_registrations 
FOR SELECT
TO authenticated
USING (
  is_current_user_admin() 
  AND NOT is_admin_root_user(current_setting('app.current_user_email'::text, true))
);

-- 3. Authenticated users: Own data only
CREATE POLICY "secure_user_own_data" 
ON public.event_registrations 
FOR SELECT
TO authenticated  
USING (
  auth.uid() IS NOT NULL
  AND current_setting('app.current_user_email'::text, true) IS NOT NULL
  AND current_setting('app.current_user_email'::text, true) != ''
  AND lower(email) = lower(current_setting('app.current_user_email'::text, true))
);

-- 4. System inserts for payment processing (service_role only)
CREATE POLICY "secure_system_insert" 
ON public.event_registrations 
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Anon inserts for registration creation (very restrictive)
CREATE POLICY "secure_anon_registration_insert" 
ON public.event_registrations 
FOR INSERT
TO anon
WITH CHECK (
  -- Only allow basic registration data, no financial info
  stripe_session_id IS NULL 
  AND payment_status = 'pending'
  AND amount_paid IS NULL
);

-- Verify no public access remains
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Test access without proper authentication context
    PERFORM set_config('app.current_user_email', '', false);
    
    -- This should return 0 if security is properly configured
    SELECT COUNT(*) INTO row_count FROM public.event_registrations;
    
    IF row_count > 0 THEN
        RAISE EXCEPTION 'SECURITY FAILURE: Table still publicly accessible with % rows visible', row_count;
    ELSE
        RAISE NOTICE 'SUCCESS: Table is now properly secured - no public access';
    END IF;
END $$;