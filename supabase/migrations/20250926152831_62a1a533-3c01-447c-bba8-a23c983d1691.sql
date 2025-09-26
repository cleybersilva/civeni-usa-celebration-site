-- Add templates-artigos-slides to allowed work types
ALTER TABLE work_content 
DROP CONSTRAINT IF EXISTS work_content_work_type_check;

ALTER TABLE work_content 
ADD CONSTRAINT work_content_work_type_check 
CHECK (work_type IN ('apresentacao-oral', 'sessoes-poster', 'manuscritos', 'templates-artigos-slides'));

-- Insert default content for the new work type
INSERT INTO work_content (
  work_type,
  content_type,
  title_pt,
  content_pt,
  order_index,
  is_active,
  created_by
) VALUES 
(
  'templates-artigos-slides',
  'text',
  'Bem-vindos aos Templates',
  'Esta seção contém os modelos padronizados para artigos e apresentações do III CIVENI 2025.',
  1,
  true,
  'system'
);