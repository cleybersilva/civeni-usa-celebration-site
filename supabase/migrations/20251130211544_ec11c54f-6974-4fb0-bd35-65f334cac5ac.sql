-- Function to create admin user with proper password hashing
CREATE OR REPLACE FUNCTION public.create_admin_user_with_crypt(
  p_email text,
  p_password text,
  p_user_type admin_user_type
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Insert user with hashed password
  INSERT INTO admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    p_user_type,
    CASE WHEN p_user_type = 'admin_root' THEN true ELSE false END
  );
  
  RETURN json_build_object('success', true, 'message', 'Usuário criado com sucesso');
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Email já está registrado');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;