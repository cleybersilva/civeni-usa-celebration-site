-- Ativar todos os palestrantes para exibição
UPDATE cms_speakers 
SET is_active = true 
WHERE is_active = false;

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_cms_speakers_active_order 
ON cms_speakers(is_active, order_index) 
WHERE is_active = true;