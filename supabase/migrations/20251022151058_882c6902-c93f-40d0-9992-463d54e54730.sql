-- Remover políticas existentes no bucket work-submissions que podem estar causando conflitos
DROP POLICY IF EXISTS "Allow anonymous uploads to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem deletar work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem ver work submissions" ON storage.objects;

-- Criar política para permitir uploads anônimos na pasta submissions/ do bucket work-submissions
CREATE POLICY "Allow anonymous uploads to work-submissions"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'work-submissions' 
  AND (storage.foldername(name))[1] = 'submissions'
);

-- Criar política para permitir leitura pública de arquivos
CREATE POLICY "Allow public read access to work-submissions"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'work-submissions');

-- Criar política para permitir que admins atualizem arquivos
CREATE POLICY "Allow authenticated updates to work-submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');

-- Criar política para permitir que admins deletem arquivos
CREATE POLICY "Allow authenticated deletes from work-submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'work-submissions');