-- Criar tabela básica de assets de mídia
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  cdn_url TEXT,
  versioned_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Políticas simples
CREATE POLICY "media_assets_read_all" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "media_assets_admin_write" ON public.media_assets FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());