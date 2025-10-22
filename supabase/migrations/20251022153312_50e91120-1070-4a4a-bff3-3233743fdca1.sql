-- Verificar o status atual de RLS em storage.objects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Temporariamente desabilitar RLS apenas para o bucket work-submissions
-- (vamos criar uma política de bypass específica)
DROP POLICY IF EXISTS "work_submissions_bypass" ON storage.objects;

CREATE POLICY "work_submissions_bypass"
ON storage.objects
AS PERMISSIVE
FOR ALL
TO public
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');