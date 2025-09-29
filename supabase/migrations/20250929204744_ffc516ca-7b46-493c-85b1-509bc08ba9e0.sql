-- Criar cupom TEACHERCIVENI2025 para professores VCCU
-- Cupom sem category_id específico, pois será do tipo category_override
INSERT INTO public.coupon_codes (
  code,
  description,
  discount_type,
  discount_value,
  category_id,
  is_active,
  usage_limit,
  used_count
) VALUES (
  'TEACHERCIVENI2025',
  'Cupom exclusivo para professores VCCU - Inscrição gratuita no CIVENI 2025',
  'percentage',
  100,
  NULL,
  true,
  NULL, -- sem limite de uso
  0
) ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  is_active = EXCLUDED.is_active,
  updated_at = now();