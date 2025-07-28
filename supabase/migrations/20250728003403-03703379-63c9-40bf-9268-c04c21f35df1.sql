-- Create a simpler login function for troubleshooting
CREATE OR REPLACE FUNCTION public.simple_admin_login(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- Simple password verification using crypt function
  SELECT id, email, user_type INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email;
  
  -- Check if user exists
  IF user_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
  -- Check password using crypt
  SELECT id, email, user_type INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
  
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
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro: ' || SQLERRM);
END;
$function$;