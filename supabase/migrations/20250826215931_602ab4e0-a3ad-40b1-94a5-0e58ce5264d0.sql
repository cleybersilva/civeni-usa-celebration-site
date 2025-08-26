-- Improve partner_applications security by removing public insert and adding rate limiting table

-- Create a table to track submission attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.partner_application_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET,
  email TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on attempts table
ALTER TABLE public.partner_application_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow system/edge functions to access attempts table
CREATE POLICY "partner_application_attempts_system_only" 
ON public.partner_application_attempts 
FOR ALL 
USING (false);

-- Remove the existing public insert policy on partner_applications
DROP POLICY IF EXISTS "partner_applications_insert_secure" ON public.partner_applications;

-- Create new policy that blocks all public inserts (only secure edge function will insert)
CREATE POLICY "partner_applications_no_public_insert" 
ON public.partner_applications 
FOR INSERT 
WITH CHECK (false);

-- Create function to check and update rate limiting
CREATE OR REPLACE FUNCTION public.check_partner_application_rate_limit(
  user_ip INET, 
  user_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_record RECORD;
  current_time TIMESTAMP WITH TIME ZONE := now();
  rate_limit_window INTERVAL := '1 hour';
  max_attempts INTEGER := 3;
  block_duration INTERVAL := '24 hours';
BEGIN
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM public.partner_application_attempts 
  WHERE first_attempt_at < current_time - '24 hours'::interval;
  
  -- Check for existing attempts by IP or email
  SELECT * INTO attempt_record
  FROM public.partner_application_attempts
  WHERE (ip_address = user_ip OR email = user_email)
  AND first_attempt_at > current_time - rate_limit_window;
  
  -- If blocked, check if block period has expired
  IF attempt_record.blocked_until IS NOT NULL AND current_time < attempt_record.blocked_until THEN
    RETURN false;
  END IF;
  
  -- If we found an existing record within the window
  IF attempt_record.id IS NOT NULL THEN
    -- Check if we've exceeded max attempts
    IF attempt_record.attempt_count >= max_attempts THEN
      -- Block for 24 hours
      UPDATE public.partner_application_attempts
      SET blocked_until = current_time + block_duration,
          last_attempt_at = current_time
      WHERE id = attempt_record.id;
      RETURN false;
    ELSE
      -- Increment attempt count
      UPDATE public.partner_application_attempts
      SET attempt_count = attempt_count + 1,
          last_attempt_at = current_time
      WHERE id = attempt_record.id;
      RETURN true;
    END IF;
  ELSE
    -- First attempt, create new record
    INSERT INTO public.partner_application_attempts (ip_address, email, attempt_count)
    VALUES (user_ip, user_email, 1);
    RETURN true;
  END IF;
END;
$$;

-- Create secure function to insert partner applications
CREATE OR REPLACE FUNCTION public.submit_partner_application_secure(
  application_data JSONB,
  user_ip TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ip_addr INET;
  rate_check BOOLEAN;
  app_id UUID;
  result JSON;
BEGIN
  -- Parse IP address
  BEGIN
    ip_addr := user_ip::INET;
  EXCEPTION WHEN OTHERS THEN
    ip_addr := NULL;
  END;
  
  -- Check rate limiting
  rate_check := public.check_partner_application_rate_limit(
    ip_addr, 
    application_data->>'email'
  );
  
  IF NOT rate_check THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many attempts. Please try again later.'
    );
  END IF;
  
  -- Enhanced validation
  IF char_length(TRIM(application_data->>'company_name')) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Company name is required');
  END IF;
  
  IF char_length(TRIM(application_data->>'contact_name')) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Contact name is required');
  END IF;
  
  IF NOT (application_data->>'email' ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RETURN json_build_object('success', false, 'error', 'Valid email is required');
  END IF;
  
  -- Prevent common spam patterns
  IF (application_data->>'company_name') ~* '(test|spam|fake|admin|root|example)' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid company name');
  END IF;
  
  IF (application_data->>'email') ~* '@(test\.com|fake\.com|spam\.com|tempmail\.com|10minutemail\.com|guerrillamail\.com|mailinator\.com|throwaway\.email)' THEN
    RETURN json_build_object('success', false, 'error', 'Please use a business email address');
  END IF;
  
  -- Insert the application
  INSERT INTO public.partner_applications (
    company_name,
    contact_name,
    email,
    phone,
    website,
    partnership_type,
    message,
    status
  ) VALUES (
    TRIM(application_data->>'company_name'),
    TRIM(application_data->>'contact_name'),
    LOWER(TRIM(application_data->>'email')),
    NULLIF(TRIM(application_data->>'phone'), ''),
    NULLIF(TRIM(application_data->>'website'), ''),
    application_data->>'partnership_type',
    NULLIF(TRIM(application_data->>'message'), ''),
    'pending'
  ) RETURNING id INTO app_id;
  
  -- Log successful submission for security monitoring
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message)
  VALUES (
    'partner_application_received',
    'email',
    'cleyber.silva@live.com',
    'New partnership application from: ' || (application_data->>'company_name') || ' (' || (application_data->>'email') || ')'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Partnership application submitted successfully',
    'application_id', app_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unable to process application. Please try again.'
    );
END;
$$;