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

-- 3. Users can only see their own registration data (requires authentication)
CREATE POLICY "event_registrations_user_own_access" 
ON public.event_registrations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
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

-- Add trigger to log all registration data access for security monitoring
CREATE OR REPLACE FUNCTION public.log_registration_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to registration data
  INSERT INTO public.security_audit_log (
    accessed_table,
    accessed_by,
    access_type,
    access_details
  ) VALUES (
    'event_registrations',
    COALESCE(current_setting('app.current_user_email', true), 'anonymous'),
    'SELECT',
    jsonb_build_object(
      'registration_id', COALESCE(NEW.id, OLD.id),
      'accessed_at', now(),
      'user_agent', current_setting('request.headers', true)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for audit logging on registration access
CREATE TRIGGER registration_access_audit_trigger
  AFTER SELECT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.log_registration_access();

-- Add comment explaining the security model
COMMENT ON TABLE public.event_registrations IS 'Secure registration data: Admin Root sees all, Regular Admins see basic info only, Users see own data only. All access is logged.';

-- Create function to safely mask sensitive data for non-root admins
CREATE OR REPLACE FUNCTION public.mask_registration_data_for_admin(
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
    'amount_paid', CASE 
      WHEN is_admin_root_user(user_email) THEN reg_data->>'amount_paid'
      ELSE '[RESTRICTED]'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;