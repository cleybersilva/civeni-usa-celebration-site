-- Remover todas as políticas existentes relacionadas a work-submissions
DROP POLICY IF EXISTS "work_submissions_public_all_access" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_anon_access" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_authenticated_access" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_public_access" ON storage.objects;

-- Criar política específica para role anon (usuários não autenticados)
CREATE POLICY "work_submissions_anon_access"
ON storage.objects
FOR ALL
TO anon
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');

-- Criar política específica para role authenticated (usuários autenticados)
CREATE POLICY "work_submissions_authenticated_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');

-- Criar política específica para role public (acesso geral)
CREATE POLICY "work_submissions_public_access"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');