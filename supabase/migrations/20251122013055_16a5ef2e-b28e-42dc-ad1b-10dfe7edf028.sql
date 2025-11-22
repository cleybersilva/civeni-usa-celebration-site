-- Publicar Dia 1 e Dia 2 da Programação Presencial
UPDATE civeni_program_days 
SET is_published = true 
WHERE event_slug = 'iii-civeni-2025' 
AND date IN ('2025-12-11', '2025-12-12');