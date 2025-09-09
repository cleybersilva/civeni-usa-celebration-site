-- Function to check if user has admin root privileges
CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE email = user_email 
    AND (user_type = 'admin_root' OR is_admin_root = true)
  );
END;
$$;