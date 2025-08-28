-- Database function hygiene: Add missing SET search_path TO 'public' to SECURITY DEFINER functions

-- Update admin login function
CREATE OR REPLACE FUNCTION public.verify_admin_login_secure(user_email text, user_password text, user_ip text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  failed_attempts INTEGER;
  user_record RECORD;
  result JSON;
BEGIN
  -- Log the function call for debugging
  RAISE LOG 'verify_admin_login_secure called for email: %', user_email;
  
  -- Check for too many failed attempts in last 15 minutes
  BEGIN
    SELECT COUNT(*) INTO failed_attempts
    FROM login_attempts
    WHERE email = user_email
    AND success = false
    AND attempted_at > (now() - interval '15 minutes');
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error with login_attempts table, continue without rate limiting
    failed_attempts := 0;
    RAISE LOG 'Error checking login attempts: %', SQLERRM;
  END;
  
  -- Block if too many failed attempts
  IF failed_attempts >= 5 THEN
    BEGIN
      INSERT INTO login_attempts (email, ip_address, success)
      VALUES (user_email, user_ip, false);
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error inserting failed attempt: %', SQLERRM;
    END;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Muitas tentativas falharam. Tente novamente em 15 minutos.'
    );
  END IF;
  
  -- Verify credentials
  BEGIN
    SELECT id, email, user_type INTO user_record
    FROM admin_users
    WHERE admin_users.email = user_email 
    AND password_hash = crypt(user_password, password_hash);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error verifying credentials: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', 'Erro ao verificar credenciais');
  END;
  
  IF user_record.id IS NOT NULL THEN
    -- Log successful attempt
    BEGIN
      INSERT INTO login_attempts (email, ip_address, success)
      VALUES (user_email, user_ip, true);
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error inserting success attempt: %', SQLERRM;
      -- Continue even if logging fails
    END;
    
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'user_type', user_record.user_type
      )
    );
  ELSE
    -- Log failed attempt
    BEGIN
      INSERT INTO login_attempts (email, ip_address, success)
      VALUES (user_email, user_ip, false);
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error inserting failed attempt: %', SQLERRM;
    END;
    
    RETURN json_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Enhanced error logging
    RAISE LOG 'Critical error in verify_admin_login_secure: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    
    -- Try to log failed attempt even on error
    BEGIN
      INSERT INTO login_attempts (email, ip_address, success)
      VALUES (user_email, user_ip, false);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore logging errors
    END;
    
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;

-- Update admin session management functions
CREATE OR REPLACE FUNCTION public.set_current_user_email_secure(user_email text, session_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  session_valid BOOLEAN;
BEGIN
  -- Validate session token exists, matches email, and is not expired
  SELECT EXISTS(
    SELECT 1 FROM admin_sessions
    WHERE email = user_email 
    AND token = session_token 
    AND expires_at > now()
  ) INTO session_valid;
  
  IF session_valid THEN
    -- Set the current user email for RLS policies
    PERFORM set_config('app.current_user_email', user_email, false);
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

-- Update admin session cleanup to use shorter expiry (4 hours instead of 24)
CREATE OR REPLACE FUNCTION public.temp_admin_login_secure(user_email text, user_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  session_token UUID;
  failed_attempts INTEGER;
BEGIN
  -- Check for failed attempts in the last 15 minutes (rate limiting)
  SELECT COUNT(*) INTO failed_attempts
  FROM login_attempts
  WHERE email = user_email
  AND success = false
  AND attempted_at > (now() - interval '15 minutes');
  
  -- Block if too many failed attempts
  IF failed_attempts >= 5 THEN
    -- Log the blocked attempt
    INSERT INTO login_attempts (email, success)
    VALUES (user_email, false);
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Too many failed attempts. Please try again in 15 minutes.'
    );
  END IF;
  
  -- Verify user exists
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM admin_users
  WHERE admin_users.email = user_email;
  
  IF user_record.id IS NULL THEN
    -- Log failed attempt
    INSERT INTO login_attempts (email, success)
    VALUES (user_email, false);
    
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Check password
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = extensions.crypt(user_password, password_hash);
  
  IF user_record.id IS NOT NULL THEN
    -- Generate new session token
    session_token := gen_random_uuid();
    
    -- Clean up old sessions for this user
    DELETE FROM admin_sessions WHERE email = user_email;
    
    -- Create new session with shorter expiry (4 hours)
    INSERT INTO admin_sessions (email, token, expires_at)
    VALUES (user_email, session_token, now() + interval '4 hours');
    
    -- Log successful attempt
    INSERT INTO login_attempts (email, success)
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
    INSERT INTO login_attempts (email, success)
    VALUES (user_email, false);
    
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed attempt even on error
    BEGIN
      INSERT INTO login_attempts (email, success)
      VALUES (user_email, false);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore logging errors
    END;
    
    RETURN json_build_object('success', false, 'error', 'Internal server error');
END;
$function$;

-- Update other SECURITY DEFINER functions to ensure proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  IF user_email IS NULL OR user_email = '' THEN
    RETURN FALSE;
  END IF;
  
  SELECT 
    CASE 
      WHEN user_type IN ('admin', 'admin_root') OR is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE email = user_email;
  
  RETURN COALESCE(is_admin, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin_root FROM admin_users WHERE email = user_email),
    FALSE
  );
$function$;