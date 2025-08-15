-- Security Fix: Restrict public access to hybrid_format_config table
-- Issue: Table contains sensitive data (phone numbers, credit card patterns) but is publicly readable

-- Drop ALL existing policies for hybrid_format_config to start fresh
DROP POLICY IF EXISTS "hybrid_format_admin_all" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_public_read" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_admin_read" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_admin_write" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_admin_update" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_admin_delete" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_public_read_safe" ON public.hybrid_format_config;

-- Create secure admin-only policies
CREATE POLICY "hybrid_format_admin_read" 
ON public.hybrid_format_config 
FOR SELECT 
TO public
USING (is_current_user_admin());

CREATE POLICY "hybrid_format_admin_write" 
ON public.hybrid_format_config 
FOR INSERT 
TO public
WITH CHECK (is_current_user_admin());

CREATE POLICY "hybrid_format_admin_update" 
ON public.hybrid_format_config 
FOR UPDATE 
TO public
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "hybrid_format_admin_delete" 
ON public.hybrid_format_config 
FOR DELETE 
TO public
USING (is_current_user_admin());

-- Create a limited public read policy that only shows non-sensitive active records
CREATE POLICY "hybrid_format_public_read_safe" 
ON public.hybrid_format_config 
FOR SELECT 
TO public
USING (
  is_active = true 
  AND activity_type NOT ILIKE '%phone%' 
  AND activity_type NOT ILIKE '%card%'
  AND activity_type NOT ILIKE '%credit%'
  AND title NOT ILIKE '%phone%'
  AND title NOT ILIKE '%card%' 
  AND title NOT ILIKE '%credit%'
  AND description NOT ILIKE '%phone%'
  AND description NOT ILIKE '%card%'
  AND description NOT ILIKE '%credit%'
  AND description !~ '\d{3}[-.]?\d{3}[-.]?\d{4}'  -- Phone number pattern
  AND description !~ '\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}'  -- Credit card pattern
);