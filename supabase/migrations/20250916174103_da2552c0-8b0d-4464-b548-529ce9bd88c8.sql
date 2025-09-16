-- Criar nova tabela para cache busting de imagens
CREATE TABLE IF NOT EXISTS public.image_cache_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  cdn_url TEXT,
  versioned_url TEXT,
  kind TEXT DEFAULT 'generic',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.image_cache_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "image_cache_assets_read_all" ON public.image_cache_assets FOR SELECT USING (true);
CREATE POLICY "image_cache_assets_admin_write" ON public.image_cache_assets FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- Função para auto-gerar versioned_url
CREATE OR REPLACE FUNCTION update_image_cache_assets()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.cdn_url IS NOT NULL AND NEW.content_hash IS NOT NULL THEN
    NEW.versioned_url = NEW.cdn_url || '?v=' || NEW.content_hash || '&t=' || extract(epoch from now())::bigint;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_cache_assets_trigger
  BEFORE INSERT OR UPDATE ON public.image_cache_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_image_cache_assets();

-- Índices
CREATE INDEX IF NOT EXISTS idx_image_cache_assets_path ON public.image_cache_assets(storage_path);
CREATE INDEX IF NOT EXISTS idx_image_cache_assets_hash ON public.image_cache_assets(content_hash);