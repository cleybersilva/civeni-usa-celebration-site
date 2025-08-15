-- CRITICAL SECURITY FIX: Secure registration tables from public data theft
-- Issue: Both 'registrations' and 'event_registrations' tables expose personal data publicly

-- STEP 1: Clean up 'registrations' table policies
DROP POLICY IF EXISTS "Allow public read on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public insert on registrations" ON public.registrations;
DROP POLICY IF EXISTS "registrations_admin_read_only" ON public.registrations;
DROP POLICY IF EXISTS "registrations_public_insert_only" ON public.registrations;

-- Create secure policies for registrations table
CREATE POLICY "registrations_admin_read_only" 
ON public.registrations 
FOR SELECT 
TO public
USING (is_current_user_admin());

CREATE POLICY "registrations_public_insert_only" 
ON public.registrations 
FOR INSERT 
TO public
WITH CHECK (true);

-- STEP 2: Clean up 'event_registrations' table policies
DROP POLICY IF EXISTS "event_registrations_public_read" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_update" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_delete" ON public.event_registrations;

-- The event_registrations already has secure admin read policy, add missing ones
CREATE POLICY "event_registrations_admin_update" 
ON public.event_registrations 
FOR UPDATE 
TO public
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "event_registrations_admin_delete" 
ON public.event_registrations 
FOR DELETE 
TO public
USING (is_current_user_admin());

-- STEP 3: Verify security - check final policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual LIKE '%is_current_user_admin%' THEN 'SECURE (Admin Only)'
        WHEN qual = 'true' AND cmd = 'INSERT' THEN 'CONTROLLED (Insert Only)'
        WHEN qual = 'true' THEN 'VULNERABLE (Public Access)'
        ELSE 'UNKNOWN'
    END as security_level
FROM pg_policies 
WHERE tablename IN ('registrations', 'event_registrations')
ORDER BY tablename, policyname;