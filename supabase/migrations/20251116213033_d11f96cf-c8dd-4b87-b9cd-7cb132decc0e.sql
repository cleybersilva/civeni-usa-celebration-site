-- Desativar banners antigos (criados antes de 2025-11-12)
UPDATE banner_slides 
SET is_active = false, updated_at = now()
WHERE created_at < '2025-11-12 00:00:00+00';