-- Corrigir o link do botão "Saiba mais" do banner híbrido para direcionar para Programação Online
UPDATE banner_slides 
SET button_link = '/programacao-online'
WHERE id = 'db3b4e03-a818-40a2-8dab-d212fcc02faf' AND button_link = '/formato-hibrido';