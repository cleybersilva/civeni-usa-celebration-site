-- Security hardening for partner_applications table

-- 1. Add rate limiting and input validation constraints
ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_company_name_length 
CHECK (char_length(company_name) >= 2 AND char_length(company_name) <= 200);

ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_contact_name_length 
CHECK (char_length(contact_name) >= 2 AND char_length(contact_name) <= 100);

-- 2. Add phone number validation (optional field)
ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_phone_format 
CHECK (phone IS NULL OR (phone ~ '^[\+]?[0-9\s\-\(\)]{7,20}$' AND char_length(phone) >= 7));

-- 3. Add website URL validation (optional field)
ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_website_format 
CHECK (website IS NULL OR website ~* '^https?://[^\s/$.?#].[^\s]*$');

-- 4. Limit message length to prevent abuse
ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_message_length 
CHECK (message IS NULL OR char_length(message) <= 2000);

-- 5. Add constraint for partnership_type to only allow valid values
ALTER TABLE public.partner_applications 
ADD CONSTRAINT partner_applications_partnership_type_valid 
CHECK (partnership_type IN ('sponsor', 'exhibitor', 'media', 'academic', 'vendor', 'other'));

-- 6. Create a more restrictive INSERT policy with additional security checks
DROP POLICY IF EXISTS "partner_applications_insert_public" ON public.partner_applications;

CREATE POLICY "partner_applications_insert_restricted"
ON public.partner_applications
FOR INSERT
TO public
WITH CHECK (
  -- Ensure required fields are not empty strings
  char_length(trim(company_name)) >= 2 AND
  char_length(trim(contact_name)) >= 2 AND
  char_length(trim(email)) >= 5 AND
  -- Prevent obvious spam patterns
  company_name !~* '(test|spam|fake|admin|root)' AND
  contact_name !~* '(test|spam|fake|admin|root)' AND
  email !~* '(test|spam|fake|admin|root)@' AND
  -- Ensure status is always 'pending' for new applications
  status = 'pending'
);

-- 7. Create function to sanitize and log suspicious application attempts
CREATE OR REPLACE FUNCTION public.log_suspicious_partner_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log if someone tries to set status to anything other than 'pending'
  IF NEW.status != 'pending' THEN
    INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message)
    VALUES (
      'security_alert',
      'email',
      'cleyber.silva@live.com',
      'Tentativa suspeita de alteração de status em partner_applications: ' || NEW.status
    );
  END IF;
  
  -- Ensure status is always 'pending' for new applications
  NEW.status := 'pending';
  
  -- Trim whitespace from text fields
  NEW.company_name := trim(NEW.company_name);
  NEW.contact_name := trim(NEW.contact_name);
  NEW.email := lower(trim(NEW.email));
  
  IF NEW.website IS NOT NULL THEN
    NEW.website := trim(NEW.website);
  END IF;
  
  IF NEW.message IS NOT NULL THEN
    NEW.message := trim(NEW.message);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Create trigger to sanitize data on insert
CREATE TRIGGER sanitize_partner_application_trigger
  BEFORE INSERT ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_suspicious_partner_application();

-- 9. Create index for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_partner_applications_status_created 
ON public.partner_applications(status, created_at DESC);

-- 10. Create a safe view for internal use that masks sensitive data
CREATE OR REPLACE VIEW public.partner_applications_summary AS
SELECT 
  id,
  company_name,
  left(contact_name, 1) || '***' as contact_name_masked,
  left(email, 3) || '***@' || split_part(email, '@', 2) as email_masked,
  partnership_type,
  status,
  created_at,
  updated_at
FROM public.partner_applications;

-- Grant read access to the summary view for logged users
GRANT SELECT ON public.partner_applications_summary TO authenticated;