-- Tornar created_by opcional para permitir submissões anônimas
ALTER TABLE public.civeni_submissoes
ALTER COLUMN created_by DROP NOT NULL;

-- Atualizar políticas RLS para permitir INSERT sem autenticação
DROP POLICY IF EXISTS "insert_own_submissoes" ON public.civeni_submissoes;

CREATE POLICY "insert_submissoes_public"
ON public.civeni_submissoes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Manter política de select apenas para autenticados verem suas próprias
-- (submissões anônimas não serão vistas pelo submissor)
DROP POLICY IF EXISTS "select_own_submissoes" ON public.civeni_submissoes;

CREATE POLICY "select_submissoes_authenticated"
ON public.civeni_submissoes FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL);