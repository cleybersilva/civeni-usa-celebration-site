-- Add field to store converted DOCX URL for PDF submissions
ALTER TABLE civeni_submissoes 
ADD COLUMN IF NOT EXISTS file_path_docx TEXT,
ADD COLUMN IF NOT EXISTS docx_converted_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the field
COMMENT ON COLUMN civeni_submissoes.file_path_docx IS 'URL do arquivo convertido para DOCX (para PDFs antigos)';
COMMENT ON COLUMN civeni_submissoes.docx_converted_at IS 'Data/hora da conversão para DOCX';