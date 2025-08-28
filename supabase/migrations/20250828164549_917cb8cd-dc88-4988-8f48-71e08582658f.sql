-- Fix all remaining SECURITY DEFINER functions to have proper search_path
-- This addresses the "Function Search Path Mutable" security warning

-- Update remaining functions that might be missing SET search_path TO 'public'

-- Fix revoke_admin_session function
CREATE OR REPLACE FUNCTION public.revoke_admin_session(user_email text, session_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete the matching session
  DELETE FROM admin_sessions 
  WHERE email = user_email AND token = session_token;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Session revoked successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Session not found');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Error revoking session');
END;
$function$;

-- Fix get_current_admin_user_email function
CREATE OR REPLACE FUNCTION public.get_current_admin_user_email()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN current_setting('app.current_user_email', true);
END;
$function$;

-- Fix cleanup_expired_sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DELETE FROM admin_sessions WHERE expires_at < now();
$function$;

-- Fix cleanup_old_login_attempts function
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DELETE FROM login_attempts 
  WHERE attempted_at < (now() - interval '24 hours');
$function$;

-- Fix check_user_permission function
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
  FROM admin_users
  WHERE email = user_email;
$function$;

-- Fix update_admin_user_type function
CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verify caller is admin_root
  calling_user_email := current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM admin_users 
  WHERE email = calling_user_email;
  
  -- Only admin_root can update users
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Get email of user to be updated
  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  
  -- Prevent changing the main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot modify the main admin root');
  END IF;
  
  -- Update user type
  UPDATE admin_users 
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
$function$;

-- Fix update_admin_user_password function
CREATE OR REPLACE FUNCTION public.update_admin_user_password(user_id uuid, new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verify caller is admin_root
  calling_user_email := current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM admin_users 
  WHERE email = calling_user_email;
  
  -- Only admin_root can update passwords
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
  END IF;
  
  -- Get email of user to be updated
  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  
  -- Prevent changing password of main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot change password of main admin root');
  END IF;
  
  -- Update password
  UPDATE admin_users 
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
$function$;

-- Fix other security definer functions
CREATE OR REPLACE FUNCTION public.request_password_reset(user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Always return true to prevent user enumeration
  -- But log the actual result for admin monitoring
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE email = user_email
  ) INTO user_exists;
  
  -- Log password reset attempts for security monitoring
  INSERT INTO alert_logs (alert_type, recipient_type, recipient, message)
  VALUES (
    'password_reset_attempt',
    'email',
    'cleyber.silva@live.com',
    'Password reset requested for: ' || user_email || ' (exists: ' || user_exists || ')'
  );
  
  -- Always return true to prevent enumeration
  RETURN true;
END;
$function$;

-- Fix all remaining functions with proper search_path
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
  FROM coupon_codes
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