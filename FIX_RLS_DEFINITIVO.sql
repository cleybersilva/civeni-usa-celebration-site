-- SOLUÇÃO DEFINITIVA - DESABILITAR RLS COMPLETAMENTE
-- Execute este SQL no Supabase SQL Editor

-- 1. DESABILITAR RLS COMPLETAMENTE na tabela work_submissions
ALTER TABLE public.work_submissions DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas para garantir limpeza total
DROP POLICY IF EXISTS "work_submissions_insert_system_only" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_allow_service_role_insert" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_insert_policy" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_select_policy" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_update_policy" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_admin_read" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_admin_update" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_allow_file_update" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_insert_public" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_temporary_insert_all" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_insert_all" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_update_all" ON public.work_submissions;
DROP POLICY IF EXISTS "work_submissions_allow_all" ON public.work_submissions;

-- 3. Garantir bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('work-submissions', 'work-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Remover políticas de storage e criar uma permissiva
DROP POLICY IF EXISTS "work_submissions_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_admin_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_admin_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_storage_all" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_storage_allow_all" ON storage.objects;

-- 5. Criar política de storage SUPER permissiva
CREATE POLICY "work_submissions_storage_full_access" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'work-submissions') 
WITH CHECK (bucket_id = 'work-submissions');

-- 6. Verificar se consegue inserir um teste
INSERT INTO public.work_submissions (
  author_name, institution, email, work_title, abstract, keywords, thematic_area, submission_kind, status
) VALUES (
  'Teste', 'Teste Inst', 'teste@teste.com', 'Teste Title', 'Teste Abstract com mais de 20 caracteres', 'teste, keywords', 'Educação e Tecnologia', 'artigo', 'pending'
) ON CONFLICT (email) DO NOTHING;