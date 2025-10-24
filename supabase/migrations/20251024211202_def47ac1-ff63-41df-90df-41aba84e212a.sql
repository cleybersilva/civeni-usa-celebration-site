-- Fix the ambiguous column reference in list_admin_users_secure function
CREATE OR REPLACE FUNCTION public.list_admin_users_secure(user_email text, session_token uuid)
 RETURNS TABLE(user_id uuid, email text, user_type admin_user_type, is_admin_root boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  session_ok boolean;
  allowed boolean;
BEGIN
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  SELECT is_current_user_admin() INTO allowed;
  IF NOT COALESCE(allowed, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    admin_users.id as user_id, 
    admin_users.email, 
    admin_users.user_type, 
    admin_users.is_admin_root, 
    admin_users.created_at
  FROM admin_users
  ORDER BY admin_users.created_at DESC;
END;
$function$;