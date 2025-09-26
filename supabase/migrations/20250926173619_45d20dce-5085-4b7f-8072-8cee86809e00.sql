-- Apenas corrigir URLs problemáticas na tabela congresso_comite
UPDATE congresso_comite 
SET foto_url = REPLACE(foto_url, '/src/assets/', '/assets/')
WHERE foto_url LIKE '/src/assets/%';