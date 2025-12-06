-- Functions for managing manual works per presentation room

CREATE OR REPLACE FUNCTION public.admin_upsert_room_work(
  work_data jsonb,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  result_row salas_apresentacao_trabalhos%ROWTYPE;
  v_id uuid;
BEGIN
  -- Validate and set current user for RLS
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  -- Ensure caller is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  v_id := COALESCE((work_data->>'id')::uuid, gen_random_uuid());

  INSERT INTO salas_apresentacao_trabalhos AS w (
    id,
    sala_id,
    titulo_apresentacao,
    autores,
    ordem
  ) VALUES (
    v_id,
    (work_data->>'sala_id')::uuid,
    work_data->>'titulo_apresentacao',
    work_data->>'autores',
    NULLIF(work_data->>'ordem','')::integer
  )
  ON CONFLICT (id) DO UPDATE
    SET
      sala_id = EXCLUDED.sala_id,
      titulo_apresentacao = EXCLUDED.titulo_apresentacao,
      autores = EXCLUDED.autores,
      ordem = EXCLUDED.ordem,
      updated_at = now()
  RETURNING * INTO result_row;

  RETURN to_json(result_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_room_work(
  work_id uuid,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  affected_rows integer;
BEGIN
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  DELETE FROM salas_apresentacao_trabalhos WHERE id = work_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Work deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Work not found');
  END IF;
END;
$$;