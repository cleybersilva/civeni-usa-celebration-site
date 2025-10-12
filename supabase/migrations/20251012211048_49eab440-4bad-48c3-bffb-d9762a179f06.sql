-- Atualizar cupom CIVENI2025FREE para aceitar Professor(a) e Palestrantes
UPDATE coupon_codes
SET 
  participant_type = 'Professor(a),Palestrantes',
  description = 'Cupom de 100% de desconto para Professor(a) e Palestrantes',
  updated_at = now()
WHERE code = 'CIVENI2025FREE';