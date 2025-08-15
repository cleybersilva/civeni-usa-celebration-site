-- Fix remaining functions missing search_path

CREATE OR REPLACE FUNCTION public.verify_admin_login_secure(user_email text, user_password text, user_ip text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    FROM public.login_attempts
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
      INSERT INTO public.login_attempts (email, ip_address, success)
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
    FROM public.admin_users
    WHERE admin_users.email = user_email 
    AND password_hash = crypt(user_password, password_hash);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error verifying credentials: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', 'Erro ao verificar credenciais');
  END;
  
  IF user_record.id IS NOT NULL THEN
    -- Log successful attempt
    BEGIN
      INSERT INTO public.login_attempts (email, ip_address, success)
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
      INSERT INTO public.login_attempts (email, ip_address, success)
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
      INSERT INTO public.login_attempts (email, ip_address, success)
      VALUES (user_email, user_ip, false);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore logging errors
    END;
    
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;

CREATE OR REPLACE FUNCTION public.simple_admin_login(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- Simple password verification using crypt function
  SELECT id, email, user_type INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email;
  
  -- Check if user exists
  IF user_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
  -- Check password using crypt
  SELECT id, email, user_type INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
  
  IF user_record.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'user_type', user_record.user_type
      )
    );
  ELSE
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro: ' || SQLERRM);
END;
$function$;