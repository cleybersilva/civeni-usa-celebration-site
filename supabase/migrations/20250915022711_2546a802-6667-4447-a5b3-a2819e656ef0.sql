-- Remover a política problemática
DROP POLICY IF EXISTS "admin_users_select_direct" ON admin_users;

-- Criar uma política mais simples que permite SELECT para qualquer usuário autenticado
-- e verifica permissões na aplicação
CREATE POLICY "admin_users_authenticated_read" 
ON admin_users 
FOR SELECT 
USING (
  -- Permitir para usuários autenticados (a verificação de permissão será feita na aplicação)
  auth.jwt() IS NOT NULL
  OR
  -- Permitir queries diretas do sistema (sem JWT)
  current_setting('request.jwt.claims', true) IS NULL
);