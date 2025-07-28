-- Criar tabela para banners/slides
CREATE TABLE public.banner_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  bg_image TEXT NOT NULL,
  button_text TEXT NOT NULL,
  button_link TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "banner_slides_public_read" 
ON public.banner_slides 
FOR SELECT 
USING (is_active = true);

-- Política para administradores (todas as operações)
CREATE POLICY "banner_slides_admin_all" 
ON public.banner_slides 
FOR ALL 
USING (is_current_user_admin());

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_banner_slides_updated_at
BEFORE UPDATE ON public.banner_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir banners padrão existentes no contexto
INSERT INTO public.banner_slides (title, subtitle, description, bg_image, button_text, button_link, order_index) VALUES
('Welcome to III CIVENI 2025', 'International Multidisciplinary Congress', 'Join researchers and academics from around the world in advancing knowledge across disciplines', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&h=1080&q=80', 'Register Now', '/inscricao-presencial', 1),
('Hybrid Learning Experience', 'In-Person & Online Participation', 'Choose your preferred format and join us in beautiful Celebration, Florida or online from anywhere', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1920&h=1080&q=80', 'Learn More', '/formato-hibrido', 2),
('World-Class Speakers', 'Keynote Presentations & Workshops', 'Learn from renowned experts and participate in interactive sessions designed to inspire innovation', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1920&h=1080&q=80', 'View Speakers', '/palestrantes', 3);