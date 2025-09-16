-- Criar nova estrutura de eventos completa e moderna

-- 1) Tabela principal de eventos
CREATE TABLE public.events_new (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  
  -- Identidade
  title text NOT NULL,
  subtitle text,
  short_description text, -- até 280 chars
  full_description text, -- rich text/markdown
  
  -- Datas & horário
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  timezone text DEFAULT 'America/Sao_Paulo',
  
  -- Formato
  mode text NOT NULL CHECK (mode IN ('online', 'presencial', 'hibrido')),
  
  -- Localização
  venue_name text,
  address text,
  city text,
  state text,
  country text DEFAULT 'Brasil',
  map_url text,
  
  -- Visibilidade & status
  is_public boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  publish_at timestamptz,
  unpublish_at timestamptz,
  
  -- Inscrição
  has_registration boolean DEFAULT false,
  registration_url text,
  registration_cta_label text DEFAULT 'Inscreva-se',
  
  -- Canais & links
  official_site_url text,
  whatsapp_group_url text,
  
  -- Mídias chave
  cover_image_url text,
  thumbnail_url text,
  
  -- YouTube
  youtube_playlist_url text,
  youtube_channel_url text,
  
  -- Metadados SEO
  seo_title text,
  seo_description text,
  seo_keywords text[],
  canonical_url text,
  
  -- I18n opcional
  translations jsonb,
  
  -- Auditoria
  created_by text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_events_new_slug ON public.events_new(slug);
CREATE INDEX idx_events_new_start_at ON public.events_new(start_at);
CREATE INDEX idx_events_new_is_public ON public.events_new(is_public) WHERE is_public = true;
CREATE INDEX idx_events_new_is_featured ON public.events_new(is_featured) WHERE is_featured = true;
CREATE INDEX idx_events_new_mode ON public.events_new(mode);

-- 2) Tabela de mídia dos eventos
CREATE TABLE public.event_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events_new(id) ON DELETE CASCADE,
  
  type text NOT NULL CHECK (type IN ('image', 'video_youtube', 'playlist_youtube', 'pdf', 'audio', 'link_externo', 'banner', 'galeria')),
  title text,
  description text,
  url text NOT NULL,
  thumbnail_url text,
  position integer DEFAULT 1,
  is_primary boolean DEFAULT false,
  is_public boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para event_media
CREATE INDEX idx_event_media_event_id ON public.event_media(event_id);
CREATE INDEX idx_event_media_type ON public.event_media(type);
CREATE INDEX idx_event_media_position ON public.event_media(position);
CREATE INDEX idx_event_media_is_public ON public.event_media(is_public) WHERE is_public = true;

-- 3) Tabela de configurações dos eventos
CREATE TABLE public.event_flags (
  event_id uuid NOT NULL PRIMARY KEY REFERENCES public.events_new(id) ON DELETE CASCADE,
  
  show_speakers boolean DEFAULT true,
  show_schedule_download boolean DEFAULT true,
  show_share_buttons boolean DEFAULT true,
  allow_comments boolean DEFAULT false,
  
  public_sync_mode text DEFAULT 'stale-while-revalidate' CHECK (public_sync_mode IN ('realtime', 'stale-while-revalidate')),
  ui_theme jsonb
);

-- 4) Tabela de histórico de status (opcional para auditoria)
CREATE TABLE public.event_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events_new(id) ON DELETE CASCADE,
  changed_field text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz DEFAULT now(),
  changed_by text
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_events_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_events_new_updated_at
  BEFORE UPDATE ON public.events_new
  FOR EACH ROW
  EXECUTE FUNCTION update_events_new_updated_at();

CREATE TRIGGER trigger_event_media_updated_at
  BEFORE UPDATE ON public.event_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para segurança

