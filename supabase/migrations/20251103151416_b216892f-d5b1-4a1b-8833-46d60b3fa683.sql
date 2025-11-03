-- ========================================
-- MIGRAÇÃO: Correção de Validação de Inscrição com Normalização Robusta
-- Objetivo: Eliminar falsos-positivos na validação de submissão de trabalhos
-- ========================================

-- 1. Habilitar extensão unaccent para remover acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Funções de normalização canônicas
CREATE OR REPLACE FUNCTION public.normalize_text(txt text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
PARALLEL SAFE 
AS $$
  SELECT regexp_replace(
    unaccent(lower(trim(txt))),
    '\s+', ' ', 'g'
  )
$$;

CREATE OR REPLACE FUNCTION public.normalize_email(txt text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
PARALLEL SAFE 
AS $$
  SELECT regexp_replace(
    lower(trim(txt)),
    '\s+', '', 'g'
  )
$$;

-- 3. Adicionar colunas normalizadas à tabela event_registrations (se não existirem)
ALTER TABLE public.event_registrations 
  ADD COLUMN IF NOT EXISTS full_name_normalized text 
  GENERATED ALWAYS AS (public.normalize_text(full_name)) STORED;

ALTER TABLE public.event_registrations 
  ADD COLUMN IF NOT EXISTS email_normalized text 
  GENERATED ALWAYS AS (public.normalize_email(email)) STORED;

-- 4. Criar índices para acelerar buscas
CREATE INDEX IF NOT EXISTS idx_event_registrations_email_norm 
  ON public.event_registrations (email_normalized);

CREATE INDEX IF NOT EXISTS idx_event_registrations_name_norm 
  ON public.event_registrations (full_name_normalized);

CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status 
  ON public.event_registrations (payment_status);

-- 5. Adicionar colunas normalizadas à tabela submissions (se não existirem)
ALTER TABLE public.submissions 
  ADD COLUMN IF NOT EXISTS autor_principal_normalized text 
  GENERATED ALWAYS AS (public.normalize_text(autor_principal)) STORED;

CREATE INDEX IF NOT EXISTS idx_submissions_autor_norm 
  ON public.submissions (autor_principal_normalized);

CREATE INDEX IF NOT EXISTS idx_submissions_email_norm_existing 
  ON public.submissions (email_norm) 
  WHERE email_norm IS NOT NULL;

-- 6. Atualizar/criar função RPC robusta para validação de submissão
CREATE OR REPLACE FUNCTION public.can_submit_trabalho(
  p_email text,
  p_nome text,
  p_tipo text,
  p_evento text DEFAULT 'civeni-2025'
)
RETURNS TABLE(
  allowed boolean,
  reason text,
  remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_norm text;
  v_nome_norm text;
  v_is_registered boolean := false;
  v_registration_id uuid;
  v_submission_count integer := 0;
  v_max_submissions integer := 3;
  v_remaining integer;
BEGIN
  -- Normalizar inputs
  v_email_norm := normalize_email(COALESCE(p_email, ''));
  v_nome_norm := normalize_text(COALESCE(p_nome, ''));

  -- Validar inputs
  IF v_email_norm = '' AND v_nome_norm = '' THEN
    RETURN QUERY SELECT false, 'EMPTY_INPUT'::text, 0;
    RETURN;
  END IF;

  -- Lista de status válidos de inscrição
  -- Aceitar: paid, succeeded, confirmed, completed
  
  -- PASSO 1: Verificar inscrição por e-mail normalizado
  IF v_email_norm != '' THEN
    SELECT id INTO v_registration_id
    FROM event_registrations
    WHERE email_normalized = v_email_norm
      AND payment_status IN ('paid', 'succeeded', 'confirmed', 'completed')
      AND deleted_at IS NULL
    LIMIT 1;
    
    IF v_registration_id IS NOT NULL THEN
      v_is_registered := true;
    END IF;
  END IF;

  -- PASSO 2: Se não encontrou por e-mail, tentar por nome normalizado
  IF NOT v_is_registered AND v_nome_norm != '' THEN
    SELECT id INTO v_registration_id
    FROM event_registrations
    WHERE full_name_normalized = v_nome_norm
      AND payment_status IN ('paid', 'succeeded', 'confirmed', 'completed')
      AND deleted_at IS NULL
    LIMIT 1;
    
    IF v_registration_id IS NOT NULL THEN
      v_is_registered := true;
    END IF;
  END IF;

  -- Se não está inscrito, retornar NOT_REGISTERED
  IF NOT v_is_registered THEN
    RETURN QUERY SELECT false, 'NOT_REGISTERED'::text, 0;
    RETURN;
  END IF;

  -- PASSO 3: Contar submissões existentes do mesmo tipo
  SELECT COUNT(*)::integer INTO v_submission_count
  FROM submissions
  WHERE (
      email_norm = v_email_norm 
      OR autor_principal_normalized = v_nome_norm
    )
    AND tipo = p_tipo
    AND deleted_at IS NULL
    AND status NOT IN ('invalidado', 'arquivado');

  -- Calcular quantas submissões restam
  v_remaining := v_max_submissions - v_submission_count;

  -- Se atingiu o limite, retornar LIMIT_REACHED
  IF v_submission_count >= v_max_submissions THEN
    RETURN QUERY SELECT false, 'LIMIT_REACHED'::text, 0;
    RETURN;
  END IF;

  -- Sucesso: está inscrito e pode submeter
  RETURN QUERY SELECT true, 'OK'::text, v_remaining;
END;
$$;

-- 7. Comentários para documentação
COMMENT ON FUNCTION public.normalize_text(text) IS 
  'Normaliza texto removendo acentos, convertendo para minúsculas e colapsando espaços';

COMMENT ON FUNCTION public.normalize_email(text) IS 
  'Normaliza e-mail removendo espaços e convertendo para minúsculas';

COMMENT ON FUNCTION public.can_submit_trabalho(text, text, text, text) IS 
  'Valida se usuário está inscrito e pode submeter trabalho. Usa normalização robusta para evitar falsos-positivos.';