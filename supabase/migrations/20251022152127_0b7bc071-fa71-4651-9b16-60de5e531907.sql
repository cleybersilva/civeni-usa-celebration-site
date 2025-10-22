-- SOLUÇÃO DEFINITIVA: Remover todas as restrições de RLS do bucket work-submissions

-- 1. Garantir que o bucket existe e é público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-submissions', 
  'work-submissions', 
  true,
  10485760, -- 10MB em bytes
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[];

-- 2. Remover TODAS as políticas RLS existentes
DROP POLICY IF EXISTS "work_submissions_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_public_select" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can view work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can update work submissions metadata" ON storage.objects;

-- 3. Criar UMA ÚNICA política permissiva para todos os usuários (incluindo anônimos)
CREATE POLICY "work_submissions_public_all_access"
ON storage.objects
FOR ALL
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');