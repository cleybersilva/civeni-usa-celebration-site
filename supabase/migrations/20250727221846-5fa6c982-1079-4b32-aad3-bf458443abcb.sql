-- CRITICAL SECURITY FIXES

-- 1. Enable RLS on admin_users table (CRITICAL)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 3. Create restrictive policies for admin_users table
-- Only allow admins to read admin user data
CREATE POLICY "admin_users_select_policy" ON public.admin_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);

-- Only admin_root can insert new admin users (handled by function)
CREATE POLICY "admin_users_insert_policy" ON public.admin_users
FOR INSERT WITH CHECK (false); -- Controlled via functions only

-- Only admin_root can update admin users (handled by function) 
CREATE POLICY "admin_users_update_policy" ON public.admin_users
FOR UPDATE USING (false); -- Controlled via functions only

-- Only admin_root can delete admin users (handled by function)
CREATE POLICY "admin_users_delete_policy" ON public.admin_users
FOR DELETE USING (false); -- Controlled via functions only

-- 4. Create restrictive policies for partners table
CREATE POLICY "partners_public_read" ON public.partners
FOR SELECT USING (true);

CREATE POLICY "partners_admin_only" ON public.partners
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);

-- 5. Tighten event_registrations policies - remove overly permissive ALL policy
DROP POLICY IF EXISTS "Allow public insert on event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow public read on event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow public update on event_registrations" ON public.event_registrations;

-- Create more restrictive policies for event_registrations
CREATE POLICY "event_registrations_insert_policy" ON public.event_registrations
FOR INSERT WITH CHECK (true); -- Allow registrations from public

CREATE POLICY "event_registrations_read_admin" ON public.event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type IN ('admin', 'viewer', 'editor') OR au.is_admin_root = true)
  )
);

-- Only allow updates via functions with proper validation
CREATE POLICY "event_registrations_update_functions" ON public.event_registrations
FOR UPDATE USING (false); -- Updates controlled via functions only

-- 6. Tighten alert_logs policies
DROP POLICY IF EXISTS "Allow public access on alert_logs" ON public.alert_logs;

CREATE POLICY "alert_logs_admin_read" ON public.alert_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type IN ('admin', 'viewer') OR au.is_admin_root = true)
  )
);

CREATE POLICY "alert_logs_system_insert" ON public.alert_logs
FOR INSERT WITH CHECK (true); -- Allow system to insert alerts

-- 7. Secure database functions by setting search_path
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  coupon_record RECORD;
  result JSON;
BEGIN
  SELECT * INTO coupon_record
  FROM public.coupon_codes
  WHERE code = coupon_code
  AND is_active = true
  AND (usage_limit IS NULL OR used_count < usage_limit);
  
  IF coupon_record.id IS NOT NULL THEN
    result := json_build_object(
      'is_valid', true,
      'coupon_id', coupon_record.id,
      'category_id', coupon_record.category_id
    );
  ELSE
    result := json_build_object('is_valid', false);
  END IF;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_admin_login(user_email text, user_password text)
RETURNS TABLE(user_id uuid, email text, user_type admin_user_type)
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT id, admin_users.email, admin_users.user_type
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT COALESCE(
    (SELECT is_admin_root FROM public.admin_users WHERE email = user_email),
    FALSE
  );
$function$;

CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type DEFAULT 'viewer'::admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  result JSON;
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Enhanced password validation
  IF LENGTH(user_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Senha deve ter pelo menos 8 caracteres');
  END IF;
  
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode criar usuários
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode criar usuários');
  END IF;
  
  -- Verificar se o email já existe
  IF EXISTS(SELECT 1 FROM public.admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email já cadastrado');
  END IF;
  
  -- Criar o novo usuário
  INSERT INTO public.admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    user_type,
    CASE WHEN user_type = 'admin_root' THEN true ELSE false END
  );
  
  RETURN json_build_object('success', true, 'message', 'Usuário criado com sucesso');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;

-- 8. Add login attempt tracking table for security
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for login_attempts (admin only)
CREATE POLICY "login_attempts_admin_only" ON public.login_attempts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempted_at);

-- 9. Enhanced admin login function with rate limiting
CREATE OR REPLACE FUNCTION public.verify_admin_login_secure(user_email text, user_password text, user_ip text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  failed_attempts INTEGER;
  user_record RECORD;
  result JSON;
BEGIN
  -- Check for too many failed attempts in last 15 minutes
  SELECT COUNT(*) INTO failed_attempts
  FROM public.login_attempts
  WHERE email = user_email
  AND success = false
  AND attempted_at > (now() - interval '15 minutes');
  
  -- Block if too many failed attempts
  IF failed_attempts >= 5 THEN
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, false);
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Muitas tentativas falharam. Tente novamente em 15 minutos.'
    );
  END IF;
  
  -- Verify credentials
  SELECT id, email, user_type INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
  
  IF user_record.id IS NOT NULL THEN
    -- Log successful attempt
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, true);
    
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
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, false);
    
    RETURN json_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed attempt on error
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, false);
    
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;