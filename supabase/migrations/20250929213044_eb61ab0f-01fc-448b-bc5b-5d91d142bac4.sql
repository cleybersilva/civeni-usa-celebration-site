-- Ajustar tabela coupon_codes para suportar validação robusta
ALTER TABLE public.coupon_codes 
ADD COLUMN IF NOT EXISTS participant_type text,
ADD COLUMN IF NOT EXISTS valid_from timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS valid_until timestamptz,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Criar índice para busca case-insensitive performática
CREATE INDEX IF NOT EXISTS idx_coupon_codes_upper ON public.coupon_codes (upper(code));

-- Criar tabela de resgates para evitar duplicidade
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (coupon_id, email)
);

-- RLS para coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Dropar política se existir e recriar
DROP POLICY IF EXISTS coupon_redemptions_admin_only ON public.coupon_redemptions;

CREATE POLICY coupon_redemptions_admin_only
ON public.coupon_redemptions
FOR ALL
USING (is_current_user_admin());

-- Função RPC de validação robusta
CREATE OR REPLACE FUNCTION public.validate_coupon_robust(
  p_code text,
  p_email text,
  p_participant_type text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupon_codes;
  v_now timestamptz := now(); -- UTC
  v_code text := upper(trim(p_code));
  v_msg text;
BEGIN
  -- Busca normalizada (case-insensitive, trim)
  SELECT * INTO v_coupon
  FROM public.coupon_codes
  WHERE upper(trim(code)) = v_code
  LIMIT 1;

  -- Cupom não encontrado
  IF v_coupon.id IS NULL THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'not_found', 
      'message', 'Cupom não encontrado.'
    );
  END IF;

  -- Cupom inativo
  IF v_coupon.is_active = false OR COALESCE(v_coupon.status, 'active') <> 'active' THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'inactive', 
      'message', 'Cupom pausado ou indisponível.'
    );
  END IF;

  -- Verificar janela de validade (timezone-aware)
  IF v_coupon.valid_from IS NOT NULL AND v_now < v_coupon.valid_from THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'not_started', 
      'message', 'Cupom ainda não está disponível.'
    );
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_now > v_coupon.valid_until THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'expired', 
      'message', 'Cupom expirado.'
    );
  END IF;

  -- Verificar limite de usos
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'sold_out', 
      'message', 'Limite de usos atingido.'
    );
  END IF;

  -- Verificar tipo de participante (se especificado)
  IF v_coupon.participant_type IS NOT NULL AND p_participant_type IS NOT NULL 
     AND v_coupon.participant_type <> p_participant_type THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'wrong_participant', 
      'message', 'Cupom não válido para este tipo de participante.'
    );
  END IF;

  -- Verificar categoria (se especificado)
  IF v_coupon.category_id IS NOT NULL AND p_category_id IS NOT NULL 
     AND v_coupon.category_id <> p_category_id THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'wrong_category', 
      'message', 'Cupom não válido para esta categoria.'
    );
  END IF;

  -- Verificar se já foi usado por este e-mail
  IF EXISTS (
    SELECT 1 FROM public.coupon_redemptions 
    WHERE coupon_id = v_coupon.id 
    AND lower(trim(email)) = lower(trim(p_email))
  ) THEN
    RETURN jsonb_build_object(
      'is_valid', false, 
      'reason', 'already_used', 
      'message', 'Este e-mail já utilizou este cupom.'
    );
  END IF;

  -- Cupom válido!
  v_msg := 'Cupom válido! Inscrição gratuita confirmada.';

  RETURN jsonb_build_object(
    'is_valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'category_id', v_coupon.category_id,
    'message', v_msg
  );
END;
$$;

-- Inserir/atualizar cupom TEACHERCIVENI2025
INSERT INTO public.coupon_codes (
  code, 
  is_active, 
  status,
  discount_type, 
  discount_value,
  participant_type,
  usage_limit,
  used_count,
  valid_from,
  valid_until,
  description
)
VALUES (
  'TEACHERCIVENI2025',
  true,
  'active',
  'category_override',
  100,
  'professor',
  NULL,
  0,
  '2025-01-01T00:00:00Z'::timestamptz,
  '2025-12-31T23:59:59Z'::timestamptz,
  'Cortesia para professores VCCU - Inscrição gratuita'
)
ON CONFLICT (code) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  status = EXCLUDED.status,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  participant_type = EXCLUDED.participant_type,
  usage_limit = EXCLUDED.usage_limit,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  description = EXCLUDED.description,
  updated_at = now();