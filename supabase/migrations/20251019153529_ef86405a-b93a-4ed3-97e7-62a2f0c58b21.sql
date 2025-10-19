-- Criar tabela de transmissões (streams)
CREATE TABLE IF NOT EXISTS public.transmission_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": "", "tr": ""}'::jsonb,
  description JSONB DEFAULT '{"pt": "", "en": "", "es": "", "tr": ""}'::jsonb,
  youtube_video_id TEXT,
  youtube_channel_handle TEXT DEFAULT '@CiveniUSA2025',
  is_live BOOLEAN DEFAULT false,
  scheduled_date TIMESTAMPTZ,
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de programação da transmissão
CREATE TABLE IF NOT EXISTS public.transmission_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  topic JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": "", "tr": ""}'::jsonb,
  speaker TEXT,
  modality TEXT CHECK (modality IN ('online', 'presencial', 'hibrido')),
  meet_room_link TEXT,
  stream_id UUID,
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de FAQ
CREATE TABLE IF NOT EXISTS public.transmission_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": "", "tr": ""}'::jsonb,
  answer JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": "", "tr": ""}'::jsonb,
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.transmission_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmission_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmission_faq ENABLE ROW LEVEL SECURITY;

-- Policies para transmission_streams
CREATE POLICY "transmission_streams_public_read" ON public.transmission_streams
  FOR SELECT USING (is_active = true);

CREATE POLICY "transmission_streams_admin_all" ON public.transmission_streams
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Policies para transmission_schedule  
CREATE POLICY "transmission_schedule_public_read" ON public.transmission_schedule
  FOR SELECT USING (is_active = true);

CREATE POLICY "transmission_schedule_admin_all" ON public.transmission_schedule
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Policies para transmission_faq
CREATE POLICY "transmission_faq_public_read" ON public.transmission_faq
  FOR SELECT USING (is_active = true);

CREATE POLICY "transmission_faq_admin_all" ON public.transmission_faq
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Triggers para updated_at
CREATE TRIGGER update_transmission_streams_updated_at
  BEFORE UPDATE ON public.transmission_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

CREATE TRIGGER update_transmission_schedule_updated_at
  BEFORE UPDATE ON public.transmission_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

CREATE TRIGGER update_transmission_faq_updated_at
  BEFORE UPDATE ON public.transmission_faq
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

-- Índices para melhor performance
CREATE INDEX idx_transmission_streams_is_live ON public.transmission_streams(is_live) WHERE is_active = true;
CREATE INDEX idx_transmission_streams_scheduled ON public.transmission_streams(scheduled_date) WHERE is_active = true;
CREATE INDEX idx_transmission_schedule_day ON public.transmission_schedule(day, date) WHERE is_active = true;
CREATE INDEX idx_transmission_schedule_date ON public.transmission_schedule(date, start_time) WHERE is_active = true;