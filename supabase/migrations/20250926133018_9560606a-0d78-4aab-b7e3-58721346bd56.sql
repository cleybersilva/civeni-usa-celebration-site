-- Criar políticas RLS para o bucket work-submissions
-- Permitir uploads públicos para submissões de trabalhos
CREATE POLICY "Allow public uploads to work-submissions bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'work-submissions');

-- Permitir que admins vejam todos os arquivos
CREATE POLICY "Allow admins to view work-submissions files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'work-submissions' AND is_current_user_admin());

-- Permitir que admins façam update dos arquivos
CREATE POLICY "Allow admins to update work-submissions files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'work-submissions' AND is_current_user_admin());

-- Permitir que admins deletem arquivos
CREATE POLICY "Allow admins to delete work-submissions files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'work-submissions' AND is_current_user_admin());