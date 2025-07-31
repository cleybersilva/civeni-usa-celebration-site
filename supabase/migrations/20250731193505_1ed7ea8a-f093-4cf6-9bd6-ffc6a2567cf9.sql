-- Criar tabela para imagens do II CIVENI 2024
CREATE TABLE public.civeni_ii_2024_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text_pt TEXT NOT NULL,
  alt_text_en TEXT NOT NULL,
  alt_text_es TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS
ALTER TABLE public.civeni_ii_2024_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "civeni_ii_2024_images_public_read" 
ON public.civeni_ii_2024_images 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "civeni_ii_2024_images_admin_all" 
ON public.civeni_ii_2024_images 
FOR ALL 
USING (is_current_user_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_civeni_ii_2024_images_updated_at
BEFORE UPDATE ON public.civeni_ii_2024_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas imagens de exemplo
INSERT INTO public.civeni_ii_2024_images (url, alt_text_pt, alt_text_en, alt_text_es, order_index, is_active) VALUES
('/img/formato_hibrido/comunicacoes-orais.png', 'Comunicações Orais do II CIVENI 2024', 'Oral Communications from II CIVENI 2024', 'Comunicaciones Orales del II CIVENI 2024', 1, true),
('/img/formato_hibrido/estandes-exposicao.png', 'Estandes de Exposição do II CIVENI 2024', 'Exhibition Stands from II CIVENI 2024', 'Estands de Exposición del II CIVENI 2024', 2, true),
('/img/formato_hibrido/painel.png', 'Painel de Discussão do II CIVENI 2024', 'Discussion Panel from II CIVENI 2024', 'Panel de Discusión del II CIVENI 2024', 3, true),
('/img/formato_hibrido/palestras-magistrais.png', 'Palestras Magistrais do II CIVENI 2024', 'Keynote Lectures from II CIVENI 2024', 'Conferencias Magistrales del II CIVENI 2024', 4, true);