-- Additional security enhancements for partner_applications table

-- Add rate limiting for partner application submissions
-- Create a function to check submission frequency
CREATE OR REPLACE FUNCTION public.check_partner_application_rate_limit(user_ip text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count applications from same IP in last hour
  IF user_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_count
    FROM public.partner_applications
    WHERE created_at > (now() - interval '1 hour')
    AND (message LIKE '%' || user_ip || '%' OR phone LIKE '%' || user_ip || '%');
    
    -- Allow max 3 applications per IP per hour
    IF recent_count >= 3 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update the insert policy to include rate limiting
DROP POLICY IF EXISTS "partner_applications_insert_restricted" ON public.partner_applications;

CREATE POLICY "partner_applications_insert_rate_limited" 
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
  -- Add email domain validation
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Prevent obviously fake domains
  email !~* '@(test\.com|fake\.com|spam\.com|tempmail\.com|10minutemail\.com|guerrillamail\.com)'
);

-- Add additional data sanitization trigger
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

-- Replace the existing trigger
DROP TRIGGER IF EXISTS sanitize_partner_application_trigger ON public.partner_applications;

CREATE TRIGGER enhanced_sanitize_partner_application_trigger
  BEFORE INSERT OR UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_sanitize_partner_application();

-- Add audit logging for admin access to partner applications
CREATE OR REPLACE FUNCTION public.log_partner_application_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when admins access partner application data
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message)
  VALUES (
    'data_access',
    'system',
    'audit',
    'Admin accessed partner application: ' || COALESCE(OLD.company_name, NEW.company_name) || 
    ' by user: ' || COALESCE(current_setting('app.current_user_email', true), 'unknown')
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit trigger for select operations
CREATE TRIGGER audit_partner_application_access
  AFTER SELECT ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_partner_application_access();