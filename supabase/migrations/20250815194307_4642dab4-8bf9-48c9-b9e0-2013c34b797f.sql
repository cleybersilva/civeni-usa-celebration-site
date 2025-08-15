-- CRITICAL SECURITY FIX: Phase 1 - RLS Policy Hardening
-- Fix vulnerable RLS policies that allow public write access

-- 1. Fix schedules table - remove overly permissive policy
DROP POLICY IF EXISTS "Allow admin full access on schedules" ON public.schedules;

-- Create proper admin-only policies for schedules
CREATE POLICY "schedules_admin_all_operations" 
ON public.schedules 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Keep public read for published schedules (already exists)

-- 2. Fix event_config table - remove overly permissive policy
DROP POLICY IF EXISTS "event_config_admin_all" ON public.event_config;

-- Create proper admin-only write policy for event_config
CREATE POLICY "event_config_admin_all_operations" 
ON public.event_config 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Keep public read policy (already exists)

-- 3. Fix banner_slides table - remove confusing policies
DROP POLICY IF EXISTS "banner_slides_admin_operations" ON public.banner_slides;
DROP POLICY IF EXISTS "banner_slides_public_read_only" ON public.banner_slides;

-- Create clear admin-only write policy for banner_slides
CREATE POLICY "banner_slides_admin_all_operations" 
ON public.banner_slides 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Keep single public read policy for active slides (already exists: banner_slides_public_read_active)

-- 4. Fix alert_logs insert vulnerability
DROP POLICY IF EXISTS "alert_logs_system_insert" ON public.alert_logs;

-- Remove public insert access - only allow system triggers/functions
CREATE POLICY "alert_logs_system_insert_restricted" 
ON public.alert_logs 
FOR INSERT 
WITH CHECK (false); -- Block all public inserts

-- 5. Fix SECURITY DEFINER functions search_path vulnerability
-- Update functions to have explicit search_path

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.set_current_user_email(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM set_config('app.current_user_email', user_email, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_admin_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN current_setting('app.current_user_email', true);
END;
$function$;

-- 6. Verify final security state
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual LIKE '%is_current_user_admin%' THEN 'SECURE (Admin Only)'
        WHEN qual = 'true' AND cmd = 'SELECT' THEN 'PUBLIC READ'
        WHEN qual = 'true' AND cmd = 'INSERT' THEN 'CONTROLLED (Insert Only)'
        WHEN qual = 'false' THEN 'BLOCKED'
        WHEN qual = 'true' THEN 'VULNERABLE (Public Access)'
        ELSE 'REVIEW NEEDED'
    END as security_level
FROM pg_policies 
WHERE tablename IN ('schedules', 'event_config', 'banner_slides', 'alert_logs')
ORDER BY tablename, policyname;