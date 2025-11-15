-- Create security definer functions for presentation rooms management

-- Function to upsert (create/update) presentation room
CREATE OR REPLACE FUNCTION public.admin_upsert_presentation_room(
  room_data jsonb,
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
  result_row presentation_rooms%ROWTYPE;
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

  IF room_data ? 'id' AND NULLIF(room_data->>'id','') IS NOT NULL THEN
    -- Update existing room
    UPDATE presentation_rooms
    SET 
      nome_sala = COALESCE(room_data->>'nome_sala', nome_sala),
      descricao_sala = COALESCE(NULLIF(room_data->>'descricao_sala',''), descricao_sala),
      meet_link = COALESCE(room_data->>'meet_link', meet_link),
      data_apresentacao = COALESCE((room_data->>'data_apresentacao')::date, data_apresentacao),
      horario_inicio_sala = COALESCE((room_data->>'horario_inicio_sala')::time, horario_inicio_sala),
      horario_fim_sala = COALESCE((room_data->>'horario_fim_sala')::time, horario_fim_sala),
      status = COALESCE(room_data->>'status', status),
      responsavel_sala = COALESCE(NULLIF(room_data->>'responsavel_sala',''), responsavel_sala),
      updated_at = now()
    WHERE id = (room_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new room
    INSERT INTO presentation_rooms (
      nome_sala,
      descricao_sala,
      meet_link,
      data_apresentacao,
      horario_inicio_sala,
      horario_fim_sala,
      status,
      responsavel_sala
    ) VALUES (
      room_data->>'nome_sala',
      NULLIF(room_data->>'descricao_sala',''),
      room_data->>'meet_link',
      (room_data->>'data_apresentacao')::date,
      (room_data->>'horario_inicio_sala')::time,
      (room_data->>'horario_fim_sala')::time,
      COALESCE(room_data->>'status', 'rascunho'),
      NULLIF(room_data->>'responsavel_sala','')
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;

-- Function to delete presentation room
CREATE OR REPLACE FUNCTION public.admin_delete_presentation_room(
  room_id uuid,
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

  DELETE FROM presentation_rooms WHERE id = room_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Room deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;
END;
$$;

-- Function to upsert presentation room assignment
CREATE OR REPLACE FUNCTION public.admin_upsert_presentation_assignment(
  assignment_data jsonb,
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
  result_row presentation_room_assignments%ROWTYPE;
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

  -- Insert new assignment
  INSERT INTO presentation_room_assignments (
    room_id,
    submission_id,
    ordem_apresentacao,
    inicio_apresentacao,
    fim_apresentacao,
    observacoes
  ) VALUES (
    (assignment_data->>'room_id')::uuid,
    (assignment_data->>'submission_id')::uuid,
    (assignment_data->>'ordem_apresentacao')::integer,
    (assignment_data->>'inicio_apresentacao')::timestamptz,
    (assignment_data->>'fim_apresentacao')::timestamptz,
    NULLIF(assignment_data->>'observacoes','')
  ) RETURNING * INTO result_row;

  RETURN to_json(result_row);
END;
$$;

-- Function to delete presentation room assignment
CREATE OR REPLACE FUNCTION public.admin_delete_presentation_assignment(
  assignment_id uuid,
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

  DELETE FROM presentation_room_assignments WHERE id = assignment_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Assignment deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Assignment not found');
  END IF;
END;
$$;