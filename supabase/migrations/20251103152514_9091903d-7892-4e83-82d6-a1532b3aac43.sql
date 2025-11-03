-- Corrigir função can_submit_trabalho (remover referência a deleted_at)
CREATE OR REPLACE FUNCTION public.can_submit_trabalho(
  p_email text,
  p_nome text,
  p_tipo text,
  p_evento text DEFAULT 'civeni-2025'
)
RETURNS TABLE (
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
  v_inscricao_id uuid;
  v_submissions_count integer;
  v_max_submissions integer := 3;
BEGIN
  -- Normalizar entradas
  v_email_norm := public.normalize_email(COALESCE(p_email, ''));
  v_nome_norm  := public.normalize_text(COALESCE(p_nome, ''));

  -- Validar entrada
  IF v_email_norm = '' AND v_nome_norm = '' THEN
    RETURN QUERY SELECT false, 'EMPTY_INPUT'::text, 0;
    RETURN;
  END IF;

  -- Verificar inscrição (primeiro por e-mail, depois por nome)
  SELECT id INTO v_inscricao_id 
  FROM event_registrations
  WHERE email_normalized = v_email_norm
    AND payment_status IN ('paid', 'succeeded', 'confirmed', 'completed')
  LIMIT 1;

  IF v_inscricao_id IS NULL AND v_nome_norm <> '' THEN
    SELECT id INTO v_inscricao_id
    FROM event_registrations
    WHERE full_name_normalized = v_nome_norm
      AND payment_status IN ('paid', 'succeeded', 'confirmed', 'completed')
    LIMIT 1;
  END IF;

  -- Se não encontrou inscrição válida
  IF v_inscricao_id IS NULL THEN
    RETURN QUERY SELECT false, 'NOT_REGISTERED'::text, 0;
    RETURN;
  END IF;

  -- Contar submissões existentes (por e-mail OU nome do autor principal)
  SELECT COUNT(*) INTO v_submissions_count
  FROM submissions
  WHERE tipo = p_tipo
    AND (
      email_normalized = v_email_norm
      OR autor_principal_normalized = v_nome_norm
    )
    AND status NOT IN ('arquivado', 'cancelado');

  -- Verificar limite
  IF v_submissions_count >= v_max_submissions THEN
    RETURN QUERY SELECT false, 'LIMIT_REACHED'::text, 0;
    RETURN;
  END IF;

  -- Sucesso
  RETURN QUERY SELECT true, 'OK'::text, (v_max_submissions - v_submissions_count);
END;
$$;