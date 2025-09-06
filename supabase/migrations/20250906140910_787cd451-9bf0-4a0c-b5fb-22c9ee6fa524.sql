-- Create secure admin functions for schedules CRUD

-- 1) Upsert schedule (create/update)
CREATE OR REPLACE FUNCTION public.admin_upsert_schedule(schedule jsonb, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  result_row schedules%ROWTYPE;
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

  IF schedule ? 'id' AND NULLIF(schedule->>'id','') IS NOT NULL THEN
    -- Update existing schedule
    UPDATE schedules
    SET 
      type = COALESCE(schedule->>'type', type),
      date = COALESCE(NULLIF(schedule->>'date','')::date, date),
      start_time = COALESCE(NULLIF(schedule->>'start_time','')::time, start_time),
      end_time = COALESCE(NULLIF(schedule->>'end_time','')::time, end_time),
      title = COALESCE(schedule->>'title', title),
      category = COALESCE(schedule->>'category', category),
      description = COALESCE(NULLIF(schedule->>'description',''), description),
      speaker_name = COALESCE(NULLIF(schedule->>'speaker_name',''), speaker_name),
      speaker_photo_url = COALESCE(NULLIF(schedule->>'speaker_photo_url',''), speaker_photo_url),
      location = COALESCE(NULLIF(schedule->>'location',''), location),
      virtual_link = COALESCE(NULLIF(schedule->>'virtual_link',''), virtual_link),
      platform = COALESCE(NULLIF(schedule->>'platform',''), platform),
      is_recorded = COALESCE((schedule->>'is_recorded')::boolean, is_recorded),
      recording_url = COALESCE(NULLIF(schedule->>'recording_url',''), recording_url),
      is_published = COALESCE((schedule->>'is_published')::boolean, is_published),
      updated_at = now()
    WHERE id = (schedule->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new schedule
    INSERT INTO schedules (
      type, date, start_time, end_time, title, category, description,
      speaker_name, speaker_photo_url, location, virtual_link, platform,
      is_recorded, recording_url, is_published
    ) VALUES (
      schedule->>'type',
      (schedule->>'date')::date,
      (schedule->>'start_time')::time,
      (schedule->>'end_time')::time,
      schedule->>'title',
      schedule->>'category',
      NULLIF(schedule->>'description',''),
      NULLIF(schedule->>'speaker_name',''),
      NULLIF(schedule->>'speaker_photo_url',''),
      NULLIF(schedule->>'location',''),
      NULLIF(schedule->>'virtual_link',''),
      NULLIF(schedule->>'platform',''),
      COALESCE((schedule->>'is_recorded')::boolean, false),
      NULLIF(schedule->>'recording_url',''),
      COALESCE((schedule->>'is_published')::boolean, false)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;

-- 2) Delete schedule
CREATE OR REPLACE FUNCTION public.admin_delete_schedule(schedule_id uuid, user_email text, session_token uuid)
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

  DELETE FROM schedules WHERE id = schedule_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Schedule deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Schedule not found');
  END IF;
END;
$$;

-- 3) Toggle publish status
CREATE OR REPLACE FUNCTION public.admin_toggle_publish_schedule(schedule_id uuid, is_published boolean, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  result_row schedules%ROWTYPE;
BEGIN
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  UPDATE schedules
  SET is_published = is_published, updated_at = now()
  WHERE id = schedule_id
  RETURNING * INTO result_row;

  RETURN to_json(result_row);
END;
$$;