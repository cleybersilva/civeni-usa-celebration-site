-- Admin banner CRUD via SECURITY DEFINER functions using secure session token
-- 1) Upsert banner slide (insert or update)
CREATE OR REPLACE FUNCTION public.admin_upsert_banner_slide(
  slide jsonb,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_ok boolean;
  result_row banner_slides%ROWTYPE;
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

  IF slide ? 'id' AND NULLIF(slide->>'id','') IS NOT NULL THEN
    UPDATE banner_slides
    SET 
      title = COALESCE(slide->>'title',''),
      subtitle = COALESCE(slide->>'subtitle',''),
      description = COALESCE(slide->>'description',''),
      bg_image = COALESCE(slide->>'bg_image',''),
      button_text = COALESCE(slide->>'button_text',''),
      button_link = COALESCE(slide->>'button_link',''),
      order_index = COALESCE((slide->>'order_index')::int, 1),
      is_active = COALESCE((slide->>'is_active')::boolean, true),
      updated_at = now()
    WHERE id = (slide->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    INSERT INTO banner_slides (
      title, subtitle, description, bg_image, button_text, button_link, order_index, is_active
    ) VALUES (
      COALESCE(slide->>'title',''),
      COALESCE(slide->>'subtitle',''),
      COALESCE(slide->>'description',''),
      COALESCE(slide->>'bg_image',''),
      COALESCE(slide->>'button_text',''),
      COALESCE(slide->>'button_link',''),
      COALESCE((slide->>'order_index')::int, 1),
      COALESCE((slide->>'is_active')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;

-- 2) Deactivate slides not in provided active list
CREATE OR REPLACE FUNCTION public.admin_deactivate_missing_banners(
  active_ids uuid[],
  user_email text,
  session_token uuid
)
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

  UPDATE banner_slides
  SET is_active = false, updated_at = now()
  WHERE id NOT IN (SELECT UNNEST(active_ids))
  RETURNING 1 INTO affected;

  -- affected here will only capture last row; instead return count
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
