-- Adicionar campos necessários para o módulo de Envio de Vídeos
ALTER TABLE public.video_submissions
  ADD COLUMN IF NOT EXISTS work_title text,
  ADD COLUMN IF NOT EXISTS video_platform text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS modality text,
  ADD COLUMN IF NOT EXISTS submission_origin text DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS event_edition text DEFAULT 'III CIVENI 2025',
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_video_submissions_is_deleted ON public.video_submissions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_video_submissions_status ON public.video_submissions(status);
CREATE INDEX IF NOT EXISTS idx_video_submissions_origin ON public.video_submissions(submission_origin);
CREATE INDEX IF NOT EXISTS idx_video_submissions_created_at ON public.video_submissions(created_at DESC);