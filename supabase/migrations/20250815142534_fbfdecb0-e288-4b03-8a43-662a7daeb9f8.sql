-- CRITICAL SECURITY FIX: Secure registration tables from public data theft
-- Issue: Both 'registrations' and 'event_registrations' tables expose personal data publicly

-- First, let's check current policies on both registration tables
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename IN ('registrations', 'event_registrations')
ORDER BY tablename, policyname;

-- STEP 1: Secure the 'registrations' table
-- Remove dangerous public read access
DROP POLICY IF EXISTS "Allow public read on registrations" ON public.registrations;

-- Create admin-only read policy for registrations management
CREATE POLICY "registrations_admin_read_only" 
ON public.registrations 
FOR SELECT 
TO public
USING (is_current_user_admin());

-- Keep public insert for new registrations (business requirement)
-- But ensure we don't create duplicate policies
DROP POLICY IF EXISTS "Allow public insert on registrations" ON public.registrations;
CREATE POLICY "registrations_public_insert_only" 
ON public.registrations 
FOR INSERT 
TO public
WITH CHECK (true);

-- STEP 2: Secure the 'event_registrations' table 
-- Remove any overly permissive read policies
DROP POLICY IF EXISTS "event_registrations_public_read" ON public.event_registrations;

-- The event_registrations table already has proper admin-only read policy, but let's verify it's secure
-- Create admin update policy for payment status updates (needed for Stripe webhooks)
CREATE POLICY "event_registrations_admin_update" 
ON public.event_registrations 
FOR UPDATE 
TO public
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Add admin delete policy for data management
CREATE POLICY "event_registrations_admin_delete" 
ON public.event_registrations 
FOR DELETE 
TO public
USING (is_current_user_admin());

-- STEP 3: Verify all policies are now secure
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename IN ('registrations', 'event_registrations')
ORDER BY tablename, policyname;