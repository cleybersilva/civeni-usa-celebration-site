-- Remover completamente a política existente
DROP POLICY IF EXISTS "work_submissions_public_all_access" ON storage.objects;

-- Criar nova política com todos os roles necessários explícitos
CREATE POLICY "work_submissions_public_all_access"
ON storage.objects
FOR ALL
TO anon, authenticated, public
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');