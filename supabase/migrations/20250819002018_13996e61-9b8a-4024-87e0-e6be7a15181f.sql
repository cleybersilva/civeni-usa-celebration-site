-- Phase 1 Security Fixes

-- 1. Drop/revoke legacy GUC setter (keep only the secure version)
DROP FUNCTION IF EXISTS public.set_current_user_email(text);

-- 2. Revoke legacy login RPCs (keep only secure versions)
REVOKE ALL ON FUNCTION public.simple_admin_login(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.temp_admin_login(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_admin_login(text, text) FROM PUBLIC;

-- 3. Protect coupon codes - remove public read access
DROP POLICY IF EXISTS "Allow public read on coupon_codes" ON public.coupon_codes;

-- Add admin-only policy for coupon codes
CREATE POLICY "coupon_codes_admin_only"
ON public.coupon_codes
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 4. Create server-side logout function for token revocation
CREATE OR REPLACE FUNCTION public.revoke_admin_session(user_email text, session_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete the matching session
  DELETE FROM public.admin_sessions 
  WHERE email = user_email AND token = session_token;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Session revoked successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Session not found');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Error revoking session');
END;
$$;

-- 5. Fix search_path for remaining SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode atualizar usuários
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode atualizar usuários');
  END IF;
  
  -- Obter email do usuário a ser atualizado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir alterar o admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível alterar o admin root principal');
  END IF;
  
  -- Atualizar o tipo do usuário
  UPDATE public.admin_users 
  SET user_type = new_user_type, updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Usuário atualizado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_user_password(user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode atualizar senhas
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode atualizar senhas');
  END IF;
  
  -- Obter email do usuário a ser atualizado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir alterar a senha do admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível alterar a senha do admin root principal');
  END IF;
  
  -- Atualizar a senha do usuário
  UPDATE public.admin_users 
  SET password_hash = crypt(new_password, gen_salt('bf')), updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Senha atualizada com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_type admin_user_type DEFAULT 'viewer'::admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  calling_user_email TEXT;
  is_root BOOLEAN;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode criar usuários
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode criar usuários');
  END IF;
  
  -- Verificar se o email já existe
  IF EXISTS(SELECT 1 FROM public.admin_users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email já cadastrado');
  END IF;
  
  -- Criar o novo usuário
  INSERT INTO public.admin_users (email, password_hash, user_type, is_admin_root)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    user_type,
    CASE WHEN user_type = 'admin_root' THEN true ELSE false END
  );
  
  RETURN json_build_object('success', true, 'message', 'Usuário criado com sucesso');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_email TEXT;
BEGIN
  -- Obter email do usuário a ser deletado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir deletar o admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível deletar o admin root principal');
  END IF;
  
  -- Deletar o usuário
  DELETE FROM public.admin_users WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Usuário deletado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$$;