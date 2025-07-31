-- Limpar banners problemáticos e reorganizar
UPDATE banner_slides 
SET is_active = false 
WHERE button_link LIKE '%formato-hibrido%' OR bg_image LIKE 'data:image%';

-- Garantir que apenas banners válidos fiquem ativos
UPDATE banner_slides 
SET is_active = true,
    order_index = 1
WHERE id = 'b612a599-1a49-4bb5-bb56-7dee6a05a3a4';

UPDATE banner_slides 
SET is_active = true,
    order_index = 2,
    button_link = '/palestrantes'
WHERE id = '5167980b-b269-4bb5-aaee-31b3b636cd16';