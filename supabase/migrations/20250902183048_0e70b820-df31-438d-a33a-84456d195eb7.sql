-- Criar tabela para palestrantes (speakers)
CREATE TABLE public.cms_speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cms_speakers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "cms_speakers_public_read" 
ON public.cms_speakers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "cms_speakers_admin_all" 
ON public.cms_speakers 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Trigger para updated_at
CREATE TRIGGER update_cms_speakers_updated_at
BEFORE UPDATE ON public.cms_speakers
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

-- Inserir dados padrão dos palestrantes
INSERT INTO public.cms_speakers (name, title, institution, bio, image_url, order_index) VALUES
('Dr. Maria Rodriguez', 'Professor of Biomedical Engineering', 'Harvard Medical School', 'Leading researcher in regenerative medicine and tissue engineering with over 20 years of experience.', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', 1),
('Prof. James Chen', 'Director of AI Research', 'Stanford University', 'Pioneer in artificial intelligence and machine learning applications in healthcare.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', 2),
('Dr. Elena Kowalski', 'Environmental Scientist', 'MIT', 'Expert in climate change research and sustainable technology development.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', 3),
('Dr. Ahmed Hassan', 'Professor of Psychology', 'Oxford University', 'Renowned researcher in cognitive psychology and behavioral sciences.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', 4);

-- Função segura para upsert de palestrantes
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
      updated_at = now()
    WHERE id = (speaker_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Inserir novo speaker
    INSERT INTO cms_speakers (
      name, title, institution, bio, image_url, order_index, is_active
    ) VALUES (
      speaker_data->>'name',
      speaker_data->>'title',
      speaker_data->>'institution',
      speaker_data->>'bio',
      final_image_url,
      COALESCE((speaker_data->>'order_index')::int, 1),
      COALESCE((speaker_data->>'is_active')::boolean, true)
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$function$;

-- Função segura para deletar palestrante
CREATE OR REPLACE FUNCTION public.admin_delete_speaker(speaker_id uuid, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_ok boolean;
  affected_rows integer;
BEGIN
  -- Validar sessão
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;
  
  -- Garantir que o usuário é admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Deletar speaker
  DELETE FROM cms_speakers WHERE id = speaker_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Speaker deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Speaker not found');
  END IF;
END;
$function$;