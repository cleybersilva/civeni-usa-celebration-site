-- Fix the security definer view issue by dropping the problematic view
-- and creating a safer approach

DROP VIEW IF EXISTS public.partner_applications_summary;

-- Instead of a view, create a secure function that returns masked data
CREATE OR REPLACE FUNCTION public.get_partner_applications_summary()
RETURNS TABLE (
  id uuid,
  company_name text,
  contact_name_masked text,
  email_masked text,
  partnership_type text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    pa.id,
    pa.company_name,
    left(pa.contact_name, 1) || '***' as contact_name_masked,
    left(pa.email, 3) || '***@' || split_part(pa.email, '@', 2) as email_masked,
    pa.partnership_type,
    pa.status,
    pa.created_at,
    pa.updated_at
  FROM public.partner_applications pa;
END;
$$;