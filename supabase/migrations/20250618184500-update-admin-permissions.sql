
-- Update create_admin_user function to allow Admin users
CREATE OR REPLACE FUNCTION public.create_admin_user(
  user_email TEXT,
  user_password TEXT,
  user_type admin_user_type DEFAULT 'viewer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  calling_user_email TEXT;
  is_root BOOLEAN;
  is_admin BOOLEAN;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root ou admin
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  SELECT COALESCE(user_type = 'admin', false) INTO is_admin 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root e admin podem criar usuários
  IF NOT (is_root OR is_admin) THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root e admin podem criar usuários');
  END IF;
  
  -- Verificar se o email já existe
  IF EXISTS(SELECT 1 FROM public.admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email já cadastrado');
  END IF;
  
  -- Criar o novo usuário
  INSERT INTO public.admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    user_type,
    CASE WHEN user_type = 'admin_root' THEN true ELSE false END
  );
  
  RETURN json_build_object('success', true, 'message', 'Usuário criado com sucesso');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update update_admin_user_type function to allow Admin users
CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  is_admin BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root ou admin
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  SELECT COALESCE(user_type = 'admin', false) INTO is_admin 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root e admin podem atualizar usuários
  IF NOT (is_root OR is_admin) THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root e admin podem atualizar usuários');
  END IF;
  
  -- Obter email do usuário a ser atualizado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir alterar o admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível alterar o admin root principal');
  END IF;
  
  -- Atualizar o tipo do usuário
  UPDATE public.admin_users 
  SET user_type = new_user_type, updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Usuário atualizado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
