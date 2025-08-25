-- Comprehensive Security Fixes Migration

-- 1. Fix search_path warnings and add authorization to sensitive RPCs

-- Secure delete_admin_user function
CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_email TEXT;
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Verify caller is admin_root
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Get email of user to be deleted
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Prevent deleting the main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete the main admin root');
  END IF;
  
  -- Delete the user
  DELETE FROM public.admin_users WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'User deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Internal server error');
END;
$$;

-- Secure list_admin_users function
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(user_id uuid, email text, user_type admin_user_type, is_admin_root boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Verify caller is admin_root
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  IF NOT is_root THEN
    RAISE EXCEPTION 'Access denied: admin_root privileges required';
  END IF;
  
  RETURN QUERY
  SELECT id, admin_users.email, admin_users.user_type, admin_users.is_admin_root, admin_users.created_at
  FROM public.admin_users
  ORDER BY created_at DESC;
END;
$$;

-- Secure generate_daily_report function
CREATE OR REPLACE FUNCTION public.generate_daily_report(report_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  registration_count INTEGER;
  total_revenue DECIMAL(10,2);
  report_data JSON;
  calling_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Verify caller is admin
  SELECT 
    CASE 
      WHEN user_type IN ('admin', 'admin_root') OR is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin privileges required');
  END IF;
  
  -- Count ALL registrations up to the specified date
  SELECT COUNT(*) INTO registration_count
  FROM public.event_registrations
  WHERE DATE(created_at) <= report_date;
  
  -- Calculate total revenue from confirmed payments up to the date
  SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
  FROM public.event_registrations
  WHERE DATE(created_at) <= report_date
  AND payment_status = 'completed';
  
  -- If no confirmed payments, consider potential value from pending ones
  IF total_revenue = 0 THEN
    SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
    FROM public.event_registrations
    WHERE DATE(created_at) <= report_date
    AND payment_status = 'pending';
  END IF;
  
  -- Build report
  report_data := json_build_object(
    'date', report_date,
    'total_registrations', registration_count,
    'total_revenue', total_revenue,
    'generated_at', NOW()
  );
  
  -- Insert alert logs for daily report
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'email',
    'cleyber.silva@live.com',
    'Daily report - Registrations: ' || registration_count || ' | Revenue: R$ ' || total_revenue,
    'sent'
  );
  
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'sms',
    '(83) 98832-9018',
    'Report ' || report_date || ': ' || registration_count || ' registrations, R$ ' || total_revenue,
    'sent'
  );
  
  RETURN report_data;
END;
$$;

-- 2. Add rate limiting to temp_admin_login_secure
CREATE OR REPLACE FUNCTION public.temp_admin_login_secure(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  session_token UUID;
  failed_attempts INTEGER;
BEGIN
  -- Check for failed attempts in the last 15 minutes (rate limiting)
  SELECT COUNT(*) INTO failed_attempts
  FROM public.login_attempts
  WHERE email = user_email
  AND success = false
  AND attempted_at > (now() - interval '15 minutes');
  
  -- Block if too many failed attempts
  IF failed_attempts >= 5 THEN
    -- Log the blocked attempt
    INSERT INTO public.login_attempts (email, success)
    VALUES (user_email, false);
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Too many failed attempts. Please try again in 15 minutes.'
    );
  END IF;
  
  -- Verify user exists
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email;
  
  IF user_record.id IS NULL THEN
    -- Log failed attempt
    INSERT INTO public.login_attempts (email, success)
    VALUES (user_email, false);
    
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Check password
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = extensions.crypt(user_password, password_hash);
  
  IF user_record.id IS NOT NULL THEN
    -- Generate new session token
    session_token := gen_random_uuid();
    
    -- Clean up old sessions for this user
    DELETE FROM public.admin_sessions WHERE email = user_email;
    
    -- Create new session
    INSERT INTO public.admin_sessions (email, token, expires_at)
    VALUES (user_email, session_token, now() + interval '24 hours');
    
    -- Log successful attempt
    INSERT INTO public.login_attempts (email, success)
    VALUES (user_email, true);
    
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'user_type', user_record.user_type
      ),
      'session_token', session_token
    );
  ELSE
    -- Log failed attempt
    INSERT INTO public.login_attempts (email, success)
    VALUES (user_email, false);
    
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed attempt even on error
    BEGIN
      INSERT INTO public.login_attempts (email, success)
      VALUES (user_email, false);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore logging errors
    END;
    
    RETURN json_build_object('success', false, 'error', 'Internal server error');
END;
$$;

-- 3. Drop legacy/insecure login functions
DROP FUNCTION IF EXISTS public.temp_admin_login(text, text);
DROP FUNCTION IF EXISTS public.simple_admin_login(text, text);
DROP FUNCTION IF EXISTS public.verify_admin_login(text, text);

-- 4. Secure request_password_reset to prevent user enumeration
CREATE OR REPLACE FUNCTION public.request_password_reset(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Always return true to prevent user enumeration
  -- But log the actual result for admin monitoring
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE email = user_email
  ) INTO user_exists;
  
  -- Log password reset attempts for security monitoring
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message)
  VALUES (
    'password_reset_attempt',
    'email',
    'cleyber.silva@live.com',
    'Password reset requested for: ' || user_email || ' (exists: ' || user_exists || ')'
  );
  
  -- Always return true to prevent enumeration
  RETURN true;
END;
$$;

-- 5. Fix other functions with search_path warnings
CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verify caller is admin_root
  calling_user_email := current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Only admin_root can update users
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Get email of user to be updated
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Prevent changing the main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot modify the main admin root');
  END IF;
  
  -- Update user type
  UPDATE public.admin_users 
  SET user_type = new_user_type, updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'User updated successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Internal server error');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_user_password(user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verify caller is admin_root
  calling_user_email := current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Only admin_root can update passwords
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Get email of user to be updated
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Prevent changing password of main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot change password of main admin root');
  END IF;
  
  -- Update password
  UPDATE public.admin_users 
  SET password_hash = crypt(new_password, gen_salt('bf')), updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Password updated successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Internal server error');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type DEFAULT 'viewer'::admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Verify caller is admin_root
  calling_user_email := current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Only admin_root can create users
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Check if email already exists
  IF EXISTS(SELECT 1 FROM public.admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Create new user
  INSERT INTO public.admin_users (email, password_hash, user_type, is_admin_root)
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
$$;

-- 6. Add security monitoring indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
ON public.login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires 
ON public.admin_sessions(expires_at);

-- 7. Create a function to clean up old login attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.login_attempts 
  WHERE attempted_at < (now() - interval '24 hours');
$$;