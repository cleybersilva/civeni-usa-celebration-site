-- Corrigir políticas de acesso ao bucket civeni-submissoes para admins

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admins podem acessar submissões" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem baixar arquivos de submissões" ON storage.objects;

-- Criar política para permitir que admins vejam todos os arquivos do bucket
CREATE POLICY "Admins podem acessar submissões"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'civeni-submissoes' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Criar política para permitir acesso público de leitura (já que o bucket é público)
DROP POLICY IF EXISTS "Acesso público de leitura" ON storage.objects;
CREATE POLICY "Acesso público de leitura"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'civeni-submissoes');