-- Criar tabela para configurações do evento
CREATE TABLE public.event_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  event_location TEXT NOT NULL,
  event_city TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "event_config_public_read" 
ON public.event_config 
FOR SELECT 
USING (true);

-- Política para administradores (todas as operações)
CREATE POLICY "event_config_admin_all" 
ON public.event_config 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_event_config_updated_at
BEFORE UPDATE ON public.event_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO public.event_config (event_date, event_location, event_city, start_time, end_time) 
VALUES ('2025-09-15', 'Celebration, Florida', 'Celebration', '09:00:00', '18:00:00');