-- Criar cupom CIVENI2025FREE para Professor(a), Palestrante e Convidado(a)
-- Como o código do cupom é único e precisa funcionar para 3 tipos diferentes,
-- vamos deixar participant_type como NULL para aceitar qualquer tipo
-- A validação específica será feita na aplicação

INSERT INTO coupon_codes (
  code,
  description,
  discount_type,
  discount_value,
  category_id,
  participant_type,
  is_active,
  usage_limit,
  used_count,
  status,
  valid_from,
  valid_until
) VALUES (
  'CIVENI2025FREE',
  'Cupom 100% gratuito para Professores, Palestrantes e Convidados',
  'percentage',
  100,
  NULL,
  NULL, -- NULL permite que funcione para todos os tipos
  true,
  NULL, -- Sem limite de uso
  0,
  'active',
  now(),
  NULL -- Sem data de expiração
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  is_active = EXCLUDED.is_active,
  status = EXCLUDED.status,
  updated_at = now();