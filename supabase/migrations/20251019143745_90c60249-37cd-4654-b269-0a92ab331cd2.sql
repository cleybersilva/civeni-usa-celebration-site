-- Tabela de transmissões YouTube
CREATE TABLE IF NOT EXISTS public.streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL DEFAULT jsonb_build_object('pt','', 'en','', 'es',''),
  description JSONB DEFAULT jsonb_build_object('pt','', 'en','', 'es',''),
  status TEXT CHECK (status IN ('scheduled','live','ended')) NOT NULL DEFAULT 'scheduled',
  youtube_video_id TEXT,
  youtube_playlist_id TEXT,
  channel_handle TEXT,
  channel_id TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/New_York',
  thumbnail_url TEXT,
  visibility TEXT CHECK (visibility IN ('public','private','unlisted')) DEFAULT 'public',
  language TEXT DEFAULT 'pt-BR',
  is_fallback BOOLEAN DEFAULT FALSE,
  fallback_priority INTEGER DEFAULT 0,
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de salas Google Meet
CREATE TABLE IF NOT EXISTS public.meet_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  meet_url TEXT,
  status TEXT CHECK (status IN ('idle','live','ended')) DEFAULT 'idle',
  moderators TEXT[] DEFAULT '{}',
  capacity INTEGER,
  visibility TEXT CHECK (visibility IN ('enrolled_only','staff_only','public')) DEFAULT 'enrolled_only',
  notes TEXT,
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de sessões (programação unificada)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL CHECK (day IN (1,2,3)),
  track TEXT CHECK (track IN ('online','presencial')) NOT NULL,
  type TEXT CHECK (type IN ('abertura','conferencia','palestra','mesa_redonda','apresentacao_oral','intervalo','credenciamento','outros')) NOT NULL,
  title JSONB NOT NULL DEFAULT jsonb_build_object('pt','', 'en','', 'es',''),
  speakers JSONB DEFAULT '[]',
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  meet_room_id UUID REFERENCES public.meet_rooms(id) ON DELETE SET NULL,
  language TEXT DEFAULT 'pt-BR',
  status TEXT CHECK (status IN ('scheduled','live','ended','canceled')) DEFAULT 'scheduled',
  materials JSONB DEFAULT '[]',
  visibility TEXT DEFAULT 'public',
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policies para leitura pública
CREATE POLICY "streams_public_read" ON public.streams
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "streams_admin_all" ON public.streams
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "sessions_public_read" ON public.sessions
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "meet_rooms_public_meta" ON public.meet_rooms
  FOR SELECT USING (true);

CREATE POLICY "meet_rooms_admin_all" ON public.meet_rooms
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- View pública para sessões (sem meet_url exposto)
CREATE OR REPLACE VIEW public.public_meet_rooms AS
SELECT id, name, status, moderators, capacity, visibility, notes
FROM public.meet_rooms;

-- View para sessões com horários formatados
CREATE OR REPLACE VIEW public.v_sessions_front AS
SELECT 
  s.id,
  s.day,
  s.track,
  s.type,
  s.title,
  s.speakers,
  s.location,
  s.start_at AS start_et,
  s.end_at AS end_et,
  s.timezone,
  s.status,
  s.stream_id,
  s.meet_room_id,
  s.materials
FROM public.sessions s
WHERE s.visibility = 'public';

-- Função para verificar se usuário está inscrito
CREATE OR REPLACE FUNCTION public.user_is_enrolled(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_registrations 
    WHERE id = uid 
    AND payment_status = 'completed'
  );
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_transmission_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON public.streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

CREATE TRIGGER update_meet_rooms_updated_at
  BEFORE UPDATE ON public.meet_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

-- Índices para performance
CREATE INDEX idx_streams_status ON public.streams(status);
CREATE INDEX idx_streams_start_at ON public.streams(start_at);
CREATE INDEX idx_sessions_day_track ON public.sessions(day, track);
CREATE INDEX idx_sessions_start_at ON public.sessions(start_at);
CREATE INDEX idx_meet_rooms_status ON public.meet_rooms(status);

-- Seeds iniciais
INSERT INTO public.streams (title, description, status, is_fallback, fallback_priority, youtube_video_id, channel_handle, timezone, visibility)
VALUES (
  jsonb_build_object(
    'pt', 'CIVENI 2025 — Voltamos em instantes',
    'en', 'CIVENI 2025 — We will be live shortly',
    'es', 'CIVENI 2025 — Volvemos en instantes'
  ),
  jsonb_build_object(
    'pt', 'Acompanhe a transmissão oficial do III CIVENI 2025.',
    'en', 'Follow the official broadcast of III CIVENI 2025.',
    'es', 'Sigue la transmisión oficial de III CIVENI 2025.'
  ),
  'ended',
  true,
  10,
  'dQw4w9WgXcQ',
  '@CiveniUSA2025',
  'America/New_York',
  'public'
);

INSERT INTO public.meet_rooms (name, status, moderators, capacity, visibility, notes)
VALUES
  ('Sala A', 'idle', ARRAY['moderador@vccu.edu'], 300, 'enrolled_only', 'Sala de Apresentações Orais - Bloco 1'),
  ('Sala B', 'idle', ARRAY['moderador@vccu.edu'], 300, 'enrolled_only', 'Sala de Apresentações Orais - Bloco 2');

COMMENT ON TABLE public.streams IS 'Transmissões YouTube do CIVENI 2025';
COMMENT ON TABLE public.meet_rooms IS 'Salas Google Meet para apresentações orais';
COMMENT ON TABLE public.sessions IS 'Programação unificada (online e presencial)';