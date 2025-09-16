-- Tabela básica para versionamento de assets
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  kind TEXT CHECK (kind IN ('banner','speaker','logo','generic')) NOT NULL,
  content_hash TEXT NOT NULL,
  width INT, 
  height INT, 
  mime TEXT,
  file_size BIGINT,
  cdn_url TEXT,
  versioned_url TEXT,
  is_published BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Função para gerar URL versionada
CREATE OR REPLACE FUNCTION public.generate_versioned_url(base_url TEXT, hash TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN base_url || '?v=' || hash || '&t=' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para auto-gerar versioned_url
CREATE OR REPLACE FUNCTION update_media_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.cdn_url IS NOT NULL AND NEW.content_hash IS NOT NULL THEN
    NEW.versioned_url = public.generate_versioned_url(NEW.cdn_url, NEW.content_hash);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_update_trigger
  BEFORE INSERT OR UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_media_assets_timestamp();

-- Habilitar RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_media_assets_kind ON public.media_assets(kind);
CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON public.media_assets(content_hash);

-- Colunas de referência nas tabelas existentes
ALTER TABLE public.cms_speakers 
ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id);

ALTER TABLE public.banner_slides 
ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id);

-- Políticas RLS
CREATE POLICY "media_assets_public_read"
ON public.media_assets FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "media_assets_admin_all"
ON public.media_assets FOR ALL
TO public
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());