-- 1. Criar tipos de participantes se não existirem
INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
VALUES 
  ('Professor(a)', 'Professor(a) VCCU - Parceiro', false, true),
  ('Palestrantes', 'Palestrantes do evento', false, true)
ON CONFLICT DO NOTHING;

-- 2. Criar categoria gratuita para Palestrantes
INSERT INTO public.event_category (
  event_id,
  slug,
  title_pt,
  title_en,
  title_es,
  title_tr,
  description_pt,
  is_free,
  is_active,
  order_index,
  currency,
  price_cents
)
SELECT 
  e.id,
  'palestrantes-vccu-gratuito',
  'Palestrantes VCCU - Parceiro GRATUITO',
  'Speakers VCCU - Partner FREE',
  'Ponentes VCCU - Socio GRATIS',
  'Konuşmacılar VCCU - Ortak ÜCRETSİZ',
  'Categoria gratuita para palestrantes do evento',
  true,
  true,
  5,
  'BRL',
  0
FROM events e
WHERE e.slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

-- 3. Atualizar função de validação para suportar múltiplos tipos de participantes
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
  v_now timestamptz := now();
  v_code text := upper(trim(p_code));
  v_msg text;
  v_participant_types text[];
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

  -- Verificar tipo de participante (suporta múltiplos tipos separados por vírgula)
  IF v_coupon.participant_type IS NOT NULL AND p_participant_type IS NOT NULL THEN
    -- Dividir participant_type em array
    v_participant_types := string_to_array(v_coupon.participant_type, ',');
    
    -- Verificar se o tipo informado está no array (case-insensitive e trim)
    IF NOT EXISTS (
      SELECT 1 
      FROM unnest(v_participant_types) AS pt
      WHERE lower(trim(pt)) = lower(trim(p_participant_type))
    ) THEN
      RETURN jsonb_build_object(
        'is_valid', false, 
        'reason', 'wrong_participant', 
        'message', 'Cupom não válido para este tipo de participante.'
      );
    END IF;
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