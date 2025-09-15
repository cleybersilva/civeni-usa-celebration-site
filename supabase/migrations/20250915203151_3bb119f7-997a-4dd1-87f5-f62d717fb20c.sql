-- PHASE 1: CRITICAL SECURITY FIXES - RLS POLICIES (Fixed)

-- 1. SECURE ADMIN_USERS TABLE (CRITICAL)
-- Drop existing policies safely
DROP POLICY IF EXISTS "admin_users_authenticated_read" ON admin_users;
DROP POLICY IF EXISTS "admin_users_admin_root_only" ON admin_users;
DROP POLICY IF EXISTS "admin_users_own_record" ON admin_users;
DROP POLICY IF EXISTS "admin_users_system_queries" ON admin_users;

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

-- 4. ADD SECURITY FUNCTION TO CHECK IF USER IS ADMIN ROOT (if not exists)
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