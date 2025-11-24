-- Criar bucket 'certificates' para armazenar PDFs de certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política para permitir leitura pública de todos os certificados
CREATE POLICY "Certificados são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

-- Política para permitir upload de certificados (apenas por service role ou autenticados)
CREATE POLICY "Permitir upload de certificados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');