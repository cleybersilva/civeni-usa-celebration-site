-- Phase 1 Security Fixes: Create secure admin session system

-- 1. Create admin_sessions table for secure token-based authentication
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(email, token)
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only allow admins to read their own sessions
CREATE POLICY "admin_sessions_admin_read_own" 
ON public.admin_sessions 
FOR SELECT 
USING (email = current_setting('app.current_user_email', true));

-- Only system can insert/update/delete sessions
CREATE POLICY "admin_sessions_system_only" 
ON public.admin_sessions 
FOR ALL 
USING (false);

-- 2. Create secure version of set_current_user_email
CREATE OR REPLACE FUNCTION public.set_current_user_email_secure(user_email text, session_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  session_valid BOOLEAN;
BEGIN
  -- Validate session token exists, matches email, and is not expired
  SELECT EXISTS(
    SELECT 1 FROM public.admin_sessions
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

-- 3. Update temp_admin_login to create secure sessions
CREATE OR REPLACE FUNCTION public.temp_admin_login_secure(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_record RECORD;
  session_token UUID;
BEGIN
  -- Verify credentials using existing logic
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email;
  
  IF user_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
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
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro: ' || SQLERRM);
END;
$function$;

-- 4. Revoke public access to the insecure function
REVOKE EXECUTE ON FUNCTION public.set_current_user_email FROM PUBLIC;

-- 5. Harden existing SECURITY DEFINER functions with proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
  FROM public.admin_users 
  WHERE email = user_email;
  
  RETURN COALESCE(is_admin, false);
END;
$function$;

-- 6. Clean up expired sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  DELETE FROM public.admin_sessions WHERE expires_at < now();
$function$;