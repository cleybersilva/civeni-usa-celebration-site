-- Criar políticas RLS para permitir que admins acessem arquivos de submissões
-- Policy para SELECT (necessária para createSignedUrl)
CREATE POLICY "Admin can read submission files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'civeni-submissoes' 
  AND is_current_user_admin()
);

-- Policy para permitir service_role acessar tudo
CREATE POLICY "Service role can access all submission files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'civeni-submissoes')
WITH CHECK (bucket_id = 'civeni-submissoes');