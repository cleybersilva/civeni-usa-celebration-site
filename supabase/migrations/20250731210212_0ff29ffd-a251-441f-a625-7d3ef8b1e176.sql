-- Create table for work content management
CREATE TABLE public.work_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_type TEXT NOT NULL CHECK (work_type IN ('apresentacao-oral', 'sessoes-poster', 'manuscritos')),
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'file', 'video', 'link')),
  title_pt TEXT,
  title_en TEXT,
  title_es TEXT,
  content_pt TEXT,
  content_en TEXT,
  content_es TEXT,
  file_url TEXT,
  file_name TEXT,
  link_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

-- Enable RLS
ALTER TABLE public.work_content ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to active content
CREATE POLICY "work_content_public_read" 
ON public.work_content 
FOR SELECT 
USING (is_active = true);

-- Create policies for admin full access
CREATE POLICY "work_content_admin_all" 
ON public.work_content 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_work_content_updated_at
BEFORE UPDATE ON public.work_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_work_content_type ON public.work_content(work_type);
CREATE INDEX idx_work_content_active ON public.work_content(is_active);
CREATE INDEX idx_work_content_order ON public.work_content(work_type, order_index);