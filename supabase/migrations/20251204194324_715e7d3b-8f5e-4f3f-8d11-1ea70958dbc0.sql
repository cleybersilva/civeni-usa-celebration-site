-- Admin upsert function for live_stream_videos
CREATE OR REPLACE FUNCTION public.admin_upsert_live_stream_video(
  video_data jsonb,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_ok boolean;
  result_row live_stream_videos%ROWTYPE;
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

  IF video_data ? 'id' AND NULLIF(video_data->>'id','') IS NOT NULL THEN
    -- Update existing video
    UPDATE live_stream_videos
    SET 
      title = COALESCE(video_data->>'title', title),
      description = COALESCE(video_data->>'description', description),
      youtube_url = COALESCE(video_data->>'youtube_url', youtube_url),
      order_index = COALESCE((video_data->>'order_index')::int, order_index),
      is_published = COALESCE((video_data->>'is_published')::boolean, is_published),
      updated_at = now()
    WHERE id = (video_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new video
    INSERT INTO live_stream_videos (
      title,
      description,
      youtube_url,
      order_index,
      is_published
    ) VALUES (
      video_data->>'title',
      video_data->>'description',
      video_data->>'youtube_url',
      COALESCE((video_data->>'order_index')::int, 0),
      COALESCE((video_data->>'is_published')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;

-- Admin delete function for live_stream_videos
CREATE OR REPLACE FUNCTION public.admin_delete_live_stream_video(
  video_id uuid,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  DELETE FROM live_stream_videos WHERE id = video_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Live stream video deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Live stream video not found');
  END IF;
END;
$$;