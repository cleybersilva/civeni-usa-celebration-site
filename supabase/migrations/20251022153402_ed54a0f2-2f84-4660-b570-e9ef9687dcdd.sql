-- Remover TODAS as políticas work-submissions
DROP POLICY IF EXISTS "work_submissions_anon_access" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_authenticated_access" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_public_access" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_bypass" ON storage.objects;

-- Criar UMA política simples e permissiva sem especificar roles
-- Isso permite acesso a TODOS os roles automaticamente
CREATE POLICY "Enable all access for work-submissions bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');