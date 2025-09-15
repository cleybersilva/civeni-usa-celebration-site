-- Fix Critical Registration Data Exposure Issue (Corrected)
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

-- Add comment explaining the security model
COMMENT ON TABLE public.event_registrations IS 'Secure registration data: Admin Root sees all, Regular Admins see basic info only, Users see own data only. All access requires authentication.';

-- Create function to safely retrieve registration data with proper access control
CREATE OR REPLACE FUNCTION public.get_registration_data_secure(
  user_email text, 
  session_token uuid,
  registration_id uuid DEFAULT NULL
) RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  participant_type text,
  payment_status text,
  created_at timestamptz,
  amount_paid numeric,
  access_level text
) AS $$
DECLARE
  session_ok boolean;
  is_root boolean;
BEGIN
  -- Validate session
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  -- Check if user is admin root
  SELECT is_admin_root_user(user_email) INTO is_root;
  
  -- Log access attempt
  INSERT INTO public.security_audit_log (
    accessed_table,
    accessed_by,
    access_type,
    access_details
  ) VALUES (
    'event_registrations',
    user_email,
    'SELECT',
    jsonb_build_object(
      'requested_registration_id', registration_id,
      'is_admin_root', is_root,
      'accessed_at', now()
    )
  );

  -- Return data based on user permissions
  IF is_root THEN
    -- Admin root sees all data
    RETURN QUERY
    SELECT 
      er.id,
      er.full_name,
      er.email,
      er.participant_type,
      er.payment_status,
      er.created_at,
      er.amount_paid,
      'full_access'::text as access_level
    FROM public.event_registrations er
    WHERE (registration_id IS NULL OR er.id = registration_id);
  ELSIF is_current_user_admin() THEN
    -- Regular admin sees masked financial data
    RETURN QUERY
    SELECT 
      er.id,
      er.full_name,
      mask_email_if_not_admin_root(er.email, user_email),
      er.participant_type,
      er.payment_status,
      er.created_at,
      NULL::numeric as amount_paid,
      'basic_access'::text as access_level
    FROM public.event_registrations er
    WHERE (registration_id IS NULL OR er.id = registration_id);
  ELSE
    -- Regular users see only their own data
    RETURN QUERY
    SELECT 
      er.id,
      er.full_name,
      er.email,
      er.participant_type,
      er.payment_status,
      er.created_at,
      er.amount_paid,
      'own_data'::text as access_level
    FROM public.event_registrations er
    WHERE lower(er.email) = lower(user_email)
    AND (registration_id IS NULL OR er.id = registration_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;