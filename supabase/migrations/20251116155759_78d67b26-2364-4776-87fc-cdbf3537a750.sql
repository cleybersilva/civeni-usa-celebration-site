-- Desativar palestrantes criados antes de 2025-11-12 (manter apenas os novos)
UPDATE cms_speakers 
SET is_active = false 
WHERE created_at < '2025-11-12 00:00:00+00';