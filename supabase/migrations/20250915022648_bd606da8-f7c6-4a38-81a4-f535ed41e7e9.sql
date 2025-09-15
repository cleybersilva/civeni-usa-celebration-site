-- Criar uma nova política RLS para admin_users que permite SELECT direto para admin users
-- Primeiro, vamos dropar a política existente
DROP POLICY IF EXISTS "admin_users_select_by_function" ON admin_users;

-- Criar nova política que verifica diretamente o tipo de usuário na tabela auth
CREATE POLICY "admin_users_select_direct" 
ON admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM admin_users au 
    WHERE au.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND (au.user_type = 'admin' OR au.user_type = 'admin_root' OR au.is_admin_root = true)
  )
  OR
  -- Fallback: permitir se não há contexto JWT (queries diretas do Supabase client)
  current_setting('request.jwt.claims', true) IS NULL
  OR
  current_setting('request.jwt.claims', true) = ''
);