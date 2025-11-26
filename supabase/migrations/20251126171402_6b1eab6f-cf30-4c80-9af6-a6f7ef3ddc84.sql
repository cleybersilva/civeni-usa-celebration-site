-- Admin upsert function for CIVENI program sessions
CREATE OR REPLACE FUNCTION public.admin_upsert_civeni_session(
  session_data jsonb,
  user_email text,
  session_token uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_ok boolean;
  result_row civeni_program_sessions%ROWTYPE;
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

  IF session_data ? 'id' AND NULLIF(session_data->>'id','') IS NOT NULL THEN
    -- Update existing session
    UPDATE civeni_program_sessions
    SET
      day_id = (session_data->>'day_id')::uuid,
      session_type = (session_data->>'session_type')::civeni_session_type,
      title = session_data->>'title',
      description = NULLIF(session_data->>'description',''),
      start_at = (session_data->>'start_at')::timestamptz,
      end_at = NULLIF(session_data->>'end_at','')::timestamptz,
      room = NULLIF(session_data->>'room',''),
      modality = CASE 
        WHEN session_data ? 'modality' AND NULLIF(session_data->>'modality','') IS NOT NULL
          THEN (session_data->>'modality')::civeni_modality
        ELSE modality
      END,
      livestream_url = NULLIF(session_data->>'livestream_url',''),
      materials_url = NULLIF(session_data->>'materials_url',''),
      is_parallel = COALESCE((session_data->>'is_parallel')::boolean, false),
      is_featured = COALESCE((session_data->>'is_featured')::boolean, false),
      order_in_day = COALESCE((session_data->>'order_in_day')::int, 0),
      is_published = COALESCE((session_data->>'is_published')::boolean, false),
      updated_at = now()
    WHERE id = (session_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new session
    INSERT INTO civeni_program_sessions (
      day_id,
      session_type,
      title,
      description,
      start_at,
      end_at,
      room,
      modality,
      livestream_url,
      materials_url,
      is_parallel,
      is_featured,
      order_in_day,
      is_published
    ) VALUES (
      (session_data->>'day_id')::uuid,
      (session_data->>'session_type')::civeni_session_type,
      session_data->>'title',
      NULLIF(session_data->>'description',''),
      (session_data->>'start_at')::timestamptz,
      NULLIF(session_data->>'end_at','')::timestamptz,
      NULLIF(session_data->>'room',''),
      CASE 
        WHEN session_data ? 'modality' AND NULLIF(session_data->>'modality','') IS NOT NULL
          THEN (session_data->>'modality')::civeni_modality
        ELSE NULL
      END,
      NULLIF(session_data->>'livestream_url',''),
      NULLIF(session_data->>'materials_url',''),
      COALESCE((session_data->>'is_parallel')::boolean, false),
      COALESCE((session_data->>'is_featured')::boolean, false),
      COALESCE((session_data->>'order_in_day')::int, 0),
      COALESCE((session_data->>'is_published')::boolean, false)
    )
    RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$function$;