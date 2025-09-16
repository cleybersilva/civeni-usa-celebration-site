-- Atualizar o link do botão do primeiro banner slide para direcionar para a página correta de inscrições
UPDATE banner_slides 
SET button_link = '/inscricoes'
WHERE id = 'b612a599-1a49-4bb5-bb56-7dee6a05a3a4' AND button_link = '/inscricao-presencial';