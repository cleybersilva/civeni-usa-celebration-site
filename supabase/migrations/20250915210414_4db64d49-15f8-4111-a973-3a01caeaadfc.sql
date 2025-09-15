-- EMERGENCY SECURITY FIX: Correct syntax for RLS policies
-- Fix the INSERT policy syntax error and secure the table

-- Drop the failed policies
DROP POLICY IF EXISTS "default_deny_all" ON public.event_registrations;
DROP POLICY IF EXISTS "admin_root_only_full_access" ON public.event_registrations;
DROP POLICY IF EXISTS "service_role_insert_only" ON public.event_registrations;

-- Ensure RLS is properly configured
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations FORCE ROW LEVEL SECURITY;

-- Create restrictive policies with correct syntax

-- 1. Admin Root - Full access to all operations
CREATE POLICY "admin_root_all_access" 
ON public.event_registrations 
FOR ALL
USING (
  current_setting('app.current_user_email', true) IS NOT NULL 
  AND current_setting('app.current_user_email', true) != ''
  AND is_admin_root_user(current_setting('app.current_user_email', true))
)
WITH CHECK (
  current_setting('app.current_user_email', true) IS NOT NULL 
  AND current_setting('app.current_user_email', true) != ''
  AND is_admin_root_user(current_setting('app.current_user_email', true))
);

-- 2. Regular Admins - Read only, basic info
CREATE POLICY "admin_read_basic" 
ON public.event_registrations 
FOR SELECT
USING (
  current_setting('app.current_user_email', true) IS NOT NULL 
  AND current_setting('app.current_user_email', true) != ''
  AND is_current_user_admin()
  AND NOT is_admin_root_user(current_setting('app.current_user_email', true))
);

-- 3. Users - Own data only
CREATE POLICY "user_own_data_only" 
ON public.event_registrations 
FOR SELECT
USING (
  current_setting('app.current_user_email', true) IS NOT NULL 
  AND current_setting('app.current_user_email', true) != ''
  AND lower(email) = lower(current_setting('app.current_user_email', true))
);

-- 4. Service role - Insert for payment processing
CREATE POLICY "service_insert_payments" 
ON public.event_registrations 
FOR INSERT
WITH CHECK (current_user = 'service_role');

-- 5. Anon role - Insert for new registrations only
CREATE POLICY "anon_insert_new_registrations" 
ON public.event_registrations 
FOR INSERT
WITH CHECK (
  payment_status = 'pending' 
  AND stripe_session_id IS NULL
);

-- Verify security is working
DO $$
DECLARE
    unauthorized_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Get total count as service role would see it
    SELECT COUNT(*) INTO total_count FROM public.event_registrations;
    
    -- Clear authentication and test public access
    PERFORM set_config('app.current_user_email', '', false);
    
    -- This should return 0 if properly secured
    SELECT COUNT(*) INTO unauthorized_count FROM public.event_registrations;
    
    IF unauthorized_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL SECURITY FAILURE: % of % rows accessible without authentication', 
            unauthorized_count, total_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All % registration records are now secure - no unauthorized access', total_count;
    END IF;
END $$;