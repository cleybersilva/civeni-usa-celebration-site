-- Remover políticas existentes e criar novas mais permissivas
DROP POLICY IF EXISTS "Permitir acesso público para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de imagens autenticadas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens autenticadas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens autenticadas" ON storage.objects;

-- Criar políticas mais permissivas para o bucket 'media'
CREATE POLICY "Media bucket - public read access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Media bucket - public insert access" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Media bucket - public update access" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'media');

CREATE POLICY "Media bucket - public delete access" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'media');