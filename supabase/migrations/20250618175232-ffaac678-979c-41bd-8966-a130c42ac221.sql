
-- Marcar o usuário Cleyber Silva como admin root
UPDATE public.admin_users 
SET user_type = 'admin_root', is_admin_root = TRUE 
WHERE email = 'cleyber.silva@live.com';

-- Função para verificar se é admin root
CREATE OR REPLACE FUNCTION public.is_admin_root_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin_root FROM public.admin_users WHERE email = user_email),
    FALSE
  );
$$;

-- Função para verificar permissões por categoria
CREATE OR REPLACE FUNCTION public.check_user_permission(user_email TEXT, permission_type TEXT, resource TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN user_type = 'admin_root' THEN TRUE
      WHEN user_type = 'admin' AND resource IN ('banner', 'contador', 'copyright', 'inscricoes', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos') THEN TRUE
      WHEN user_type = 'design' AND resource IN ('banner', 'palestrantes', 'videos') THEN TRUE
      WHEN user_type = 'editor' AND resource IN ('contador', 'inscricoes', 'local', 'online', 'parceiros', 'textos') THEN TRUE
      ELSE FALSE
    END
  FROM public.admin_users
  WHERE email = user_email;
$$;
