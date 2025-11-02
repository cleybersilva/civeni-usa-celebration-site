-- Atualizar todos os lotes para R$ 150,00 (15000 centavos)
UPDATE lotes 
SET price_cents = 15000, 
    updated_at = now()
WHERE price_cents != 15000;