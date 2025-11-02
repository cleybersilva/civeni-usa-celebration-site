-- ============================================================================
-- Varredura & Correção de Elegibilidade de Submissões (Civeni 2025)
-- Normaliza email/nome, cria cache de elegibilidade, atualiza can_submit_trabalho
-- ============================================================================

-- 1.1 Extensão para remover acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1.2 Colunas normalizadas em event_registrations
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS email_norm text,
  ADD COLUMN IF NOT EXISTS nome_norm text;

-- 1.3 Colunas normalizadas em submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS email_norm text,
  ADD COLUMN IF NOT EXISTS nome_norm text;

-- 1.4 Backfill normalizado (trim, lower, unaccent, compress spaces)
UPDATE public.event_registrations
SET 
  email_norm = lower(trim(email)),
  nome_norm = lower(regexp_replace(unaccent(trim(full_name)), '\s+', ' ', 'g'))
WHERE email_norm IS NULL OR nome_norm IS NULL;

UPDATE public.submissions
SET 
  email_norm = lower(trim(email)),
  nome_norm = lower(regexp_replace(unaccent(trim(autor_principal)), '\s+', ' ', 'g'))
WHERE email_norm IS NULL OR nome_norm IS NULL;

-- 1.5 Triggers para manter normalização em futuros inserts/updates
CREATE OR REPLACE FUNCTION public._normalize_event_registrations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.email_norm := lower(trim(NEW.email));
  NEW.nome_norm := lower(regexp_replace(unaccent(trim(NEW.full_name)), '\s+', ' ', 'g'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_event_registrations ON public.event_registrations;
CREATE TRIGGER trg_normalize_event_registrations
BEFORE INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public._normalize_event_registrations();

CREATE OR REPLACE FUNCTION public._normalize_submissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.email_norm := lower(trim(NEW.email));
  NEW.nome_norm := lower(regexp_replace(unaccent(trim(NEW.autor_principal)), '\s+', ' ', 'g'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_submissions ON public.submissions;
CREATE TRIGGER trg_normalize_submissions
BEFORE INSERT OR UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public._normalize_submissions();

-- 1.6 Índices para batida rápida por evento/inscrito/tipo
CREATE INDEX IF NOT EXISTS idx_event_registrations_norm
  ON public.event_registrations (email_norm, nome_norm)
  WHERE payment_status = 'completed';

CREATE INDEX IF NOT EXISTS idx_submissions_norm_tipo
  ON public.submissions (email_norm, nome_norm, tipo)
  WHERE deleted_at IS NULL;

-- 2. Tabela de elegibilidade única (cache de inscritos válidos)
DROP TABLE IF EXISTS public.inscricoes_elegiveis CASCADE;

CREATE TABLE public.inscricoes_elegiveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id uuid NOT NULL,
  email text NOT NULL,
  email_norm text NOT NULL,
  full_name text NOT NULL,
  nome_norm text NOT NULL,
  payment_status text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inscricoes_elegiveis_norm
  ON public.inscricoes_elegiveis (email_norm, nome_norm);

-- 2.1 Popular tabela de elegibilidade (one-shot inicial)
INSERT INTO public.inscricoes_elegiveis (
  inscricao_id, email, email_norm, full_name, nome_norm, payment_status, computed_at
)
SELECT
  er.id,
  er.email,
  lower(trim(er.email)),
  er.full_name,
  lower(regexp_replace(unaccent(trim(er.full_name)), '\s+', ' ', 'g')),
  er.payment_status,
  now()
FROM public.event_registrations er
WHERE er.payment_status = 'completed';

-- 3. Remover TODAS as versões da função can_submit_trabalho
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc
    WHERE proname = 'can_submit_trabalho'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- 3.1 Recriar trigger que depende da função (será recriado depois)
DROP TRIGGER IF EXISTS trg_enforce_submission_limit ON public.submissions;

-- 3.2 Criar nova versão da função com normalização
CREATE FUNCTION public.can_submit_trabalho(
  p_email text,
  p_nome text,
  p_tipo text,
  p_evento text
)
RETURNS TABLE(allowed boolean, reason text, remaining int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_is_inscrito boolean;
  v_qtd int;
  v_limite constant int := 3;
  v_email_norm text;
  v_nome_norm text;
BEGIN
  -- Normaliza entrada
  v_email_norm := lower(trim(p_email));
  v_nome_norm := lower(regexp_replace(unaccent(trim(p_nome)), '\s+', ' ', 'g'));

  -- Verifica inscrição elegível (via cache de elegibilidade)
  SELECT EXISTS (
    SELECT 1
    FROM public.inscricoes_elegiveis ie
    WHERE ie.email_norm = v_email_norm
      AND ie.nome_norm = v_nome_norm
  ) INTO v_is_inscrito;

  IF NOT v_is_inscrito THEN
    RETURN QUERY SELECT false, 'NOT_REGISTERED', 0;
    RETURN;
  END IF;

  -- Contagem de submissões ativas do mesmo tipo
  SELECT count(*)
  INTO v_qtd
  FROM public.submissions s
  WHERE s.email_norm = v_email_norm
    AND s.nome_norm = v_nome_norm
    AND upper(s.tipo) = upper(p_tipo)
    AND s.deleted_at IS NULL;

  IF v_qtd >= v_limite THEN
    RETURN QUERY SELECT false, 'LIMIT_REACHED', 0;
  ELSE
    RETURN QUERY SELECT true, NULL::text, (v_limite - v_qtd);
  END IF;
END;
$$;

-- 3.3 Recriar trigger de proteção
CREATE TRIGGER trg_enforce_submission_limit
BEFORE INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_submission_limit();

-- 4. Função para recalcular elegibilidade (para jobs recorrentes)
CREATE OR REPLACE FUNCTION public.refresh_inscricoes_elegiveis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  TRUNCATE TABLE public.inscricoes_elegiveis;
  
  INSERT INTO public.inscricoes_elegiveis (
    inscricao_id, email, email_norm, full_name, nome_norm, payment_status, computed_at
  )
  SELECT
    er.id,
    er.email,
    lower(trim(er.email)),
    er.full_name,
    lower(regexp_replace(unaccent(trim(er.full_name)), '\s+', ' ', 'g')),
    er.payment_status,
    now()
  FROM public.event_registrations er
  WHERE er.payment_status = 'completed';
END;
$$;

-- 5. RLS para inscricoes_elegiveis (admin pode ver, função pode consultar)
ALTER TABLE public.inscricoes_elegiveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY inscricoes_elegiveis_admin_read
  ON public.inscricoes_elegiveis
  FOR SELECT
  USING (is_current_user_admin());

-- 6. Comentários para documentação
COMMENT ON TABLE public.inscricoes_elegiveis IS 
  'Cache de inscritos elegíveis para submissões. Atualizar via refresh_inscricoes_elegiveis()';

COMMENT ON FUNCTION public.can_submit_trabalho IS 
  'Valida se inscrito pode submeter trabalho (3 artigos + 3 consórcios). Usa normalização de email/nome.';

COMMENT ON FUNCTION public.refresh_inscricoes_elegiveis IS 
  'Recalcula cache de elegibilidade. Executar periodicamente (ex: pg_cron a cada 3h).';