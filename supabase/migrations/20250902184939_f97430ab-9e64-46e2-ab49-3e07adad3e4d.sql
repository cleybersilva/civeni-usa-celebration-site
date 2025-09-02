-- Create admin_upsert_video function for secure video management
CREATE OR REPLACE FUNCTION public.admin_upsert_video(video_data jsonb, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_ok boolean;
  result_row videos%ROWTYPE;
  final_thumbnail_url text;
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

  -- Handle thumbnail URL (data URLs should be handled by application first)
  final_thumbnail_url := video_data->>'thumbnail';

  IF video_data ? 'id' AND NULLIF(video_data->>'id','') IS NOT NULL THEN
    -- Update existing video
    UPDATE videos
    SET 
      title = COALESCE(video_data->>'title', title),
      description = COALESCE(video_data->>'description', description),
      video_type = COALESCE(video_data->>'video_type', video_type),
      youtube_url = COALESCE(video_data->>'youtube_url', youtube_url),
      uploaded_video_url = COALESCE(video_data->>'uploaded_video_url', uploaded_video_url),
      thumbnail = COALESCE(final_thumbnail_url, thumbnail),
      order_index = COALESCE((video_data->>'order_index')::int, order_index),
      is_active = COALESCE((video_data->>'is_active')::boolean, is_active),
      updated_at = now()
    WHERE id = (video_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new video
    INSERT INTO videos (
      title, description, video_type, youtube_url, uploaded_video_url, thumbnail, order_index, is_active
    ) VALUES (
      video_data->>'title',
      video_data->>'description',
      video_data->>'video_type',
      video_data->>'youtube_url',
      video_data->>'uploaded_video_url',
      final_thumbnail_url,
      COALESCE((video_data->>'order_index')::int, 1),
      COALESCE((video_data->>'is_active')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;

-- Create admin_delete_video function for secure video deletion
CREATE OR REPLACE FUNCTION public.admin_delete_video(video_id uuid, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_ok boolean;
  affected_rows integer;
BEGIN
  -- Validate session
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;
  
  -- Ensure caller is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Delete video
  DELETE FROM videos WHERE id = video_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Video deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Video not found');
  END IF;
END;
$$;

-- Create admin_deactivate_missing_videos function
CREATE OR REPLACE FUNCTION public.admin_deactivate_missing_videos(active_ids uuid[], user_email text, session_token uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_ok boolean;
  affected integer := 0;
BEGIN
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  IF array_length(active_ids, 1) IS NULL THEN
    RETURN 0; -- nothing to deactivate safely
  END IF;

  UPDATE videos
  SET is_active = false, updated_at = now()
  WHERE id NOT IN (SELECT UNNEST(active_ids))
  AND is_active = true;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;