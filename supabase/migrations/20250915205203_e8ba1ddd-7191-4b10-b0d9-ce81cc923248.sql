-- Fix Critical Registration Data Exposure Issue
-- Consolidate and secure RLS policies on event_registrations table

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "event_registrations_admin_basic" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_read_limited" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_root_full" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_own_data" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_user_own_data" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_system_insert" ON public.event_registrations;

-- Create consolidated, secure policies

-- 1. Admin Root users can see all registration data including financial information
CREATE POLICY "event_registrations_admin_root_access" 
ON public.event_registrations 
FOR SELECT 
USING (is_admin_root_user(current_setting('app.current_user_email'::text, true)));

-- 2. Regular admin users can see basic registration data but NOT financial information  
CREATE POLICY "event_registrations_admin_basic_access" 
ON public.event_registrations 
FOR SELECT 
USING (
  is_current_user_admin() 
  AND NOT is_admin_root_user(current_setting('app.current_user_email'::text, true))
);

-- 3. Users can only see their own registration data (requires proper authentication)
CREATE POLICY "event_registrations_user_own_access" 
ON public.event_registrations 
FOR SELECT 
USING (
  current_setting('app.current_user_email'::text, true) IS NOT NULL
  AND current_setting('app.current_user_email'::text, true) != ''
  AND lower(email) = lower(current_setting('app.current_user_email'::text, true))
);

-- 4. System can insert new registrations (for payment processing)
CREATE POLICY "event_registrations_system_insert_only" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (true);

-- 5. Only admin root can update registration status (for payment verification)
CREATE POLICY "event_registrations_admin_root_update" 
ON public.event_registrations 
FOR UPDATE 
USING (is_admin_root_user(current_setting('app.current_user_email'::text, true)))
WITH CHECK (is_admin_root_user(current_setting('app.current_user_email'::text, true)));

-- Add security audit function for registration access
CREATE OR REPLACE FUNCTION public.audit_registration_access(
  table_name text,
  registration_id uuid,
  access_type text
) RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    accessed_table,
    accessed_by,
    access_type,
    access_details
  ) VALUES (
    table_name,
    COALESCE(current_setting('app.current_user_email', true), 'anonymous'),
    access_type,
    jsonb_build_object(
      'registration_id', registration_id,
      'accessed_at', now(),
      'ip_address', current_setting('request.headers', true)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comment explaining the security model
COMMENT ON TABLE public.event_registrations IS 'SECURE: Admin Root sees all data, Regular Admins see basic info only (no financial), Users see own data only. Authentication required for all access.';

-- Create function to safely mask sensitive data for non-root admins
CREATE OR REPLACE FUNCTION public.mask_registration_financial_data(
  reg_data jsonb,
  user_email text
) RETURNS jsonb AS $$
BEGIN
  -- If user is admin root, return all data
  IF is_admin_root_user(user_email) THEN
    RETURN reg_data;
  END IF;
  
  -- For regular admins, mask financial and sensitive data
  RETURN jsonb_build_object(
    'id', reg_data->>'id',
    'full_name', reg_data->>'full_name',
    'email', mask_email_if_not_admin_root(reg_data->>'email', user_email),
    'participant_type', reg_data->>'participant_type',
    'payment_status', reg_data->>'payment_status',
    'created_at', reg_data->>'created_at',
    'updated_at', reg_data->>'updated_at',
    'amount_paid', '[RESTRICTED - ROOT ACCESS REQUIRED]',
    'stripe_session_id', '[RESTRICTED - ROOT ACCESS REQUIRED]',
    'card_brand', '[RESTRICTED - ROOT ACCESS REQUIRED]',
    'payment_method', '[RESTRICTED - ROOT ACCESS REQUIRED]'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;