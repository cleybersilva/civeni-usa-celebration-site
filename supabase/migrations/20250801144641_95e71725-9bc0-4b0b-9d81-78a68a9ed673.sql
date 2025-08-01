-- Corrigir a função temp_admin_login usando o namespace correto para crypt
CREATE OR REPLACE FUNCTION public.temp_admin_login(user_email text, user_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- Verificar se o usuário existe
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email;
  
  -- Se o usuário não existe, retornar erro
  IF user_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
  -- Verificar a senha usando crypt do namespace extensions
  SELECT id, email, user_type, is_admin_root INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = extensions.crypt(user_password, password_hash);
  
  -- Se a senha está correta, retornar sucesso
  IF user_record.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'user_type', user_record.user_type
      )
    );
  ELSE
    -- Senha incorreta
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro: ' || SQLERRM);
END;
$function$;