-- Primeiro, verificar a política existente
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'banner_slides';

-- Corrigir as políticas RLS para banner_slides
-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "banner_slides_admin_all" ON public.banner_slides;
DROP POLICY IF EXISTS "banner_slides_public_read" ON public.banner_slides;

-- Criar nova política para admin com acesso total
CREATE POLICY "banner_slides_admin_full_access" 
ON public.banner_slides 
FOR ALL 
TO public
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Criar política para leitura pública apenas de slides ativos
CREATE POLICY "banner_slides_public_read_active" 
ON public.banner_slides 
FOR SELECT 
TO public
USING (is_active = true);

-- Verificar se a função is_current_user_admin está funcionando corretamente
SELECT is_current_user_admin();