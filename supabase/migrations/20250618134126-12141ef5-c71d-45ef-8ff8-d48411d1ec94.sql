
-- Criar enum para tipos de usuário
CREATE TYPE public.admin_user_type AS ENUM ('admin', 'editor', 'viewer');

-- Criar tabela para usuários administrativos
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type admin_user_type NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir usuário admin root
INSERT INTO public.admin_users (email, password_hash, user_type) 
VALUES ('cleyber.silva@live.com', crypt('$Cleyber2025EUA', gen_salt('bf')), 'admin');

-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar função para verificar login
CREATE OR REPLACE FUNCTION public.verify_admin_login(user_email TEXT, user_password TEXT)
RETURNS TABLE(user_id UUID, email TEXT, user_type admin_user_type)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, admin_users.email, admin_users.user_type
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
$$;

-- Criar função para recuperação de senha (placeholder)
CREATE OR REPLACE FUNCTION public.request_password_reset(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE email = user_email
  );
$$;
