-- Fix list_admin_users function to handle RLS properly
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(user_id uuid, email text, user_type admin_user_type, is_admin_root boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = calling_user_email;
  
  -- Only allow admin users to list users
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Return all admin users
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
$$;

-- Create secure admin user management functions
CREATE OR REPLACE FUNCTION public.create_admin_user_secure(user_email text, user_password text, user_type admin_user_type, admin_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  is_admin BOOLEAN;
BEGIN
  -- Validate session
  SELECT set_current_user_email_secure(admin_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;
  
  -- Check if user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = admin_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Check if email already exists
  IF EXISTS(SELECT 1 FROM admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Create new user
  INSERT INTO admin_users (email, password_hash, user_type, is_admin_root)
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

-- Update/Delete functions to work with session tokens
CREATE OR REPLACE FUNCTION public.update_admin_user_type_secure(user_id uuid, new_user_type admin_user_type, admin_email text, session_token uuid)
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
  
  -- Check if user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = admin_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
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
$$;

CREATE OR REPLACE FUNCTION public.update_admin_user_password_secure(user_id uuid, new_password text, admin_email text, session_token uuid)
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
  
  -- Check if user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = admin_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
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
$$;