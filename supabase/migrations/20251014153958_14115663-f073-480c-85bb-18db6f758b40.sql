-- Criar bucket de storage para work submissions (público para leitura, sem autenticação para escrita)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-submissions',
  'work-submissions',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Permitir upload público de arquivos (sem autenticação necessária)
CREATE POLICY "Allow public upload to work-submissions"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'work-submissions');

-- Permitir leitura apenas para admins
CREATE POLICY "Allow admin read from work-submissions"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'work-submissions' 
  AND is_current_user_admin()
);

-- Garantir que a tabela work_submissions tenha os campos corretos
ALTER TABLE work_submissions
DROP COLUMN IF EXISTS file_path,
DROP COLUMN IF EXISTS file_name;

ALTER TABLE work_submissions
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_size bigint;