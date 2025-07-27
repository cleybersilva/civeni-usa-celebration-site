-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CRITICAL SECURITY FIXES

-- 1. Enable RLS on admin_users table (CRITICAL)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 3. Create restrictive policies for admin_users table
-- Only allow admins to read admin user data
CREATE POLICY "admin_users_select_policy" ON public.admin_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);

-- Only admin_root can insert new admin users (handled by function)
CREATE POLICY "admin_users_insert_policy" ON public.admin_users
FOR INSERT WITH CHECK (false); -- Controlled via functions only

-- Only admin_root can update admin users (handled by function) 
CREATE POLICY "admin_users_update_policy" ON public.admin_users
FOR UPDATE USING (false); -- Controlled via functions only

-- Only admin_root can delete admin users (handled by function)
CREATE POLICY "admin_users_delete_policy" ON public.admin_users
FOR DELETE USING (false); -- Controlled via functions only

-- 4. Create restrictive policies for partners table
CREATE POLICY "partners_public_read" ON public.partners
FOR SELECT USING (true);

CREATE POLICY "partners_admin_only" ON public.partners
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);

-- 5. Tighten event_registrations policies - remove overly permissive ALL policy
DROP POLICY IF EXISTS "Allow public insert on event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow public read on event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow public update on event_registrations" ON public.event_registrations;

-- Create more restrictive policies for event_registrations
CREATE POLICY "event_registrations_insert_policy" ON public.event_registrations
FOR INSERT WITH CHECK (true); -- Allow registrations from public

CREATE POLICY "event_registrations_read_admin" ON public.event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type IN ('admin', 'viewer', 'editor') OR au.is_admin_root = true)
  )
);

-- Only allow updates via functions with proper validation
CREATE POLICY "event_registrations_update_functions" ON public.event_registrations
FOR UPDATE USING (false); -- Updates controlled via functions only

-- 6. Tighten alert_logs policies
DROP POLICY IF EXISTS "Allow public access on alert_logs" ON public.alert_logs;

CREATE POLICY "alert_logs_admin_read" ON public.alert_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type IN ('admin', 'viewer') OR au.is_admin_root = true)
  )
);

CREATE POLICY "alert_logs_system_insert" ON public.alert_logs
FOR INSERT WITH CHECK (true); -- Allow system to insert alerts

-- 7. Add login attempt tracking table for security
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for login_attempts (admin only)
CREATE POLICY "login_attempts_admin_only" ON public.login_attempts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempted_at);