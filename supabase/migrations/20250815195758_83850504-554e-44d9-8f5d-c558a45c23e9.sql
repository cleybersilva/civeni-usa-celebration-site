-- Fix remaining SECURITY DEFINER functions missing search_path

CREATE OR REPLACE FUNCTION public.get_current_admin_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN current_setting('app.current_user_email', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_permission(user_email text, permission_type text, resource text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    CASE 
      WHEN user_type = 'admin_root' THEN TRUE
      WHEN user_type = 'admin' AND resource IN ('banner', 'contador', 'copyright', 'inscricoes', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos') THEN TRUE
      WHEN user_type = 'design' AND resource IN ('banner', 'palestrantes', 'videos') THEN TRUE
      WHEN user_type = 'editor' AND resource IN ('contador', 'inscricoes', 'local', 'online', 'parceiros', 'textos') THEN TRUE
      ELSE FALSE
    END
  FROM public.admin_users
  WHERE email = user_email;
$function$;

CREATE OR REPLACE FUNCTION public.request_password_reset(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE email = user_email
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin_root FROM public.admin_users WHERE email = user_email),
    FALSE
  );
$function$;