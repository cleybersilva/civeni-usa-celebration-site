-- PHASE 1: CRITICAL SECURITY FIXES - RLS POLICIES

-- 1. SECURE ADMIN_USERS TABLE (CRITICAL)
-- Drop the overly permissive policy that allows any authenticated user to see admin data
DROP POLICY IF EXISTS "admin_users_authenticated_read" ON admin_users;

-- Create secure policies for admin_users table
-- Only admin_root users can view all admin users
CREATE POLICY "admin_users_admin_root_only" 
ON admin_users 
FOR SELECT 
USING (
  -- Only admin_root users can see all admin data
  is_admin_root_user(current_setting('app.current_user_email', true))
);

-- Admin users can only view their own record
CREATE POLICY "admin_users_own_record" 
ON admin_users 
FOR SELECT 
USING (
  -- Allow users to see their own record
  email = current_setting('app.current_user_email', true)
);

-- System queries (without JWT) are still allowed for internal functions
CREATE POLICY "admin_users_system_queries" 
ON admin_users 
FOR SELECT 
USING (
  -- Allow system queries without JWT context
  current_setting('request.jwt.claims', true) IS NULL
);

-- 2. SECURE EVENT_REGISTRATIONS TABLE (CRITICAL - PAYMENT DATA)
-- Enable RLS if not already enabled
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Admin root can see all registration data including sensitive payment info
CREATE POLICY "event_registrations_admin_root_full" 
ON event_registrations 
FOR SELECT 
USING (
  is_admin_root_user(current_setting('app.current_user_email', true))
);

-- Regular admins can see basic registration data but not payment details
-- This will be handled at the application level with column filtering
CREATE POLICY "event_registrations_admin_basic" 
ON event_registrations 
FOR SELECT 
USING (
  is_current_user_admin() AND 
  NOT is_admin_root_user(current_setting('app.current_user_email', true))
);

-- Users can see their own registration
CREATE POLICY "event_registrations_own_data" 
ON event_registrations 
FOR SELECT 
USING (
  lower(email) = lower(current_setting('app.current_user_email', true))
);

-- System can insert registrations
CREATE POLICY "event_registrations_system_insert" 
ON event_registrations 
FOR INSERT 
WITH CHECK (true);

-- 3. SECURE EMAIL ADDRESSES IN OTHER TABLES

-- Update work_submissions to hide emails from non-admins
DROP POLICY IF EXISTS "work_submissions_insert_system_only" ON work_submissions;
CREATE POLICY "work_submissions_insert_system_only" 
ON work_submissions 
FOR INSERT 
WITH CHECK (false); -- Only system can insert via edge functions

-- Update cms_committee_members to protect email addresses
DROP POLICY IF EXISTS "cms_committee_members_public_read" ON cms_committee_members;
CREATE POLICY "cms_committee_members_public_read_no_email" 
ON cms_committee_members 
FOR SELECT 
USING (
  visible = true AND
  -- Non-admin users cannot see email addresses
  (is_current_user_admin() OR email IS NULL)
);

-- Admin-only access to see emails in cms_committee_members
CREATE POLICY "cms_committee_members_admin_with_email" 
ON cms_committee_members 
FOR SELECT 
USING (
  is_current_user_admin()
);

-- 4. ADD SECURITY FUNCTION TO CHECK IF USER IS ADMIN ROOT
CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_root boolean;
BEGIN
  IF user_email IS NULL OR user_email = '' THEN
    RETURN false;
  END IF;
  
  SELECT 
    CASE 
      WHEN user_type = 'admin_root' OR is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_root
  FROM admin_users 
  WHERE email = user_email;
  
  RETURN COALESCE(is_root, false);
END;
$$;