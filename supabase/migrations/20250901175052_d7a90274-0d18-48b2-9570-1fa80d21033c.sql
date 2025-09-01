-- Corrigir problemas nos banners
-- 1. Corrigir order_index duplicados
UPDATE banner_slides 
SET order_index = 3 
WHERE id = 'db3b4e03-a818-40a2-8dab-d212fcc02faf' AND title = 'Hybrid Learning Experience';

-- 2. Substituir a imagem base64 problemática do banner "World-Class Speakers" por uma URL válida
UPDATE banner_slides 
SET bg_image = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4'
WHERE id = '5167980b-b269-4bb5-aaee-31b3b636cd16' AND title = 'World-Class Speakers';

-- 3. Ativar todos os banners para teste
UPDATE banner_slides 
SET is_active = true 
WHERE is_active = false;