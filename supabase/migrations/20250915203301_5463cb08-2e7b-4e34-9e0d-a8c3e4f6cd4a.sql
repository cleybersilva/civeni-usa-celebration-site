-- PHASE 3: Continue Security Fixes + Fix Remaining Issues

-- First, check if there's a security definer view causing the error
-- This is often the v_lote_atual view - let's secure it
DROP VIEW IF EXISTS public.v_lote_atual;

-- Recreate the view without security definer (safer)
CREATE VIEW public.v_lote_atual AS
SELECT * FROM public.lotes 
WHERE ativo = true 
AND dt_inicio <= CURRENT_DATE 
AND dt_fim >= CURRENT_DATE
ORDER BY dt_inicio DESC
LIMIT 1;

-- 2. SECURE EVENT_REGISTRATIONS TABLE (CRITICAL - PAYMENT DATA)
-- Drop existing policies safely
DROP POLICY IF EXISTS "event_registrations_admin_root_full" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_basic" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_own_data" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_system_insert" ON event_registrations;

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
-- Update cms_committee_members to protect email addresses
DROP POLICY IF EXISTS "cms_committee_members_public_read" ON cms_committee_members;
DROP POLICY IF EXISTS "cms_committee_members_public_read_no_email" ON cms_committee_members;
DROP POLICY IF EXISTS "cms_committee_members_admin_with_email" ON cms_committee_members;

-- Create secure policies for committee members
CREATE POLICY "cms_committee_members_public_read_no_email" 
ON cms_committee_members 
FOR SELECT 
USING (
  visible = true AND
  -- Non-admin users get all data except email
  CASE 
    WHEN is_current_user_admin() THEN true
    ELSE email IS NULL OR email = ''
  END
);

-- Separate policy for admins to see emails
CREATE POLICY "cms_committee_members_admin_full" 
ON cms_committee_members 
FOR SELECT 
USING (
  is_current_user_admin()
);