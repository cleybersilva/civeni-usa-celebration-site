-- Final pass to fix all remaining SECURITY DEFINER functions
-- Complete security definer function audit and fixes

-- Fix remaining functions that still need SET search_path

-- Fix delete_admin_user function
CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_email TEXT;
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Verify caller is admin_root
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM admin_users 
  WHERE email = calling_user_email;
  
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Get email of user to be deleted
  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  
  -- Prevent deleting the main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete the main admin root');
  END IF;
  
  -- Delete the user
  DELETE FROM admin_users WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'User deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Internal server error');
END;
$function$;

-- Fix list_admin_users function
CREATE OR REPLACE FUNCTION public.list_admin_users()
 RETURNS TABLE(user_id uuid, email text, user_type admin_user_type, is_admin_root boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Verify caller is admin_root
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM admin_users 
  WHERE email = calling_user_email;
  
  IF NOT is_root THEN
    RAISE EXCEPTION 'Access denied: admin_root privileges required';
  END IF;
  
  RETURN QUERY
  SELECT id, admin_users.email, admin_users.user_type, admin_users.is_admin_root, admin_users.created_at
  FROM admin_users
  ORDER BY created_at DESC;
END;
$function$;

-- Fix create_admin_user function  
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type DEFAULT 'viewer'::admin_user_type)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Verify caller is admin_root
  calling_user_email := current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM admin_users 
  WHERE email = calling_user_email;
  
  -- Only admin_root can create users
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Check if email already exists
  IF EXISTS(SELECT 1 FROM admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Create new user
  INSERT INTO admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    user_type,
    CASE WHEN user_type = 'admin_root' THEN true ELSE false END
  );
  
  RETURN json_build_object('success', true, 'message', 'User created successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix check_partner_application_rate_limit function
CREATE OR REPLACE FUNCTION public.check_partner_application_rate_limit(user_ip inet, user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  attempt_record RECORD;
  current_time TIMESTAMP WITH TIME ZONE := now();
  rate_limit_window INTERVAL := '1 hour';
  max_attempts INTEGER := 3;
  block_duration INTERVAL := '24 hours';
BEGIN
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM partner_application_attempts 
  WHERE first_attempt_at < current_time - '24 hours'::interval;
  
  -- Check for existing attempts by IP or email
  SELECT * INTO attempt_record
  FROM partner_application_attempts
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
      UPDATE partner_application_attempts
      SET blocked_until = current_time + block_duration,
          last_attempt_at = current_time
      WHERE id = attempt_record.id;
      RETURN false;
    ELSE
      -- Increment attempt count
      UPDATE partner_application_attempts
      SET attempt_count = attempt_count + 1,
          last_attempt_at = current_time
      WHERE id = attempt_record.id;
      RETURN true;
    END IF;
  ELSE
    -- First attempt, create new record
    INSERT INTO partner_application_attempts (ip_address, email, attempt_count)
    VALUES (user_ip, user_email, 1);
    RETURN true;
  END IF;
END;
$function$;

-- Fix submit_partner_application_secure function
CREATE OR REPLACE FUNCTION public.submit_partner_application_secure(application_data jsonb, user_ip text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  rate_check := check_partner_application_rate_limit(
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
  INSERT INTO partner_applications (
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
  INSERT INTO alert_logs (alert_type, recipient_type, recipient, message)
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
$function$;