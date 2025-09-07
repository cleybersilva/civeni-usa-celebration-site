-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create or replace the create_admin_user function with proper password hashing
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get current user from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if calling user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin privileges required');
  END IF;
  
  -- Check if email already exists
  IF EXISTS(SELECT 1 FROM admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Create new user with proper password hashing
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

-- Create or replace the update_admin_user_type function
CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_admin BOOLEAN;
  target_email TEXT;
BEGIN
  -- Get current user from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if calling user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin privileges required');
  END IF;
  
  -- Get email of user to be updated
  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  
  -- Prevent changing the main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot modify the main admin root');
  END IF;
  
  -- Update user type
  UPDATE admin_users 
  SET user_type = new_user_type, 
      is_admin_root = CASE WHEN new_user_type = 'admin_root' THEN true ELSE false END,
      updated_at = now()
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

-- Create or replace the update_admin_user_password function
CREATE OR REPLACE FUNCTION public.update_admin_user_password(user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_admin BOOLEAN;
  target_email TEXT;
BEGIN
  -- Get current user from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if calling user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin privileges required');
  END IF;
  
  -- Get email of user to be updated
  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  
  -- Prevent changing password of main admin root
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot change password of main admin root');
  END IF;
  
  -- Update password with proper hashing
  UPDATE admin_users 
  SET password_hash = crypt(new_password, gen_salt('bf')), 
      updated_at = now()
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

-- Create or replace the delete_admin_user function
CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Get current user from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if calling user is admin_root (only admin_root can delete users)
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM admin_users 
  WHERE email = calling_user_email;
  
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin_root privileges required');
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

-- Create or replace the list_admin_users function
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  user_type admin_user_type,
  is_admin_root boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get current user from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if calling user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Return all admin users
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    au.user_type,
    au.is_admin_root,
    au.created_at
  FROM admin_users au
  ORDER BY au.created_at DESC;
END;
$$;