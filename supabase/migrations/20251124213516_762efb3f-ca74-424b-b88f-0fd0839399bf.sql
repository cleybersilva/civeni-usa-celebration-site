-- Atualizar função admin_upsert_speaker para incluir campos de país
CREATE OR REPLACE FUNCTION public.admin_upsert_speaker(speaker_data jsonb, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_ok boolean;
  result_row cms_speakers%ROWTYPE;
  final_image_url text;
BEGIN
  -- Validar e definir usuário atual para RLS
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;
  
  -- Garantir que o usuário é admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Se imagem_url for data URL, deve ser tratado pela aplicação antes de chamar esta função
  final_image_url := speaker_data->>'image_url';

  IF speaker_data ? 'id' AND NULLIF(speaker_data->>'id','') IS NOT NULL THEN
    -- Atualizar speaker existente
    UPDATE cms_speakers
    SET 
      name = COALESCE(speaker_data->>'name', name),
      title = COALESCE(speaker_data->>'title', title),
      institution = COALESCE(speaker_data->>'institution', institution),
      bio = COALESCE(speaker_data->>'bio', bio),
      image_url = COALESCE(final_image_url, image_url),
      order_index = COALESCE((speaker_data->>'order_index')::int, order_index),
      is_active = COALESCE((speaker_data->>'is_active')::boolean, is_active),
      country_name = CASE WHEN speaker_data ? 'country_name' THEN speaker_data->>'country_name' ELSE country_name END,
      country_code = CASE WHEN speaker_data ? 'country_code' THEN speaker_data->>'country_code' ELSE country_code END,
      show_flag = COALESCE((speaker_data->>'show_flag')::boolean, show_flag),
      updated_at = now()
    WHERE id = (speaker_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Inserir novo speaker
    INSERT INTO cms_speakers (
      name, title, institution, bio, image_url, order_index, is_active, country_name, country_code, show_flag
    ) VALUES (
      speaker_data->>'name',
      speaker_data->>'title',
      speaker_data->>'institution',
      speaker_data->>'bio',
      final_image_url,
      COALESCE((speaker_data->>'order_index')::int, 1),
      COALESCE((speaker_data->>'is_active')::boolean, true),
      speaker_data->>'country_name',
      speaker_data->>'country_code',
      COALESCE((speaker_data->>'show_flag')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$function$;