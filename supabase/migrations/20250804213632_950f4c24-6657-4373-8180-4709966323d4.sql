-- Corrigir as políticas RLS para a tabela civeni_ii_2024_images
-- Primeiro, remover as políticas existentes
DROP POLICY IF EXISTS "civeni_ii_2024_images_admin_all" ON civeni_ii_2024_images;
DROP POLICY IF EXISTS "civeni_ii_2024_images_public_read" ON civeni_ii_2024_images;

-- Criar novas políticas mais específicas
-- Política para leitura pública (apenas imagens ativas)
CREATE POLICY "civeni_images_public_read" 
ON civeni_ii_2024_images 
FOR SELECT 
USING (is_active = true);

-- Política para admins - todas as operações
CREATE POLICY "civeni_images_admin_select" 
ON civeni_ii_2024_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND (user_type = 'admin' OR user_type = 'admin_root' OR is_admin_root = true)
  )
);

CREATE POLICY "civeni_images_admin_insert" 
ON civeni_ii_2024_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND (user_type = 'admin' OR user_type = 'admin_root' OR is_admin_root = true)
  )
);

CREATE POLICY "civeni_images_admin_update" 
ON civeni_ii_2024_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND (user_type = 'admin' OR user_type = 'admin_root' OR is_admin_root = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND (user_type = 'admin' OR user_type = 'admin_root' OR is_admin_root = true)
  )
);

CREATE POLICY "civeni_images_admin_delete" 
ON civeni_ii_2024_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true) 
    AND (user_type = 'admin' OR user_type = 'admin_root' OR is_admin_root = true)
  )
);