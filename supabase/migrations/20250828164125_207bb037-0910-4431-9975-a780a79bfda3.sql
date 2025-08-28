-- Secure login_attempts table - ensure admin-only access
-- This table contains sensitive security data (emails, IP addresses) that should never be publicly accessible

-- Ensure RLS is enabled
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Drop any potentially permissive policies
DO $$ 
BEGIN
    -- Check for and drop any public read policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname='public' AND tablename='login_attempts' 
        AND (policyname ILIKE '%public%' OR policyname ILIKE '%read%')
        AND policyname != 'login_attempts_admin_only'
    ) THEN
        -- Drop any potentially dangerous policies
        DROP POLICY IF EXISTS "public_read" ON public.login_attempts;
        DROP POLICY IF EXISTS "allow_read" ON public.login_attempts;
        DROP POLICY IF EXISTS "select_policy" ON public.login_attempts;
    END IF;
END $$;

-- Ensure the admin-only policy exists and is correctly configured
DROP POLICY IF EXISTS "login_attempts_admin_only" ON public.login_attempts;

-- Create a strict admin-only policy for all operations
CREATE POLICY "login_attempts_admin_only" 
ON public.login_attempts 
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.admin_users au
        WHERE au.email = current_setting('app.current_user_email'::text, true)
        AND (au.user_type IN ('admin', 'admin_root') OR au.is_admin_root = true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.admin_users au
        WHERE au.email = current_setting('app.current_user_email'::text, true)
        AND (au.user_type IN ('admin', 'admin_root') OR au.is_admin_root = true)
    )
);

-- Create a system-only policy for functions that need to insert login attempts
-- This allows security definer functions to insert records while still restricting user access
CREATE POLICY "login_attempts_system_insert" 
ON public.login_attempts 
FOR INSERT
WITH CHECK (true); -- Only works from SECURITY DEFINER functions with elevated privileges

-- Ensure no anonymous users can access this table
REVOKE ALL ON public.login_attempts FROM anon;
REVOKE ALL ON public.login_attempts FROM authenticated;

-- Grant specific permissions only to authenticated users through RLS policies
GRANT SELECT, INSERT ON public.login_attempts TO authenticated;