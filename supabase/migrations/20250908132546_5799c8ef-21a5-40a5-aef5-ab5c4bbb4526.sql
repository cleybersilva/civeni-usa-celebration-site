-- Secure admin functions with session-aware access control
CREATE OR REPLACE FUNCTION public.list_admin_users_secure(user_email text, session_token uuid)
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
  SELECT id, email, user_type, is_admin_root, created_at
  FROM admin_users
  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_user_secure(user_email text, user_password text, user_type admin_user_type DEFAULT 'viewer'::admin_user_type, admin_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  session_ok boolean;
  is_admin boolean;
  is_root boolean;
BEGIN
  SELECT set_current_user_email_secure(admin_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  SELECT is_current_user_admin() INTO is_admin;
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  SELECT is_admin_root_user(admin_email) INTO is_root;
  IF user_type = 'admin_root' AND NOT COALESCE(is_root, false) THEN
    RETURN json_build_object('success', false, 'error', 'Apenas Admin Root pode criar Admin Root');
  END IF;

  IF EXISTS(SELECT 1 FROM admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email já está registrado');
  END IF;

  INSERT INTO admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    user_type,
    CASE WHEN user_type = 'admin_root' THEN true ELSE false END
  );

  RETURN json_build_object('success', true, 'message', 'Usuário criado com sucesso');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_user_type_secure(user_id uuid, new_user_type admin_user_type, admin_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_ok boolean;
  is_admin boolean;
  is_root boolean;
  target_email text;
BEGIN
  SELECT set_current_user_email_secure(admin_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  SELECT is_current_user_admin() INTO is_admin;
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  SELECT is_admin_root_user(admin_email) INTO is_root;
  IF new_user_type = 'admin_root' AND NOT COALESCE(is_root, false) THEN
    RETURN json_build_object('success', false, 'error', 'Apenas Admin Root pode promover para Admin Root');
  END IF;

  SELECT email INTO target_email FROM admin_users WHERE id = user_id;
  IF target_email = 'cleyber.silva@live.com' AND NOT COALESCE(is_root, false) THEN
    RETURN json_build_object('success', false, 'error', 'Apenas Admin Root pode alterar o Admin Root principal');
  END IF;

  UPDATE admin_users
  SET 
    user_type = new_user_type,
    is_admin_root = CASE WHEN new_user_type = 'admin_root' THEN true ELSE false END,
    updated_at = now()
  WHERE id = user_id;

  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Tipo de usuário atualizado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_user_password_secure(user_id uuid, new_password text, admin_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  session_ok boolean;
  is_admin boolean;
BEGIN
  SELECT set_current_user_email_secure(admin_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  SELECT is_current_user_admin() INTO is_admin;
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  UPDATE admin_users
  SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id;

  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Senha atualizada com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
END;
$$;