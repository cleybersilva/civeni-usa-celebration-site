
-- Criar tabela para cronogramas
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('presencial', 'online')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  speaker_name TEXT,
  speaker_photo_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('palestra', 'workshop', 'painel', 'intervalo', 'credenciamento')),
  location TEXT, -- Para eventos presenciais
  virtual_link TEXT, -- Para eventos online
  platform TEXT, -- Zoom, YouTube, etc.
  is_recorded BOOLEAN DEFAULT false,
  recording_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to published schedules
CREATE POLICY "Allow public read on published schedules" 
ON public.schedules 
FOR SELECT 
USING (is_published = true);

-- Create policy to allow admin full access
CREATE POLICY "Allow admin full access on schedules" 
ON public.schedules 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_schedules_type_date ON public.schedules(type, date);
CREATE INDEX idx_schedules_published ON public.schedules(is_published);
