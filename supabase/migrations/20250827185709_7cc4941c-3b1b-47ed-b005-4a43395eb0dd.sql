-- Atualizar o preço da categoria "Aluno(a) VCCU – Promocional" de R$ 70,00 para R$ 75,00
UPDATE public.event_category 
SET 
  price_cents = 7500,
  sync_status = 'pending',
  updated_at = now()
WHERE id = '15418895-0c45-4105-a47b-c761839cfe25' 
  AND title_pt = 'Aluno(a) VCCU – Promocional';