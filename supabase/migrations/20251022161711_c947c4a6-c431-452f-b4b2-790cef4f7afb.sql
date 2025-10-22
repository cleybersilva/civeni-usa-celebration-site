-- Limpar permissões existentes para evitar conflitos
REVOKE ALL ON storage.objects FROM anon, authenticated, public;
REVOKE ALL ON storage.buckets FROM anon, authenticated, public;

-- Conceder permissões necessárias de forma explícita
GRANT SELECT ON storage.buckets TO anon, authenticated, public;
GRANT ALL ON storage.objects TO anon, authenticated, public;

-- Verificar se as permissões foram aplicadas corretamente
DO $$
DECLARE
  grant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.table_privileges
  WHERE table_schema = 'storage'
  AND table_name IN ('objects', 'buckets')
  AND grantee IN ('anon', 'authenticated', 'public');
  
  IF grant_count < 6 THEN
    RAISE EXCEPTION 'GRANTs não foram aplicados corretamente. Esperado: 6, Encontrado: %', grant_count;
  END IF;
  
  RAISE NOTICE 'GRANTs aplicados com sucesso. Total de permissões: %', grant_count;
END $$;