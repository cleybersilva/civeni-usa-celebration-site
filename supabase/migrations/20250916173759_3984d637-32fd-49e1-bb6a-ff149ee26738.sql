-- Tabela para gerenciar versionamento de assets de mídia
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,      -- caminho completo no storage (bucket/file)
  kind TEXT CHECK (kind IN ('banner','speaker','logo','generic')) NOT NULL,
  content_hash TEXT NOT NULL,             -- sha256 do arquivo
  width INT, 
  height INT, 
  mime TEXT,
  file_size BIGINT,
  cdn_url TEXT,                           -- URL base pública
  versioned_url TEXT,                     -- URL com cache busting ?v=hash
  is_published BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "media_assets_public_read"
ON public.media_assets FOR SELECT
USING (is_published = true);

-- Política admin completa
CREATE POLICY "media_assets_admin_all"
ON public.media_assets FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Função para gerar URL versionada
CREATE OR REPLACE FUNCTION public.generate_versioned_url(base_url TEXT, hash TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN base_url || '?v=' || hash || '&t=' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para extrair hash de arquivo
CREATE OR REPLACE FUNCTION public.calculate_file_hash(file_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(file_data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_media_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Auto-gerar versioned_url se cdn_url e content_hash existirem
  IF NEW.cdn_url IS NOT NULL AND NEW.content_hash IS NOT NULL THEN
    NEW.versioned_url = public.generate_versioned_url(NEW.cdn_url, NEW.content_hash);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_update_trigger
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_media_assets_timestamp();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_media_assets_kind ON public.media_assets(kind);
CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON public.media_assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_media_assets_published ON public.media_assets(is_published);

-- Adicionar colunas de referência opcionais às tabelas existentes
ALTER TABLE public.cms_speakers 
ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id);

ALTER TABLE public.banner_slides 
ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id);