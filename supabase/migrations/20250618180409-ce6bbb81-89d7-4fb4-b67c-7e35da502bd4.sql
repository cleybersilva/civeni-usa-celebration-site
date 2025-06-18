
-- Função para criar novos usuários administrativos (apenas admin_root pode usar)
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
BEGIN
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode criar usuários
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode criar usuários');
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

-- Função para listar usuários (apenas admin_root)
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  user_type admin_user_type,
  is_admin_root BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, admin_users.email, admin_users.user_type, admin_users.is_admin_root, admin_users.created_at
  FROM public.admin_users
  ORDER BY created_at DESC;
$$;

-- Função para deletar usuário (apenas admin_root)
CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_email TEXT;
BEGIN
  -- Obter email do usuário a ser deletado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir deletar o admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível deletar o admin root principal');
  END IF;
  
  -- Deletar o usuário
  DELETE FROM public.admin_users WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Usuário deletado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
