-- Security Enhancement: Layered RLS for event_registrations (Simplified and Fixed)
-- This addresses the security concern by implementing role-based access controls
-- and audit logging for sensitive registration data

-- Create audit log table for registration data access
CREATE TABLE IF NOT EXISTS public.registration_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL,
  admin_user_type TEXT NOT NULL,
  accessed_columns TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the audit log table
ALTER TABLE public.registration_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admin_root can view audit logs
CREATE POLICY "registration_access_logs_admin_root_only"
ON public.registration_access_logs
FOR ALL
USING (is_admin_root_user(current_setting('app.current_user_email', true)));

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "event_registrations_admin_read" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_update" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_delete" ON public.event_registrations;

-- Create new layered RLS policies

-- 1. Admin Root: Full access to all data and operations
CREATE POLICY "event_registrations_admin_root_full_access"
ON public.event_registrations
FOR ALL
USING (is_admin_root_user(current_setting('app.current_user_email', true)))
WITH CHECK (is_admin_root_user(current_setting('app.current_user_email', true)));

-- 2. Regular Admin: Read-only access (no modification of sensitive data)
CREATE POLICY "event_registrations_admin_read_only"
ON public.event_registrations
FOR SELECT
USING (
  NOT is_admin_root_user(current_setting('app.current_user_email', true)) 
  AND is_current_user_admin()
);

-- Create function to log registration modifications
CREATE OR REPLACE FUNCTION public.log_registration_modification()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_type TEXT;
  target_id UUID;
