-- Criar função temporária de login que verifica apenas email e senha específica para admin root
CREATE OR REPLACE FUNCTION public.temp_admin_login(user_email text, user_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- Para o admin root principal, permitir login com senha específica temporariamente
  IF user_email = 'cleyber.silva@live.com' AND user_password = '123456' THEN
    SELECT id, email, user_type, is_admin_root INTO user_record
    FROM public.admin_users
    WHERE admin_users.email = user_email;
    
    IF user_record.id IS NOT NULL THEN
      RETURN json_build_object(
        'success', true,
        'user', json_build_object(
          'user_id', user_record.id,
          'email', user_record.email,
          'user_type', user_record.user_type
        )
      );
    END IF;
  END IF;
  
  -- Para outros usuários, retornar erro até configurarmos senhas adequadas
  RETURN json_build_object('success', false, 'error', 'Acesso temporariamente restrito. Entre em contato com o administrador.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro: ' || SQLERRM);
END;
$function$;