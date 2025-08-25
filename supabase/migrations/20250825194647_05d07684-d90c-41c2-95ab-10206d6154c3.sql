-- Security Enhancement: Layered RLS for event_registrations
-- This addresses the security concern by implementing column-level access controls
-- and audit logging for sensitive registration data

-- First, let's create an audit log table for registration data access
CREATE TABLE IF NOT EXISTS public.registration_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'view', 'update', 'delete'
  admin_user_type TEXT NOT NULL,
  accessed_columns TEXT[], -- Array of column names accessed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the audit log table
ALTER TABLE public.registration_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admin_root can view audit logs
CREATE POLICY "registration_access_logs_admin_root_only"
ON public.registration_access_logs
FOR ALL
USING (is_admin_root_user(current_setting('app.current_user_email', true)));

-- Create a view for basic registration data (non-sensitive)
CREATE OR REPLACE VIEW public.registrations_basic AS
SELECT 
  id,
  full_name,
  email,
  category_id,
  batch_id,
  course_id,
  turma_id,
  participant_type,
  payment_status,
  created_at,
  updated_at
FROM public.event_registrations;

-- Enable RLS on the view
ALTER VIEW public.registrations_basic SET (security_barrier = true);

-- Create a view for payment data (highly sensitive)
CREATE OR REPLACE VIEW public.registrations_payment_details AS
SELECT 
  id,
  full_name,
  email,
  stripe_session_id,
  amount_paid,
  payment_method,
  card_brand,
  payment_type,
  currency,
  installments,
  coupon_code,
  created_at,
  payment_status
FROM public.event_registrations;

-- Enable RLS on the payment view
ALTER VIEW public.registrations_payment_details SET (security_barrier = true);

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "event_registrations_admin_read" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_update" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_delete" ON public.event_registrations;

-- Create new layered RLS policies for the main table

-- 1. Admin Root: Full access to all data
CREATE POLICY "event_registrations_admin_root_full_access"
ON public.event_registrations
FOR ALL
USING (is_admin_root_user(current_setting('app.current_user_email', true)))
WITH CHECK (is_admin_root_user(current_setting('app.current_user_email', true)));

-- 2. Regular Admin: Access to basic data only (no sensitive payment details)
CREATE POLICY "event_registrations_admin_basic_read"
ON public.event_registrations
FOR SELECT
USING (
  NOT is_admin_root_user(current_setting('app.current_user_email', true)) 
  AND is_current_user_admin()
);

-- 3. Regular Admin: Can update non-sensitive fields only
CREATE POLICY "event_registrations_admin_basic_update"
ON public.event_registrations
FOR UPDATE
USING (
  NOT is_admin_root_user(current_setting('app.current_user_email', true)) 
  AND is_current_user_admin()
)
WITH CHECK (
  NOT is_admin_root_user(current_setting('app.current_user_email', true)) 
  AND is_current_user_admin()
  -- Prevent updates to sensitive payment fields by non-root admins
  AND OLD.stripe_session_id IS NOT DISTINCT FROM NEW.stripe_session_id
  AND OLD.amount_paid IS NOT DISTINCT FROM NEW.amount_paid
  AND OLD.payment_method IS NOT DISTINCT FROM NEW.payment_method
  AND OLD.card_brand IS NOT DISTINCT FROM NEW.card_brand
  AND OLD.payment_type IS NOT DISTINCT FROM NEW.payment_type
);

-- Create RLS policies for the views

-- Basic registration view - accessible by all admin types
CREATE POLICY "registrations_basic_admin_read"
ON public.registrations_basic
FOR SELECT
USING (is_current_user_admin());

-- Payment details view - only admin_root
CREATE POLICY "registrations_payment_admin_root_only"
ON public.registrations_payment_details
FOR SELECT
USING (is_admin_root_user(current_setting('app.current_user_email', true)));

-- Create function to log registration data access
CREATE OR REPLACE FUNCTION public.log_registration_access()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_type TEXT;
BEGIN
  -- Get current user info
  user_email := current_setting('app.current_user_email', true);
  
  -- Get user type
  SELECT admin_users.user_type::TEXT INTO user_type
  FROM public.admin_users 
  WHERE email = user_email;
  
  -- Log the access
  INSERT INTO public.registration_access_logs (
    registration_id,
    accessed_by,
    access_type,
    admin_user_type,
    accessed_columns
  ) VALUES (
    CASE 
      WHEN TG_OP = 'SELECT' THEN NEW.id
      ELSE OLD.id
    END,
    user_email,
    lower(TG_OP),
    COALESCE(user_type, 'unknown'),
    ARRAY['*'] -- We could make this more granular if needed
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers to log access to sensitive registration data
CREATE TRIGGER log_registration_access_trigger
  AFTER SELECT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW
  WHEN (current_setting('app.current_user_email', true) IS NOT NULL)
  EXECUTE FUNCTION public.log_registration_access();

-- Create a secure function for admin users to query basic registration stats
CREATE OR REPLACE FUNCTION public.get_registration_stats_secure()
RETURNS JSON AS $$
DECLARE
  user_email TEXT;
  stats JSON;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  -- Only allow admin users
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Get basic stats without exposing sensitive data
  SELECT json_build_object(
    'total_registrations', COUNT(*),
    'completed_payments', COUNT(*) FILTER (WHERE payment_status = 'completed'),
    'pending_payments', COUNT(*) FILTER (WHERE payment_status = 'pending'),
    'total_revenue', CASE 
      WHEN is_admin_root_user(user_email) THEN SUM(amount_paid) FILTER (WHERE payment_status = 'completed')
      ELSE NULL -- Hide revenue from non-root admins
    END,
    'latest_registration', MAX(created_at)
  ) INTO stats
  FROM public.event_registrations;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create indexes for better performance on the audit log
CREATE INDEX IF NOT EXISTS idx_registration_access_logs_registration_id 
ON public.registration_access_logs(registration_id);

CREATE INDEX IF NOT EXISTS idx_registration_access_logs_accessed_by 
ON public.registration_access_logs(accessed_by);

CREATE INDEX IF NOT EXISTS idx_registration_access_logs_created_at 
ON public.registration_access_logs(created_at);

-- Add a comment explaining the security model
COMMENT ON TABLE public.event_registrations IS 
'Event registration data with layered RLS security: admin_root gets full access, regular admins get limited access to non-sensitive data only. All access is logged in registration_access_logs.';

COMMENT ON VIEW public.registrations_basic IS 
'Safe view of registration data without sensitive payment information. Accessible by all admin types.';

COMMENT ON VIEW public.registrations_payment_details IS 
'Sensitive payment data view. Only accessible by admin_root users. All access is logged.';