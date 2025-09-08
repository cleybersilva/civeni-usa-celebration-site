-- Create the missing list_admin_users RPC used by the UI
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  user_type admin_user_type,
  is_admin_root boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean;
BEGIN
  -- Only allow admins to list users
  SELECT is_current_user_admin() INTO allowed;
  IF NOT COALESCE(allowed, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT id, email, user_type, is_admin_root, created_at
  FROM admin_users
  ORDER BY created_at DESC;
END;
$$;