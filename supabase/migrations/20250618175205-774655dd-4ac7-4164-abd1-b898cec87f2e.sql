
-- Primeiro, adicionar as novas categorias ao enum
ALTER TYPE public.admin_user_type ADD VALUE IF NOT EXISTS 'design';
ALTER TYPE public.admin_user_type ADD VALUE IF NOT EXISTS 'admin_root';

-- Adicionar nova coluna para identificar o admin root exclusivo
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS is_admin_root BOOLEAN DEFAULT FALSE;
