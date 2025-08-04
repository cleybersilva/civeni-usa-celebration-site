-- Criar tabela para vídeos
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'upload')),
  youtube_url TEXT,
  uploaded_video_url TEXT,
  thumbnail TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Criar políticas para vídeos
CREATE POLICY "Videos admin all access" 
ON public.videos 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Videos public read access" 
ON public.videos 
FOR SELECT 
USING (is_active = true);

-- Criar trigger para updated_at
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();