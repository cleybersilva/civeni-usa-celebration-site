-- Criar tabela para configurações do formato híbrido
CREATE TABLE public.hybrid_format_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hybrid_format_config ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público de leitura
CREATE POLICY "hybrid_format_public_read" 
ON public.hybrid_format_config 
FOR SELECT 
USING (is_active = true);

-- Políticas para admin (total acesso)
CREATE POLICY "hybrid_format_admin_all" 
ON public.hybrid_format_config 
FOR ALL 
USING (is_current_user_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_hybrid_format_config_updated_at
BEFORE UPDATE ON public.hybrid_format_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.hybrid_format_config (activity_type, title, description, image_url, order_index) VALUES
('exhibition', 'Estandes de Exposição', 'Espaços dedicados para apresentação de produtos, serviços e inovações do setor, promovendo networking e parcerias estratégicas.', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=600&q=80', 1),
('keynote', 'Palestras Magistrais', 'Apresentações de especialistas renomados compartilhando conhecimentos avançados e tendências do mercado.', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80', 2),
('panel', 'Discussões em Painel', 'Debates interativos com múltiplos especialistas explorando diferentes perspectivas sobre temas relevantes.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80', 3),
('oral', 'Comunicações Orais', 'Apresentações de pesquisas, estudos de caso e experiências práticas dos participantes.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', 4);