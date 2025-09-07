-- Create the missing delete_admin_user_secure function
CREATE OR REPLACE FUNCTION public.delete_admin_user_secure(user_id uuid, admin_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  is_admin BOOLEAN;
  target_email TEXT;
BEGIN
  -- Validate session
  SELECT set_current_user_email_secure(admin_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;
  
  -- Check if user is admin root (only admin root can delete users)
  SELECT 
    CASE 
      WHEN admin_users.user_type = 'admin_root' OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = admin_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin root privileges required';
  END IF;
  
  -- Get email of user to be deleted
  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  
  -- Prevent deleting the main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete the main admin root');
  END IF;
  
  -- Delete user
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
$$;