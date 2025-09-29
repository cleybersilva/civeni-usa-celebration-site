-- Criar cupom TEACHERCIVENI2025 para professores VCCU
-- Vinculado à categoria vccu_professor_partner (Professor VCCU - Parceiro gratuito)
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
  'category_override',
  100,
  'cad429f5-a341-46a0-853e-a0fc418a861c'::uuid,
  true,
  NULL,
  0
) ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  category_id = EXCLUDED.category_id,
  is_active = EXCLUDED.is_active,
  updated_at = now();