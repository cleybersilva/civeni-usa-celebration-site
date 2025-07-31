-- Create table for live streams
CREATE TABLE public.transmissoes_live (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  url_embed TEXT NOT NULL,
  data_hora_inicio TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'inativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transmissoes_live ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "transmissoes_live_public_read" 
ON public.transmissoes_live 
FOR SELECT 
USING (status = 'ativo');

CREATE POLICY "transmissoes_live_admin_all" 
ON public.transmissoes_live 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_transmissoes_live_updated_at
BEFORE UPDATE ON public.transmissoes_live
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();