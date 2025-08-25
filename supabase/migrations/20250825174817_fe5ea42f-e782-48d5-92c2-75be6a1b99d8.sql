-- Enhanced security for partner_applications table (fixed version)

-- Enhanced data sanitization trigger  
CREATE OR REPLACE FUNCTION public.enhanced_sanitize_partner_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enhanced sanitization and validation
  NEW.company_name := trim(regexp_replace(NEW.company_name, '[<>\"''`]', '', 'g'));
  NEW.contact_name := trim(regexp_replace(NEW.contact_name, '[<>\"''`]', '', 'g'));
  NEW.email := lower(trim(NEW.email));
  
  -- Remove potential script injection attempts
  IF NEW.message IS NOT NULL THEN
    NEW.message := trim(regexp_replace(NEW.message, '<[^>]*>', '', 'g'));
    NEW.message := regexp_replace(NEW.message, '(javascript:|data:|vbscript:)', '', 'gi');
  END IF;
  
  -- Sanitize phone number
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '[^0-9()\-\+\s]', '', 'g');
  END IF;
  
  -- Sanitize website URL
  IF NEW.website IS NOT NULL THEN
    NEW.website := trim(NEW.website);
    -- Ensure it starts with http/https
    IF NEW.website !~* '^https?://' AND length(NEW.website) > 0 THEN
      NEW.website := 'https://' || NEW.website;
    END IF;
  END IF;
  
  -- Always ensure status is pending
  NEW.status := 'pending';
  
  RETURN NEW;
END;
$$;

-- Update the insert policy with enhanced validation
DROP POLICY IF EXISTS "partner_applications_insert_restricted" ON public.partner_applications;
DROP POLICY IF EXISTS "partner_applications_insert_rate_limited" ON public.partner_applications;

CREATE POLICY "partner_applications_insert_secure" 
ON public.partner_applications 
FOR INSERT 
WITH CHECK (
  -- Existing validations
  char_length(TRIM(BOTH FROM company_name)) >= 2 AND
  char_length(TRIM(BOTH FROM contact_name)) >= 2 AND
  char_length(TRIM(BOTH FROM email)) >= 5 AND
  company_name !~* '(test|spam|fake|admin|root)' AND
  contact_name !~* '(test|spam|fake|admin|root)' AND
  email !~* '(test|spam|fake|admin|root)@' AND
  status = 'pending' AND
  -- Add strict email validation
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Prevent obviously fake or temporary email domains
  email !~* '@(test\.com|fake\.com|spam\.com|tempmail\.com|10minutemail\.com|guerrillamail\.com|mailinator\.com|throwaway\.email)' AND
  -- Validate partnership type
  partnership_type IN ('sponsor', 'exhibitor', 'media', 'academic', 'vendor', 'other') AND
  -- Prevent excessively long content
  char_length(company_name) <= 200 AND
  char_length(contact_name) <= 100 AND
  char_length(email) <= 100 AND
  (phone IS NULL OR char_length(phone) <= 20) AND
  (website IS NULL OR char_length(website) <= 200) AND
  (message IS NULL OR char_length(message) <= 2000)
);

-- Replace the existing trigger with enhanced version
DROP TRIGGER IF EXISTS sanitize_partner_application_trigger ON public.partner_applications;
DROP TRIGGER IF EXISTS enhanced_sanitize_partner_application_trigger ON public.partner_applications;

CREATE TRIGGER enhanced_sanitize_partner_application_trigger
  BEFORE INSERT OR UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_sanitize_partner_application();

-- Add index for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_partner_applications_status_created 
ON public.partner_applications(status, created_at DESC);

-- Add index for security monitoring
CREATE INDEX IF NOT EXISTS idx_partner_applications_email_created 
ON public.partner_applications(email, created_at);

-- Ensure the get_partner_applications_summary function has proper security
DROP FUNCTION IF EXISTS public.get_partner_applications_summary();

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
  FROM public.partner_applications pa
  ORDER BY pa.created_at DESC;
END;
$$;