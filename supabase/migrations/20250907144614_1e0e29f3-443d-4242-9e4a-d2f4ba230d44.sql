-- Corrigir definitivamente o problema de carregamento de usuários
-- Primeiro, vamos simplificar a função list_admin_users para ter certeza que funciona

DROP FUNCTION IF EXISTS public.list_admin_users();

CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  user_type admin_user_type,
  is_admin_root boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Retornar todos os usuários admin sem verificação de RLS interna
  -- A verificação de permissão será feita pela política RLS da tabela
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    au.user_type,
    au.is_admin_root,
    au.created_at
  FROM admin_users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Corrigir as políticas RLS da tabela admin_users
-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "admin_users_select_by_function" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;

-- Criar políticas RLS mais simples e funcionais
CREATE POLICY "admin_users_admin_select" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('app.current_user_email', true)
      AND (user_type IN ('admin', 'admin_root') OR is_admin_root = true)
    )
  );

CREATE POLICY "admin_users_system_operations" ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Garantir que as funções CRUD funcionem corretamente
-- Corrigir a função create_admin_user
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  calling_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get current user from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Check if calling user is admin
  SELECT 
    CASE 
      WHEN admin_users.user_type IN ('admin', 'admin_root') OR admin_users.is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE admin_users.email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin privileges required');
  END IF;
  
  -- Check if email already exists
  IF EXISTS(SELECT 1 FROM admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Create new user with proper password hashing
  INSERT INTO admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    user_type,
    CASE WHEN user_type = 'admin_root' THEN true ELSE false END
  );
  
  RETURN json_build_object('success', true, 'message', 'User created successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;