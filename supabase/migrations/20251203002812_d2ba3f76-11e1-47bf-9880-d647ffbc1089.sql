-- Add explicit ordering column for presentation rooms
ALTER TABLE public.presentation_rooms
  ADD COLUMN IF NOT EXISTS ordem_sala integer;

-- Initialize ordem_sala for existing rooms based on current date/time/creation order
WITH ordered AS (
  SELECT 
    id,
    row_number() OVER (
      ORDER BY data_apresentacao ASC, horario_inicio_sala ASC, created_at ASC
    ) AS rn
  FROM public.presentation_rooms
)
UPDATE public.presentation_rooms pr
SET ordem_sala = o.rn
FROM ordered o
WHERE pr.id = o.id
  AND pr.ordem_sala IS NULL;

-- Ensure ordem_sala always has a value for new rows
ALTER TABLE public.presentation_rooms
  ALTER COLUMN ordem_sala SET DEFAULT 0;

-- Update admin_upsert_presentation_room to handle ordem_sala for create/update
CREATE OR REPLACE FUNCTION public.admin_upsert_presentation_room(
  room_data jsonb,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_ok boolean;
  result_row presentation_rooms%ROWTYPE;
  next_order integer;
BEGIN
  -- Validate session and admin access
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Calculate default next ordem_sala when needed
  SELECT COALESCE(MAX(ordem_sala), 0) + 1 INTO next_order FROM presentation_rooms;

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
      ordem_sala = COALESCE((room_data->>'ordem_sala')::int, ordem_sala),
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
      responsavel_sala,
      ordem_sala
    ) VALUES (
      room_data->>'nome_sala',
      NULLIF(room_data->>'descricao_sala',''),
      room_data->>'meet_link',
      (room_data->>'data_apresentacao')::date,
      (room_data->>'horario_inicio_sala')::time,
      (room_data->>'horario_fim_sala')::time,
      COALESCE(room_data->>'status', 'rascunho'),
      NULLIF(room_data->>'responsavel_sala',''),
      COALESCE((room_data->>'ordem_sala')::int, next_order)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$function$;

-- Optional: index to speed up ordering by ordem_sala
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_ordem_sala
  ON public.presentation_rooms(ordem_sala);
