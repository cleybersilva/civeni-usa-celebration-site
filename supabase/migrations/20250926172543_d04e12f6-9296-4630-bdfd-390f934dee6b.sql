-- Criar tabela para gerenciar avaliadores
CREATE TABLE IF NOT EXISTS public.congresso_avaliadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo_pt TEXT,
  cargo_en TEXT,
  cargo_es TEXT,
  instituicao TEXT NOT NULL,
  foto_url TEXT,
  categoria TEXT NOT NULL DEFAULT 'avaliador',
  especialidade TEXT,
  email TEXT,
  curriculo_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.congresso_avaliadores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "congresso_avaliadores_admin_all" 
ON public.congresso_avaliadores
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "congresso_avaliadores_public_read" 
ON public.congresso_avaliadores
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_congresso_avaliadores_updated_at
BEFORE UPDATE ON public.congresso_avaliadores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();