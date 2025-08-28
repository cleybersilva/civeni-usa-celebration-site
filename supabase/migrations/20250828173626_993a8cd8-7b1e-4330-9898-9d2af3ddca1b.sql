-- Corrigir warnings de segurança do linter
-- 1. Atualizar função com search_path fixo
CREATE OR REPLACE FUNCTION public.get_stable_asset_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN format('https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/%s/%s', bucket_name, file_path);
END;
$$;

-- 2. Atualizar função de trigger com search_path fixo
CREATE OR REPLACE FUNCTION public.update_media_assets_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;