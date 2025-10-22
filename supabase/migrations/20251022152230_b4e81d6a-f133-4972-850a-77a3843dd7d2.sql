-- Remover a política que já existe
DROP POLICY IF EXISTS "work_submissions_public_all_access" ON storage.objects;

-- Garantir que o bucket é público e tem as configurações corretas
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
WHERE id = 'work-submissions';

-- Criar política única e permissiva para acesso total ao bucket
CREATE POLICY "work_submissions_public_all_access"
ON storage.objects
FOR ALL
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');