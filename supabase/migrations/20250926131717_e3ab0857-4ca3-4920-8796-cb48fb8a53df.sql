-- Corrigir política RLS para permitir inserções públicas na tabela work_submissions
DROP POLICY IF EXISTS "work_submissions_insert_system_only" ON public.work_submissions;

-- Criar nova política que permite inserções públicas
CREATE POLICY "work_submissions_public_insert" 
ON public.work_submissions 
FOR INSERT 
WITH CHECK (true);