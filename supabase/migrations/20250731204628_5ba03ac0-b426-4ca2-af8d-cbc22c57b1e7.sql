-- Criar tabela para submissões de trabalhos acadêmicos
CREATE TABLE IF NOT EXISTS public.work_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  institution TEXT NOT NULL,
  email TEXT NOT NULL,
  work_title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  keywords TEXT NOT NULL,
  thematic_area TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  internal_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.work_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "work_submissions_insert_public" 
ON public.work_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "work_submissions_admin_read" 
ON public.work_submissions 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "work_submissions_admin_update" 
ON public.work_submissions 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_work_submissions_updated_at
BEFORE UPDATE ON public.work_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para arquivos de submissão
INSERT INTO storage.buckets (id, name, public) 
VALUES ('work-submissions', 'work-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket
CREATE POLICY "work_submissions_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'work-submissions');

CREATE POLICY "work_submissions_admin_read_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'work-submissions' AND is_current_user_admin());

CREATE POLICY "work_submissions_admin_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'work-submissions' AND is_current_user_admin());