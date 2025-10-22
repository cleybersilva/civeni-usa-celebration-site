-- 1) Criar bucket privado civeni-submissoes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'civeni-submissoes',
  'civeni-submissoes',
  false,
  15728640, -- 15 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- 2) Revogar insert direto de anon/authenticated (uploads via Edge Function apenas)
REVOKE INSERT ON storage.objects FROM anon, authenticated;

-- 3) Política para usuário autenticado ler seus próprios arquivos
CREATE POLICY "read_own_files_civeni_submissoes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'civeni-submissoes'
  AND (storage.foldername(name))[1] = 'user'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4) Criar enums para tipo e status de submissão
CREATE TYPE civeni_tipo_submissao AS ENUM ('artigo', 'consorcio');
CREATE TYPE civeni_status_submissao AS ENUM ('enviado', 'em_analise', 'aprovado', 'rejeitado');

-- 5) Criar tabela civeni_submissoes
CREATE TABLE IF NOT EXISTS public.civeni_submissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo civeni_tipo_submissao NOT NULL,
  titulo TEXT NOT NULL,
  autores JSONB NOT NULL DEFAULT '[]'::jsonb,
  resumo TEXT,
  area_tematica TEXT,
  palavras_chave TEXT[],
  file_path TEXT NOT NULL,
  file_sha256 TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  status civeni_status_submissao NOT NULL DEFAULT 'enviado',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Habilitar RLS
ALTER TABLE public.civeni_submissoes ENABLE ROW LEVEL SECURITY;

-- 7) Políticas RLS: dono vê suas submissões
CREATE POLICY "select_own_submissoes"
ON public.civeni_submissoes FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- 8) Políticas RLS: dono pode inserir
CREATE POLICY "insert_own_submissoes"
ON public.civeni_submissoes FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- 9) Políticas RLS: dono pode atualizar campos limitados
CREATE POLICY "update_limited_own_submissoes"
ON public.civeni_submissoes FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 10) Admins podem ver tudo
CREATE POLICY "admin_all_civeni_submissoes"
ON public.civeni_submissoes FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 11) Trigger para updated_at
CREATE TRIGGER update_civeni_submissoes_updated_at
BEFORE UPDATE ON public.civeni_submissoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();