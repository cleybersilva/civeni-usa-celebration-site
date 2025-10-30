-- Criar bucket de storage para submissões
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'civeni-submissoes',
  'civeni-submissoes',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Allow service role to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'civeni-submissoes' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Allow admins to read submissions" ON storage.objects
FOR SELECT USING (
  bucket_id = 'civeni-submissoes' AND
  is_current_user_admin()
);

CREATE POLICY "Allow service role to read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'civeni-submissoes' AND
  auth.role() = 'service_role'
);