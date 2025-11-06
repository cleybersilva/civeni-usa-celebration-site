-- Remover tabela existente e recriar
DROP TABLE IF EXISTS public.video_submissions CASCADE;

-- Criar tabela de envio de vídeos
CREATE TABLE public.video_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo_participante TEXT NOT NULL,
  curso TEXT,
  turma TEXT,
  video_url_original TEXT NOT NULL,
  video_url_normalized TEXT NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  parecer TEXT,
  avaliador_id UUID,
  submitted_ip INET,
  user_agent TEXT
);

-- Índices
CREATE INDEX idx_video_sub_created_at ON public.video_submissions(created_at DESC);
CREATE INDEX idx_video_sub_email ON public.video_submissions(email);
CREATE INDEX idx_video_sub_tipo ON public.video_submissions(tipo_participante);
CREATE INDEX idx_video_sub_status ON public.video_submissions(status);

-- Trigger para updated_at
CREATE TRIGGER update_video_submissions_updated_at
  BEFORE UPDATE ON public.video_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;

-- Permitir insert público
CREATE POLICY p_video_sub_insert_public ON public.video_submissions
  FOR INSERT WITH CHECK (true);

-- Admin pode fazer tudo
CREATE POLICY p_video_sub_admin_all ON public.video_submissions
  FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- Ativar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_submissions;