-- Criar cupom CIVENI2025FREE com 100% de desconto para Professor(a)
INSERT INTO coupon_codes (
  code,
  description,
  discount_type,
  discount_value,
  participant_type,
  is_active,
  status,
  usage_limit,
  used_count
) VALUES (
  'CIVENI2025FREE',
  'Cupom de 100% de desconto para Professor(a)',
  'percentage',
  100,
  'Professor(a)',
  true,
  'active',
  NULL,
  0
)
ON CONFLICT (code) 
DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  participant_type = EXCLUDED.participant_type,
  is_active = EXCLUDED.is_active,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  updated_at = now();