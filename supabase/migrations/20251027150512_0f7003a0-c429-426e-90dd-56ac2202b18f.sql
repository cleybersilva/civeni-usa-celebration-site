-- Limpar imagens base64 antigas dos speakers
-- Isso força o re-upload através do admin, que irá salvar corretamente no Storage

UPDATE cms_speakers
SET image_url = '',
    photo_version = COALESCE(photo_version, 0) + 1
WHERE image_url LIKE 'data:%';

-- Log para verificar quantos foram atualizados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Limpou % speakers com imagens base64', updated_count;
END $$;