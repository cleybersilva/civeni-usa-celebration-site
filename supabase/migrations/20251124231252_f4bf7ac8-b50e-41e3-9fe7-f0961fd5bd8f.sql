-- Update admin_upsert_banner_slide to include translation fields
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
      title_en = NULLIF(slide->>'title_en',''),
      title_es = NULLIF(slide->>'title_es',''),
      subtitle = COALESCE(slide->>'subtitle',''),
      subtitle_en = NULLIF(slide->>'subtitle_en',''),
      subtitle_es = NULLIF(slide->>'subtitle_es',''),
      description = COALESCE(slide->>'description',''),
      description_en = NULLIF(slide->>'description_en',''),
      description_es = NULLIF(slide->>'description_es',''),
      bg_image = COALESCE(slide->>'bg_image',''),
      button_text = COALESCE(slide->>'button_text',''),
      button_text_en = NULLIF(slide->>'button_text_en',''),
      button_text_es = NULLIF(slide->>'button_text_es',''),
      button_link = COALESCE(slide->>'button_link',''),
      order_index = COALESCE((slide->>'order_index')::int, 1),
      is_active = COALESCE((slide->>'is_active')::boolean, true),
      updated_at = now()
    WHERE id = (slide->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    INSERT INTO banner_slides (
      title, title_en, title_es, subtitle, subtitle_en, subtitle_es, 
      description, description_en, description_es, bg_image, button_text, 
      button_text_en, button_text_es, button_link, order_index, is_active
    ) VALUES (
      COALESCE(slide->>'title',''),
      NULLIF(slide->>'title_en',''),
      NULLIF(slide->>'title_es',''),
      COALESCE(slide->>'subtitle',''),
      NULLIF(slide->>'subtitle_en',''),
      NULLIF(slide->>'subtitle_es',''),
      COALESCE(slide->>'description',''),
      NULLIF(slide->>'description_en',''),
      NULLIF(slide->>'description_es',''),
      COALESCE(slide->>'bg_image',''),
      COALESCE(slide->>'button_text',''),
      NULLIF(slide->>'button_text_en',''),
      NULLIF(slide->>'button_text_es',''),
      COALESCE(slide->>'button_link',''),
      COALESCE((slide->>'order_index')::int, 1),
      COALESCE((slide->>'is_active')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;