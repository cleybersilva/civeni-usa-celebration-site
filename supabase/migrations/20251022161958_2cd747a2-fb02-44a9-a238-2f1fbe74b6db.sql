-- Remover política incorreta
DROP POLICY IF EXISTS "Enable all access for work-submissions bucket" ON storage.objects;

-- Criar políticas corretas para acesso anônimo (não autenticado)
CREATE POLICY "work_submissions_anon_insert"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'work-submissions');

CREATE POLICY "work_submissions_anon_select"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'work-submissions');

CREATE POLICY "work_submissions_anon_update"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');

CREATE POLICY "work_submissions_anon_delete"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'work-submissions');

-- Garantir que o bucket está público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'work-submissions';

-- Verificar configuração
DO $$
DECLARE
  policy_count INTEGER;
  bucket_public BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
  AND policyname LIKE 'work_submissions_anon_%';
  
  SELECT public INTO bucket_public
  FROM storage.buckets
  WHERE name = 'work-submissions';
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Políticas não foram criadas. Encontradas: %', policy_count;
  END IF;
  
  IF NOT bucket_public THEN
    RAISE EXCEPTION 'Bucket não está público';
  END IF;
  
  RAISE NOTICE 'Configuração aplicada: % políticas, bucket público: %', policy_count, bucket_public;
END $$;