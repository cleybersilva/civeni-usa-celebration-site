-- Adicionar política para permitir SELECT na tabela video_submissions para todos (dados públicos de submissões)
-- Como o admin panel precisa ler os dados sem autenticação Supabase Auth

-- Primeiro, dropar política existente se conflitar
DROP POLICY IF EXISTS "p_video_sub_select_all" ON public.video_submissions;

-- Criar política que permite SELECT para todos (anon e authenticated)
CREATE POLICY "p_video_sub_select_all" ON public.video_submissions
FOR SELECT
USING (true);

-- Manter política de admin para UPDATE e DELETE
-- Já existe p_video_sub_admin_all que usa is_current_user_admin()