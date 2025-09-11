-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  inicio_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fim_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  modalidade TEXT NOT NULL CHECK (modalidade IN ('online', 'presencial', 'hibrido')),
  endereco TEXT,
  geo_json JSONB,
  banner_url TEXT,
  youtube_url TEXT,
  playlist_url TEXT,
  tem_inscricao BOOLEAN NOT NULL DEFAULT false,
  inscricao_url TEXT,
  cert_modelo_id UUID,
  cert_drive_link TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  exibir_passado BOOLEAN NOT NULL DEFAULT true,
  status_publicacao TEXT NOT NULL DEFAULT 'draft' CHECK (status_publicacao IN ('draft', 'published', 'archived')),
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_translations table
CREATE TABLE public.event_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  idioma TEXT NOT NULL DEFAULT 'pt-BR',
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descricao_richtext TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, idioma)
);

-- Create event_areas table (many-to-many with thematic_areas)
CREATE TABLE public.event_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.thematic_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, area_id)
);

-- Create event_speakers table (many-to-many with cms_speakers)
CREATE TABLE public.event_speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.cms_speakers(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, speaker_id)
);

-- Create event_assets table (gallery)
CREATE TABLE public.event_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  asset_url TEXT NOT NULL,
  caption TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_sessions table (event schedule)
CREATE TABLE public.event_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inicio_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fim_at TIMESTAMP WITH TIME ZONE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  speaker_id UUID REFERENCES public.cms_speakers(id) ON DELETE SET NULL,
  sala_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_cert_templates table
CREATE TABLE public.event_cert_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  template_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_cert_issuances table
CREATE TABLE public.event_cert_issuances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'error')),
  arquivo_url TEXT,
  emitido_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_email)
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_cert_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_cert_issuances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "events_public_read" ON public.events
FOR SELECT USING (status_publicacao = 'published');

CREATE POLICY "events_admin_all" ON public.events
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_translations
CREATE POLICY "event_translations_public_read" ON public.event_translations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.status_publicacao = 'published'
  )
);

CREATE POLICY "event_translations_admin_all" ON public.event_translations
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_areas
CREATE POLICY "event_areas_public_read" ON public.event_areas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.status_publicacao = 'published'
  )
);

CREATE POLICY "event_areas_admin_all" ON public.event_areas
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_speakers
CREATE POLICY "event_speakers_public_read" ON public.event_speakers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.status_publicacao = 'published'
  )
);

CREATE POLICY "event_speakers_admin_all" ON public.event_speakers
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_assets
CREATE POLICY "event_assets_public_read" ON public.event_assets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.status_publicacao = 'published'
  )
);

CREATE POLICY "event_assets_admin_all" ON public.event_assets
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_sessions
CREATE POLICY "event_sessions_public_read" ON public.event_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.status_publicacao = 'published'
  )
);

CREATE POLICY "event_sessions_admin_all" ON public.event_sessions
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_cert_templates
CREATE POLICY "event_cert_templates_admin_all" ON public.event_cert_templates
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies for event_cert_issuances
CREATE POLICY "event_cert_issuances_public_read_own" ON public.event_cert_issuances
FOR SELECT USING (user_email = lower(current_setting('app.current_user_email', true)));

CREATE POLICY "event_cert_issuances_admin_all" ON public.event_cert_issuances
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_translations_updated_at
  BEFORE UPDATE ON public.event_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_assets_updated_at
  BEFORE UPDATE ON public.event_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_cert_templates_updated_at
  BEFORE UPDATE ON public.event_cert_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_cert_issuances_updated_at
  BEFORE UPDATE ON public.event_cert_issuances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for event operations
CREATE OR REPLACE FUNCTION public.admin_upsert_event(event_data jsonb, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  session_ok boolean;
  result_row events%ROWTYPE;
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

  IF event_data ? 'id' AND NULLIF(event_data->>'id','') IS NOT NULL THEN
    -- Update existing event
    UPDATE events
    SET 
      slug = COALESCE(event_data->>'slug', slug),
      inicio_at = COALESCE(NULLIF(event_data->>'inicio_at','')::timestamptz, inicio_at),
      fim_at = COALESCE(NULLIF(event_data->>'fim_at','')::timestamptz, fim_at),
      timezone = COALESCE(event_data->>'timezone', timezone),
      modalidade = COALESCE(event_data->>'modalidade', modalidade),
      endereco = COALESCE(NULLIF(event_data->>'endereco',''), endereco),
      banner_url = COALESCE(NULLIF(event_data->>'banner_url',''), banner_url),
      youtube_url = COALESCE(NULLIF(event_data->>'youtube_url',''), youtube_url),
      playlist_url = COALESCE(NULLIF(event_data->>'playlist_url',''), playlist_url),
      tem_inscricao = COALESCE((event_data->>'tem_inscricao')::boolean, tem_inscricao),
      inscricao_url = COALESCE(NULLIF(event_data->>'inscricao_url',''), inscricao_url),
      featured = COALESCE((event_data->>'featured')::boolean, featured),
      exibir_passado = COALESCE((event_data->>'exibir_passado')::boolean, exibir_passado),
      status_publicacao = COALESCE(event_data->>'status_publicacao', status_publicacao),
      updated_by = user_email,
      updated_at = now()
    WHERE id = (event_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    -- Insert new event
    INSERT INTO events (
      slug, inicio_at, fim_at, timezone, modalidade, endereco, banner_url,
      youtube_url, playlist_url, tem_inscricao, inscricao_url, featured,
      exibir_passado, status_publicacao, created_by, updated_by
    ) VALUES (
      event_data->>'slug',
      (event_data->>'inicio_at')::timestamptz,
      NULLIF(event_data->>'fim_at','')::timestamptz,
      COALESCE(event_data->>'timezone', 'America/Sao_Paulo'),
      event_data->>'modalidade',
      NULLIF(event_data->>'endereco',''),
      NULLIF(event_data->>'banner_url',''),
      NULLIF(event_data->>'youtube_url',''),
      NULLIF(event_data->>'playlist_url',''),
      COALESCE((event_data->>'tem_inscricao')::boolean, false),
      NULLIF(event_data->>'inscricao_url',''),
      COALESCE((event_data->>'featured')::boolean, false),
      COALESCE((event_data->>'exibir_passado')::boolean, true),
      COALESCE(event_data->>'status_publicacao', 'draft'),
      user_email,
      user_email
    ) RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$function$;

-- Create function to delete events
CREATE OR REPLACE FUNCTION public.admin_delete_event(event_id uuid, user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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

  DELETE FROM events WHERE id = event_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Event deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Event not found');
  END IF;
END;
$function$;