-- events_new: leitura pública para eventos publicados
ALTER TABLE public.events_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_new_public_read" ON public.events_new
  FOR SELECT USING (
    is_public = true 
    AND is_archived = false 
    AND (publish_at IS NULL OR publish_at <= now())
    AND (unpublish_at IS NULL OR unpublish_at > now())
  );

CREATE POLICY "events_new_admin_all" ON public.events_new
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- event_media: leitura pública para mídia de eventos públicos
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_media_public_read" ON public.event_media
  FOR SELECT USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.events_new e 
      WHERE e.id = event_media.event_id 
      AND e.is_public = true 
      AND e.is_archived = false
      AND (e.publish_at IS NULL OR e.publish_at <= now())
      AND (e.unpublish_at IS NULL OR e.unpublish_at > now())
    )
  );

CREATE POLICY "event_media_admin_all" ON public.event_media
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- event_flags: leitura pública para eventos públicos
ALTER TABLE public.event_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_flags_public_read" ON public.event_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events_new e 
      WHERE e.id = event_flags.event_id 
      AND e.is_public = true 
      AND e.is_archived = false
      AND (e.publish_at IS NULL OR e.publish_at <= now())
      AND (e.unpublish_at IS NULL OR e.unpublish_at > now())
    )
  );

CREATE POLICY "event_flags_admin_all" ON public.event_flags
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- event_status_history: apenas admin
ALTER TABLE public.event_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_status_history_admin_only" ON public.event_status_history
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Migrar dados existentes da tabela events para events_new
INSERT INTO public.events_new (
  id,
  slug,
  title,
  subtitle,
  start_at,
  end_at,
  timezone,
  mode,
  venue_name,
  address,
  cover_image_url,
  has_registration,
  registration_url,
  is_featured,
  youtube_playlist_url,
  official_site_url,
  seo_title,
  seo_description,
  is_public,
  is_archived,
  created_at,
  updated_at,
  created_by,
  updated_by
)
SELECT 
  id,
  slug,
  COALESCE(slug, 'evento-' || id) as title, -- usar slug como título temporário
  '' as subtitle,
  inicio_at,
  fim_at,
  COALESCE(timezone, 'America/Sao_Paulo'),
  modalidade::text,
  '' as venue_name,
  endereco,
  banner_url,
  tem_inscricao,
  inscricao_url,
  featured,
  playlist_url,
  '' as official_site_url,
  slug as seo_title,
  '' as seo_description,
  CASE WHEN status_publicacao = 'published' THEN true ELSE false END,
  false as is_archived,
  created_at,
  updated_at,
  created_by,
  updated_by
FROM public.events
WHERE slug IS NOT NULL;

-- Criar event_flags padrão para todos os eventos migrados
INSERT INTO public.event_flags (event_id)
SELECT id FROM public.events_new
ON CONFLICT (event_id) DO NOTHING;

-- Migrar mídias existentes como event_media
INSERT INTO public.event_media (event_id, type, title, url, position, is_primary)
SELECT 
  e.id,
  'banner' as type,
  'Banner Principal' as title,
  e.banner_url as url,
  1 as position,
  true as is_primary
FROM public.events e
INNER JOIN public.events_new en ON e.id = en.id
WHERE e.banner_url IS NOT NULL;

-- Adicionar YouTube como mídia se existir
INSERT INTO public.event_media (event_id, type, title, url, position)
SELECT 
  e.id,
  'video_youtube' as type,
  'Canal YouTube' as title,
  e.youtube_url as url,
  2 as position
FROM public.events e
INNER JOIN public.events_new en ON e.id = en.id
WHERE e.youtube_url IS NOT NULL;

-- Adicionar Playlist YouTube como mídia se existir
INSERT INTO public.event_media (event_id, type, title, url, position)
SELECT 
  e.id,
  'playlist_youtube' as type,
  'Playlist YouTube' as title,
  e.playlist_url as url,
  3 as position
FROM public.events e
INNER JOIN public.events_new en ON e.id = en.id
WHERE e.playlist_url IS NOT NULL;