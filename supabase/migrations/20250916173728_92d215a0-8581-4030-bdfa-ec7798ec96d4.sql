-- Tabela para gerenciar assets de mídia com versionamento
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('banner','speaker','logo','generic')) NOT NULL,
  content_hash TEXT NOT NULL,            -- sha256 do arquivo
  width INT, 
  height INT, 
  mime TEXT,
  variants JSONB DEFAULT '[]'::jsonb,    -- [{"w":320,"h":180,"url":"..."}]
  cdn_url TEXT,                          -- base pública sem versão
  versioned_url TEXT,                    -- cdn_url + ?v=<hash>
  is_published BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para bucket + path
CREATE UNIQUE INDEX IF NOT EXISTS media_assets_bucket_path_idx
  ON public.media_assets(bucket, path);

-- Habilitar RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública apenas para assets publicados
CREATE POLICY "media_read_published"
ON public.media_assets FOR SELECT
USING (is_published = true);

-- Política admin para gerenciar assets
CREATE POLICY "media_admin_all"
ON public.media_assets FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Adicionar colunas de referência às tabelas existentes
ALTER TABLE public.cms_speakers 
ADD COLUMN IF NOT EXISTS image_asset_id UUID REFERENCES public.media_assets(id);

ALTER TABLE public.banner_slides 
ADD COLUMN IF NOT EXISTS image_asset_id UUID REFERENCES public.media_assets(id);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_media_assets_updated_at_trigger
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_media_assets_updated_at();