BEGIN
  -- Get current user info
  user_email := current_setting('app.current_user_email', true);
  
  -- Skip logging if no user context
  IF user_email IS NULL OR user_email = '' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  
  -- Get user type
  SELECT admin_users.user_type::TEXT INTO user_type
  FROM public.admin_users 
  WHERE email = user_email;
  
  -- Get the registration ID based on operation type
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.id;
  ELSE
    target_id := NEW.id;
  END IF;
  
  -- Log the modification
  INSERT INTO public.registration_access_logs (
    registration_id,
    accessed_by,
    access_type,
    admin_user_type,
    accessed_columns
  ) VALUES (
    target_id,
    user_email,
    lower(TG_OP),
    COALESCE(user_type, 'unknown'),
    ARRAY['*']
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to log all modifications
CREATE TRIGGER log_registration_modification_trigger
  AFTER UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_registration_modification();

-- Create secure function for registration stats with conditional access
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
  
  -- Get basic stats with conditional revenue access
  SELECT json_build_object(
    'total_registrations', COUNT(*),
    'completed_payments', COUNT(*) FILTER (WHERE payment_status = 'completed'),
    'pending_payments', COUNT(*) FILTER (WHERE payment_status = 'pending'),
    'total_revenue', CASE 
      WHEN is_admin_root_user(user_email) THEN COALESCE(SUM(amount_paid) FILTER (WHERE payment_status = 'completed'), 0)
      ELSE NULL -- Hide revenue from non-root admins
    END,
    'latest_registration', MAX(created_at)
  ) INTO stats
  FROM public.event_registrations;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create secure function for individual registration access with logging
CREATE OR REPLACE FUNCTION public.get_registration_details_secure(registration_id UUID)
RETURNS JSON AS $$
DECLARE
  user_email TEXT;
  user_type TEXT;
  registration_data JSON;
  is_root_user BOOLEAN;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  -- Only allow admin users
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Check if user is admin_root
  is_root_user := is_admin_root_user(user_email);
  
  -- Get user type for logging
  SELECT admin_users.user_type::TEXT INTO user_type
  FROM public.admin_users 
  WHERE email = user_email;
  
  -- Log the access attempt
  INSERT INTO public.registration_access_logs (
    registration_id,
    accessed_by,
    access_type,
    admin_user_type,
    accessed_columns
  ) VALUES (
    registration_id,
    user_email,
    'view',
    COALESCE(user_type, 'unknown'),
    CASE 
      WHEN is_root_user THEN ARRAY['*']
      ELSE ARRAY['basic_fields']
    END
  );
  
  -- Return data based on user permissions
  IF is_root_user THEN
    -- Admin root gets full access including sensitive payment data
    SELECT json_build_object(
      'id', er.id,
      'full_name', er.full_name,
      'email', er.email,
      'category_id', er.category_id,
      'batch_id', er.batch_id,
      'curso_id', er.curso_id,
      'turma_id', er.turma_id,
      'participant_type', er.participant_type,
      'payment_status', er.payment_status,
      'stripe_session_id', er.stripe_session_id,
      'amount_paid', er.amount_paid,
      'payment_method', er.payment_method,
      'card_brand', er.card_brand,
      'payment_type', er.payment_type,
      'currency', er.currency,
      'installments', er.installments,
      'coupon_code', er.coupon_code,
      'created_at', er.created_at,
      'updated_at', er.updated_at
    ) INTO registration_data
    FROM public.event_registrations er
    WHERE er.id = get_registration_details_secure.registration_id;
  ELSE
    -- Regular admins get basic data only (no sensitive payment info)
    SELECT json_build_object(
      'id', er.id,
      'full_name', er.full_name,
      'email', er.email,
      'category_id', er.category_id,
      'batch_id', er.batch_id,
      'curso_id', er.curso_id,
      'turma_id', er.turma_id,
      'participant_type', er.participant_type,
      'payment_status', er.payment_status,
      'created_at', er.created_at,
      'updated_at', er.updated_at
    ) INTO registration_data
    FROM public.event_registrations er
    WHERE er.id = get_registration_details_secure.registration_id;
  END IF;
  
  RETURN registration_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create secure function for admin to safely update registration data
-- This ensures only admin_root can modify sensitive fields
CREATE OR REPLACE FUNCTION public.update_registration_secure(
  registration_id UUID,
  updates JSON
)
RETURNS JSON AS $$
DECLARE
  user_email TEXT;
  is_root_user BOOLEAN;
  current_data RECORD;
  result JSON;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  -- Only allow admin users
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  is_root_user := is_admin_root_user(user_email);
  
  -- Get current registration data
  SELECT * INTO current_data FROM public.event_registrations WHERE id = registration_id;
  
  IF current_data IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Registration not found');
  END IF;
  
  -- Log the update attempt
  INSERT INTO public.registration_access_logs (
    registration_id,
    accessed_by,
    access_type,
    admin_user_type,
    accessed_columns
  ) VALUES (
    registration_id,
    user_email,
    'update',
    CASE WHEN is_root_user THEN 'admin_root' ELSE 'admin' END,
    ARRAY(SELECT jsonb_object_keys(updates::jsonb))
  );
  
  -- Apply updates based on user permissions
  IF is_root_user THEN
    -- Admin root can update any field
    UPDATE public.event_registrations 
    SET 
      full_name = COALESCE((updates->>'full_name')::TEXT, full_name),
      email = COALESCE((updates->>'email')::TEXT, email),
      payment_status = COALESCE((updates->>'payment_status')::TEXT, payment_status),
      amount_paid = COALESCE((updates->>'amount_paid')::NUMERIC, amount_paid),
      updated_at = now()
    WHERE id = registration_id;
  ELSE
    -- Regular admin can only update basic fields
    UPDATE public.event_registrations 
    SET 
      full_name = COALESCE((updates->>'full_name')::TEXT, full_name),
      email = COALESCE((updates->>'email')::TEXT, email),
      updated_at = now()
    WHERE id = registration_id;
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Registration updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registration_access_logs_registration_id 
ON public.registration_access_logs(registration_id);

CREATE INDEX IF NOT EXISTS idx_registration_access_logs_accessed_by 
ON public.registration_access_logs(accessed_by);

CREATE INDEX IF NOT EXISTS idx_registration_access_logs_created_at 
ON public.registration_access_logs(created_at);

-- Add security documentation
COMMENT ON TABLE public.event_registrations IS 
'Event registration data with layered security: admin_root has full access, regular admins have read-only access. Use secure functions for modifications.';

COMMENT ON TABLE public.registration_access_logs IS 
'Audit log for registration data access. Only admin_root can view these logs.';

COMMENT ON FUNCTION public.get_registration_details_secure(UUID) IS 
'Secure function to access registration details with logging. Returns full data for admin_root, limited data for regular admins.';

COMMENT ON FUNCTION public.update_registration_secure(UUID, JSON) IS 
'Secure function to update registration data. Admin_root can modify sensitive fields, regular admins can only modify basic fields.';