-- EMERGENCY SECURITY FIX: Complete lockdown of event_registrations
-- Previous policies still allowed public access - implementing maximum security

-- Drop ALL policies completely
DROP POLICY IF EXISTS "secure_admin_root_full_access" ON public.event_registrations;
DROP POLICY IF EXISTS "secure_admin_basic_read" ON public.event_registrations;  
DROP POLICY IF EXISTS "secure_user_own_data" ON public.event_registrations;
DROP POLICY IF EXISTS "secure_system_insert" ON public.event_registrations;
DROP POLICY IF EXISTS "secure_anon_registration_insert" ON public.event_registrations;

-- Enable maximum security
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations FORCE ROW LEVEL SECURITY;

-- Default DENY ALL policy - this ensures no access unless explicitly granted
CREATE POLICY "default_deny_all" 
ON public.event_registrations 
FOR ALL
USING (false)
WITH CHECK (false);

-- Only create minimal, explicit access policies

-- 1. Admin Root users - full access (most restrictive condition)
CREATE POLICY "admin_root_only_full_access" 
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

-- 2. System service role for payment processing ONLY
CREATE POLICY "service_role_insert_only" 
ON public.event_registrations 
FOR INSERT
USING (false)  -- No reads allowed
WITH CHECK (current_user = 'service_role');

-- Test the fix immediately
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Clear any authentication context
    PERFORM set_config('app.current_user_email', '', false);
    
    -- Test public access - should return 0
    SELECT COUNT(*) INTO test_count FROM public.event_registrations;
    
    IF test_count > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: % rows still visible to public', test_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Table secured - no public access to % total rows', (SELECT COUNT(*) FROM public.event_registrations);
END $$;

-- Log security fix
INSERT INTO public.security_audit_log (
  accessed_table,
  accessed_by, 
  access_type,
  access_details
) VALUES (
  'event_registrations',
  'system_security_fix',
  'emergency_lockdown',
  jsonb_build_object(
    'issue', 'public_data_exposure',
    'action', 'complete_access_lockdown',
    'timestamp', now(),
    'policies_applied', ARRAY['default_deny_all', 'admin_root_only_full_access', 'service_role_insert_only']
  )
);