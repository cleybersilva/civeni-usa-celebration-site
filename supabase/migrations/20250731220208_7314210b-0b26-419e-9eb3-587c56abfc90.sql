-- Criar tabela para apresentação do congresso
CREATE TABLE public.congresso_apresentacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo_pt TEXT NOT NULL,
  titulo_en TEXT,
  titulo_es TEXT,
  descricao_pt TEXT NOT NULL,
  descricao_en TEXT,
  descricao_es TEXT,
  tema_pt TEXT,
  tema_en TEXT,
  tema_es TEXT,
  video_url TEXT,
  imagem_destaque TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para comitê do congresso
CREATE TABLE public.congresso_comite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo_pt TEXT NOT NULL,
  cargo_en TEXT,
  cargo_es TEXT,
  instituicao TEXT NOT NULL,
  foto_url TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('organizador', 'cientifico', 'avaliacao', 'apoio_tecnico')),
  ordem INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.congresso_apresentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congresso_comite ENABLE ROW LEVEL SECURITY;

-- Create policies para congresso_apresentacao
CREATE POLICY "congresso_apresentacao_public_read" 
ON public.congresso_apresentacao 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "congresso_apresentacao_admin_all" 
ON public.congresso_apresentacao 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create policies para congresso_comite
CREATE POLICY "congresso_comite_public_read" 
ON public.congresso_comite 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "congresso_comite_admin_all" 
ON public.congresso_comite 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_congresso_apresentacao_updated_at
BEFORE UPDATE ON public.congresso_apresentacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_congresso_comite_updated_at
BEFORE UPDATE ON public.congresso_comite
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.congresso_apresentacao (
  titulo_pt, titulo_en, titulo_es,
  descricao_pt, descricao_en, descricao_es,
  tema_pt, tema_en, tema_es
) VALUES (
  'III Congresso Virtual de Ensino de Engenharia do Nordeste',
  'III Virtual Congress of Engineering Education in the Northeast',
  'III Congreso Virtual de Enseñanza de Ingeniería del Nordeste',
  'O CIVENI é um evento acadêmico que reúne estudantes, professores, pesquisadores e profissionais da área de ensino de engenharia para debater as mais recentes inovações, metodologias e desafios da educação em engenharia no nordeste brasileiro.',
  'CIVENI is an academic event that brings together students, teachers, researchers and professionals in the field of engineering education to debate the latest innovations, methodologies and challenges of engineering education in northeastern Brazil.',
  'CIVENI es un evento académico que reúne a estudiantes, profesores, investigadores y profesionales del área de enseñanza de ingeniería para debatir las más recientes innovaciones, metodologías y desafíos de la educación en ingeniería en el nordeste brasileño.',
  'Inovação e Sustentabilidade no Ensino de Engenharia',
  'Innovation and Sustainability in Engineering Education',
  'Innovación y Sostenibilidad en la Enseñanza de Ingeniería'
);