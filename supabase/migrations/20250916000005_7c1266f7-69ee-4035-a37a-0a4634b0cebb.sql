-- Atualizar a data do evento para quinta-feira, 11 de dezembro de 2025
UPDATE event_config 
SET event_date = '2025-12-11',
    updated_at = now()
WHERE id IS NOT NULL;

-- Atualizar também na tabela counter_settings
UPDATE counter_settings 
SET event_date = '2025-12-11',
    updated_at = now()
WHERE id IS NOT NULL;