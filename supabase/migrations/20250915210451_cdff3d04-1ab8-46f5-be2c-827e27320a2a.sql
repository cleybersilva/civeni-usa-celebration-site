-- NUCLEAR OPTION: Complete table security lockdown
-- Previous RLS policies are being bypassed - implementing emergency measures

-- First check what policies currently exist
DO $$
DECLARE
    policy_info RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT POLICIES ON event_registrations ===';
    FOR policy_info IN 
        SELECT policyname, cmd, permissive, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'event_registrations'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Permissive: % | Using: % | Check: %',
            policy_info.policyname, policy_info.cmd, policy_info.permissive, 
            COALESCE(policy_info.qual, 'NULL'), COALESCE(policy_info.with_check, 'NULL');
    END LOOP;
END $$;

-- Drop EVERY policy that could exist
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'event_registrations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_registrations', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Disable and re-enable RLS to reset everything
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations FORCE ROW LEVEL SECURITY;

-- Create single, ultra-restrictive policy that denies everything by default
CREATE POLICY "emergency_total_lockdown" 
ON public.event_registrations 
AS RESTRICTIVE
FOR ALL
USING (false)
WITH CHECK (false);

-- Only allow admin root with explicit function call
CREATE POLICY "admin_root_emergency_access" 
ON public.event_registrations 
FOR ALL
USING (
  current_setting('app.current_user_email', true) = 'cleyber.silva@live.com'
  AND is_admin_root_user(current_setting('app.current_user_email', true))
)
WITH CHECK (
  current_setting('app.current_user_email', true) = 'cleyber.silva@live.com'
  AND is_admin_root_user(current_setting('app.current_user_email', true))
);

-- Test the emergency lockdown
DO $$
DECLARE
    test_rows INTEGER;
BEGIN
    -- Clear ALL context variables
    PERFORM set_config('app.current_user_email', '', false);
    
    -- This MUST return 0 or we have a critical security system failure
    SELECT COUNT(*) INTO test_rows FROM public.event_registrations;
    
    RAISE NOTICE 'Emergency lockdown test: % rows visible (should be 0)', test_rows;
    
    IF test_rows > 0 THEN
        -- Log this as a system-level security failure
        INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message)
        VALUES (
            'critical_security_breach',
            'email', 
            'cleyber.silva@live.com',
            format('CRITICAL: RLS bypass detected - %s rows accessible without auth on event_registrations', test_rows)
        );
        
        RAISE EXCEPTION 'SYSTEM SECURITY FAILURE: RLS policies are being bypassed - % rows still visible', test_rows;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Emergency security lockdown active - table fully secured';
END $$;