-- Criar estrutura para gerenciamento de assets e corrigir storage bucket
-- 1. Tabela para metadados de imagens
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  path TEXT NOT NULL,
  alt_text_pt TEXT,
  alt_text_en TEXT,
  alt_text_es TEXT,
  width INTEGER,
  height INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para media_assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Leitura pública para o site
CREATE POLICY "media_assets_public_read" 
ON public.media_assets 
FOR SELECT 
USING (true);

-- Escrita apenas para admins
CREATE POLICY "media_assets_admin_write" 
ON public.media_assets 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 2. Garantir que o bucket site-civeni seja público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'site-civeni';

-- Se o bucket não existe, criar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-civeni', 'site-civeni', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 3. Política de leitura pública para o bucket site-civeni
CREATE POLICY IF NOT EXISTS "site_civeni_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-civeni');

-- 4. Política de escrita para admins no bucket site-civeni
CREATE POLICY IF NOT EXISTS "site_civeni_admin_write"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'site-civeni' AND is_current_user_admin());

CREATE POLICY IF NOT EXISTS "site_civeni_admin_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'site-civeni' AND is_current_user_admin())
WITH CHECK (bucket_id = 'site-civeni' AND is_current_user_admin());

-- 5. Função para obter URL pública estável
CREATE OR REPLACE FUNCTION public.get_stable_asset_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN format('https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/%s/%s', bucket_name, file_path);
END;
$$;

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_assets_updated_at();