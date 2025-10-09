-- Atualizar o texto do banner 1 (order_index = 1)
UPDATE banner_slides 
SET description = 'TEMA: Saberes em Conexão: Inovação, Justiça e Humanidade na Sociedade Contemporânea',
    updated_at = now()
WHERE order_index = 1;