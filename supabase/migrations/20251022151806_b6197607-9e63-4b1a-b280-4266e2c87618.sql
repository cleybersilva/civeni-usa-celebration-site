-- Criar o bucket work-submissions se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-submissions', 'work-submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover TODAS as políticas existentes do bucket work-submissions para evitar conflitos
DROP POLICY IF EXISTS "Allow anonymous uploads to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can view work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can update work submissions metadata" ON storage.objects;

-- Criar política ÚNICA para permitir uploads anônimos
CREATE POLICY "work_submissions_anon_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'work-submissions' 
  AND (storage.foldername(name))[1] = 'submissions'
);

-- Criar política para leitura pública
CREATE POLICY "work_submissions_public_select"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'work-submissions');

-- Criar política para admins atualizarem
CREATE POLICY "work_submissions_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');

-- Criar política para admins deletarem
CREATE POLICY "work_submissions_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'work-submissions');