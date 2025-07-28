-- Enable RLS on hybrid_format_config table (currently disabled)
ALTER TABLE public.hybrid_format_config ENABLE ROW LEVEL SECURITY;

-- Add secure search path to functions that are missing it
CREATE OR REPLACE FUNCTION public.request_password_reset(user_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE email = user_email
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_permission(user_email text, permission_type text, resource text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, admin_users.email, admin_users.user_type
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin_root FROM public.admin_users WHERE email = user_email),
    FALSE
  );
$function$;