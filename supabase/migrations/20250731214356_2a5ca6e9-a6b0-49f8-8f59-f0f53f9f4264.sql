-- Create function to update admin user password
CREATE OR REPLACE FUNCTION public.update_admin_user_password(user_id uuid, new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
  
  -- Só admin_root pode atualizar senhas
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode atualizar senhas');
  END IF;
  
  -- Obter email do usuário a ser atualizado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir alterar a senha do admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível alterar a senha do admin root principal');
  END IF;
  
  -- Atualizar a senha do usuário
  UPDATE public.admin_users 
  SET password_hash = crypt(new_password, gen_salt('bf')), updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Senha atualizada com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$