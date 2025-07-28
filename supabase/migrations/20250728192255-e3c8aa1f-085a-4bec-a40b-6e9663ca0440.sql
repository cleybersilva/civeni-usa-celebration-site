-- Fix all functions missing SET search_path
CREATE OR REPLACE FUNCTION public.verify_admin_login(user_email text, user_password text)
 RETURNS TABLE(user_id uuid, email text, user_type admin_user_type)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, admin_users.email, admin_users.user_type
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin_root FROM public.admin_users WHERE email = user_email),
    FALSE
  );
$function$;

CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type DEFAULT 'viewer'::admin_user_type)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.list_admin_users()
 RETURNS TABLE(user_id uuid, email text, user_type admin_user_type, is_admin_root boolean, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, admin_users.email, admin_users.user_type, admin_users.is_admin_root, admin_users.created_at
  FROM public.admin_users
  ORDER BY created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode atualizar usuários
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode atualizar usuários');
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
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;