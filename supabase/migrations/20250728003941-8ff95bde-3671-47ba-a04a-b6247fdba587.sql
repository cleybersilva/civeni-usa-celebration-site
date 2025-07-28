-- Fix infinite recursion in RLS policies for admin_users table
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "event_registrations_read_admin" ON public.event_registrations;
DROP POLICY IF EXISTS "alert_logs_admin_read" ON public.alert_logs;

-- Create a security definer function to check admin permissions
CREATE OR REPLACE FUNCTION public.get_current_admin_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_email', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  IF user_email IS NULL OR user_email = '' THEN
    RETURN FALSE;
  END IF;
  
  SELECT 
    CASE 
      WHEN user_type IN ('admin', 'admin_root') OR is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM public.admin_users 
  WHERE email = user_email;
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies without recursion
CREATE POLICY "admin_users_select_by_function" 
ON public.admin_users 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "event_registrations_admin_read" 
ON public.event_registrations 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "alert_logs_admin_read_new" 
ON public.alert_logs 
FOR SELECT 
USING (public.is_current_user_admin());