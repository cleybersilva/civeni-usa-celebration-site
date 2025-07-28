-- Corrigir políticas RLS para hybrid_format_config
-- Remover as políticas existentes
DROP POLICY IF EXISTS "hybrid_format_admin_all" ON public.hybrid_format_config;
DROP POLICY IF EXISTS "hybrid_format_public_read" ON public.hybrid_format_config;

-- Criar nova política para leitura pública (atividades ativas)
CREATE POLICY "hybrid_format_public_read" 
ON public.hybrid_format_config 
FOR SELECT 
TO public
USING (is_active = true);

-- Criar política para administradores (todas as operações)
CREATE POLICY "hybrid_format_admin_all" 
ON public.hybrid_format_config 
FOR ALL 
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.email = current_setting('app.current_user_email', true)
    AND (au.user_type = 'admin' OR au.is_admin_root = true)
  )
);