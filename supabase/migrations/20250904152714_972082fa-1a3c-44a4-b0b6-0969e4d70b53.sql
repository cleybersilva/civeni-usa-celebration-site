-- Create table for thematic areas configuration
CREATE TABLE public.thematic_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name_pt TEXT NOT NULL,
  name_en TEXT,
  name_es TEXT, 
  name_tr TEXT,
  description_pt TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  description_tr TEXT,
  icon_name TEXT NOT NULL DEFAULT 'BookOpen',
  color_class TEXT DEFAULT 'civeni-blue'
);

-- Enable RLS
ALTER TABLE public.thematic_areas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "thematic_areas_admin_all" 
ON public.thematic_areas 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "thematic_areas_public_read" 
ON public.thematic_areas 
FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_thematic_areas_updated_at
BEFORE UPDATE ON public.thematic_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default thematic areas
INSERT INTO public.thematic_areas (order_index, name_pt, name_en, name_es, description_pt, description_en, description_es, icon_name) VALUES
(1, 'Educação', 'Education', 'Educación', 'Inovações pedagógicas, metodologias de ensino e formação continuada para transformar o cenário educacional global.', 'Pedagogical innovations, teaching methodologies and continuing education to transform the global educational scenario.', 'Innovaciones pedagógicas, metodologías de enseñanza y educación continua para transformar el escenario educativo global.', 'BookOpen'),
(2, 'Saúde', 'Health', 'Salud', 'Avanços em medicina, saúde pública e bem-estar integral, promovendo qualidade de vida e cuidados humanizados.', 'Advances in medicine, public health and integral well-being, promoting quality of life and humanized care.', 'Avances en medicina, salud pública y bienestar integral, promoviendo calidad de vida y cuidados humanizados.', 'Heart'),
(3, 'Ciências Jurídicas', 'Legal Sciences', 'Ciencias Jurídicas', 'Direito contemporâneo, justiça social e desenvolvimento de frameworks legais para uma sociedade mais justa.', 'Contemporary law, social justice and development of legal frameworks for a more just society.', 'Derecho contemporáneo, justicia social y desarrollo de marcos legales para una sociedad más justa.', 'Scale'),
(4, 'Administração', 'Administration', 'Administración', 'Gestão estratégica, liderança transformacional e práticas administrativas inovadoras para organizações sustentáveis.', 'Strategic management, transformational leadership and innovative administrative practices for sustainable organizations.', 'Gestión estratégica, liderazgo transformacional y prácticas administrativas innovadoras para organizaciones sostenibles.', 'Users'),
(5, 'Sustentabilidade', 'Sustainability', 'Sostenibilidad', 'Práticas ambientais responsáveis, desenvolvimento sustentável e preservação dos recursos naturais para futuras gerações.', 'Responsible environmental practices, sustainable development and preservation of natural resources for future generations.', 'Prácticas ambientales responsables, desarrollo sostenible y preservación de recursos naturales para futuras generaciones.', 'Globe'),
(6, 'Tecnologia', 'Technology', 'Tecnología', 'Inovações tecnológicas, inteligência artificial e transformação digital para o progresso da humanidade.', 'Technological innovations, artificial intelligence and digital transformation for the progress of humanity.', 'Innovaciones tecnológicas, inteligencia artificial y transformación digital para el progreso de la humanidad.', 'Laptop'),
(7, 'Espiritualidade', 'Spirituality', 'Espiritualidad', 'Desenvolvimento espiritual, valores cristãos e integração da fé com a ciência para o crescimento integral do ser humano.', 'Spiritual development, Christian values and integration of faith with science for the integral growth of human beings.', 'Desarrollo espiritual, valores cristianos e integración de la fe con la ciencia para el crecimiento integral del ser humano.', 'Heart');