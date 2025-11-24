-- Adicionar campo de idioma na tabela event_certificates
ALTER TABLE event_certificates 
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'pt-BR'
CHECK (language IN ('pt-BR', 'en-US', 'es-ES'));

-- Adicionar campo para armazenar o layout_config (template visual)
ALTER TABLE event_certificates 
ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT NULL;

-- Comentários
COMMENT ON COLUMN event_certificates.language IS 'Idioma padrão do certificado para este evento';
COMMENT ON COLUMN event_certificates.layout_config IS 'Configuração visual do template do certificado';