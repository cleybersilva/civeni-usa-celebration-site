-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_submissions_limite
  ON public.submissions (LOWER(email), LOWER(autor_principal), tipo)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_chave
  ON public.event_registrations (LOWER(email), LOWER(full_name), payment_status);

-- Função RPC para validar antes de submeter
CREATE OR REPLACE FUNCTION public.can_submit_trabalho(
  p_email TEXT,
  p_nome TEXT,
  p_tipo TEXT  -- 'artigo' ou 'consorcio'
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_inscrito BOOLEAN;
  v_qtd INT;
  v_limite CONSTANT INT := 3;
BEGIN
  -- Verifica inscrição válida (email + nome + status completed)
  SELECT EXISTS (
    SELECT 1
    FROM public.event_registrations er
    WHERE LOWER(er.email) = LOWER(p_email)
      AND LOWER(er.full_name) = LOWER(p_nome)
      AND er.payment_status = 'completed'
  ) INTO v_is_inscrito;

  IF NOT v_is_inscrito THEN
    RETURN QUERY SELECT FALSE, 'NOT_REGISTERED', 0;
    RETURN;
  END IF;

  -- Conta submissões ativas do mesmo tipo
  SELECT COUNT(*)
    INTO v_qtd
    FROM public.submissions s
   WHERE LOWER(s.email) = LOWER(p_email)
     AND LOWER(s.autor_principal) = LOWER(p_nome)
     AND LOWER(s.tipo) = LOWER(p_tipo)
     AND s.deleted_at IS NULL;

  IF v_qtd >= v_limite THEN
    RETURN QUERY SELECT FALSE, 'LIMIT_REACHED', 0;
  ELSE
    RETURN QUERY SELECT TRUE, NULL::TEXT, (v_limite - v_qtd);
  END IF;
END;
$$;

-- Gatilho para bloquear insert se ultrapassar limite
CREATE OR REPLACE FUNCTION public.enforce_submission_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT * INTO r
  FROM public.can_submit_trabalho(NEW.email, NEW.autor_principal, NEW.tipo);

  IF NOT r.allowed THEN
    IF r.reason = 'NOT_REGISTERED' THEN
      RAISE EXCEPTION 'NOT_REGISTERED';
    ELSIF r.reason = 'LIMIT_REACHED' THEN
      RAISE EXCEPTION 'LIMIT_REACHED';
    ELSE
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_submission_limit ON public.submissions;
CREATE TRIGGER trg_enforce_submission_limit
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_submission_limit();