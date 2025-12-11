-- Extend "Último Lote" registration period until December 13, 2025 at 12:00 PM (Brasília time)
UPDATE lotes 
SET dt_fim = '2025-12-13',
    updated_at = now()
WHERE id = 'f79e0d63-96af-4bf0-82b8-e82249f79d26';