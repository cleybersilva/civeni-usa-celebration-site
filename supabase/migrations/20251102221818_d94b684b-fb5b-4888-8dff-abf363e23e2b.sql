-- Atualizar todos os lotes para R$ 200,00 (20000 centavos)
UPDATE lotes 
SET price_cents = 20000, 
    updated_at = now()
WHERE price_cents != 20000;