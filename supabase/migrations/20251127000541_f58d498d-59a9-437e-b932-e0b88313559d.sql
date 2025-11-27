-- Fix type mismatch in admin_delete_civeni_session by casting session_token to uuid
CREATE OR REPLACE FUNCTION public.admin_delete_civeni_session(session_id uuid, user_email text, session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Verificar se o usuário é admin e o token é válido
  SELECT au.id INTO v_admin_id
  FROM admin_users au
  JOIN admin_sessions ases ON ases.email = au.email
  WHERE au.email = user_email
    AND ases.token = session_token::uuid
    AND ases.expires_at > now();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Sessão de administrador inválida ou expirada';
  END IF;

  -- Deletar a sessão
  DELETE FROM civeni_program_sessions
  WHERE id = session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;
END;
$function$;