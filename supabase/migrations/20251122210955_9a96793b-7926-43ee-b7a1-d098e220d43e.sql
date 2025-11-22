-- Corrigir nome da tabela para os campos de DOCX convertido
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS file_path_docx TEXT,
ADD COLUMN IF NOT EXISTS docx_converted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN submissions.file_path_docx IS 'URL do arquivo convertido para DOCX (para PDFs antigos)';
COMMENT ON COLUMN submissions.docx_converted_at IS 'Data/hora da conversão para DOCX';