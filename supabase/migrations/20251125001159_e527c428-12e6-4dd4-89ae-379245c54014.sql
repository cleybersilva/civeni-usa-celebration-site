-- Update admin_upsert_banner_slide function to handle Turkish translations
CREATE OR REPLACE FUNCTION public.admin_upsert_banner_slide(slide jsonb, user_email text, session_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Update existing banner
    UPDATE banner_slides
    SET 
      title = COALESCE(slide->>'title', title),
      title_en = COALESCE(slide->>'title_en', title_en),
      title_es = COALESCE(slide->>'title_es', title_es),
      title_tr = COALESCE(slide->>'title_tr', title_tr),
      subtitle = COALESCE(slide->>'subtitle', subtitle),
      subtitle_en = COALESCE(slide->>'subtitle_en', subtitle_en),
      subtitle_es = COALESCE(slide->>'subtitle_es', subtitle_es),
      subtitle_tr = COALESCE(slide->>'subtitle_tr', subtitle_tr),
      description = COALESCE(slide->>'description', description),
      description_en = COALESCE(slide->>'description_en', description_en),
      description_es = COALESCE(slide->>'description_es', description_es),
      description_tr = COALESCE(slide->>'description_tr', description_tr),
      bg_image = COALESCE(slide->>'bg_image', bg_image),
      button_text = COALESCE(slide->>'button_text', button_text),
      button_text_en = COALESCE(slide->>'button_text_en', button_text_en),
      button_text_es = COALESCE(slide->>'button_text_es', button_text_es),
      button_text_tr = COALESCE(slide->>'button_text_tr', button_text_tr),
      button_link = COALESCE(slide->>'button_link', button_link),
      order_index = COALESCE((slide->>'order_index')::int, order_index),
      is_active = COALESCE((slide->>'is_active')::boolean, is_active),
      updated_at = now()
    WHERE id = (slide->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new banner
    INSERT INTO banner_slides (
      title, title_en, title_es, title_tr,
      subtitle, subtitle_en, subtitle_es, subtitle_tr,
      description, description_en, description_es, description_tr,
      bg_image, button_text, button_text_en, button_text_es, button_text_tr,
      button_link, order_index, is_active
    ) VALUES (
      slide->>'title',
      NULLIF(slide->>'title_en',''),
      NULLIF(slide->>'title_es',''),
      NULLIF(slide->>'title_tr',''),
      slide->>'subtitle',
      NULLIF(slide->>'subtitle_en',''),
      NULLIF(slide->>'subtitle_es',''),
      NULLIF(slide->>'subtitle_tr',''),
      slide->>'description',
      NULLIF(slide->>'description_en',''),
      NULLIF(slide->>'description_es',''),
      NULLIF(slide->>'description_tr',''),
      slide->>'bg_image',
      slide->>'button_text',
      NULLIF(slide->>'button_text_en',''),
      NULLIF(slide->>'button_text_es',''),
      NULLIF(slide->>'button_text_tr',''),
      slide->>'button_link',
      COALESCE((slide->>'order_index')::int, 1),
      COALESCE((slide->>'is_active')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$function$;