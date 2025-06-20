
-- Criar tabela de cursos se não existir
CREATE TABLE IF NOT EXISTS public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_curso TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de turmas se não existir
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_curso UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  nome_turma TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS se ainda não estiver habilitado
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cursos' AND policyname = 'Allow public read access on cursos') THEN
        CREATE POLICY "Allow public read access on cursos" ON public.cursos FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turmas' AND policyname = 'Allow public read access on turmas') THEN
        CREATE POLICY "Allow public read access on turmas" ON public.turmas FOR SELECT USING (true);
    END IF;
END $$;

-- Limpar dados anteriores se existirem
DELETE FROM public.turmas;
DELETE FROM public.cursos;

-- Inserir cursos baseados na planilha
INSERT INTO public.cursos (nome_curso) VALUES 
('Mestrado em Ciências Administrativas'),
('Mestrado em Ciências Contábeis'),
('Mestrado em Ciências da Educação'),
('Mestrado em Ciências Jurídicas'),
('Mestrado em Ciências Saúde Pública'),
('Mestrado em Ciências NeuroEducação'),
('Doutorado em Ciências da Educação'),
('Doutorado em Ciências Jurídicas');

-- Inserir turmas baseadas na planilha
-- Mestrado em Ciências Administrativas: T1
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, 'T1' FROM public.cursos WHERE nome_curso = 'Mestrado em Ciências Administrativas';

-- Mestrado em Ciências Contábeis: T1, T2
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, turma FROM public.cursos 
CROSS JOIN (VALUES ('T1'), ('T2')) AS t(turma)
WHERE nome_curso = 'Mestrado em Ciências Contábeis';

-- Mestrado em Ciências da Educação: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, turma FROM public.cursos 
CROSS JOIN (VALUES ('T1'), ('T2'), ('T3'), ('T4'), ('T5'), ('T6'), ('T7'), ('T8'), ('T9'), ('T10'), ('T11'), ('T12'), ('T13'), ('T14'), ('T15')) AS t(turma)
WHERE nome_curso = 'Mestrado em Ciências da Educação';

-- Mestrado em Ciências Jurídicas: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, turma FROM public.cursos 
CROSS JOIN (VALUES ('T1'), ('T2'), ('T3'), ('T4'), ('T5'), ('T6'), ('T7'), ('T8'), ('T9'), ('T10'), ('T11'), ('T12'), ('T13'), ('T14'), ('T15')) AS t(turma)
WHERE nome_curso = 'Mestrado em Ciências Jurídicas';

-- Mestrado em Ciências Saúde Pública: T1, T2, T3, T4
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, turma FROM public.cursos 
CROSS JOIN (VALUES ('T1'), ('T2'), ('T3'), ('T4')) AS t(turma)
WHERE nome_curso = 'Mestrado em Ciências Saúde Pública';

-- Mestrado em Ciências NeuroEducação: T1, T2, T3
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, turma FROM public.cursos 
CROSS JOIN (VALUES ('T1'), ('T2'), ('T3')) AS t(turma)
WHERE nome_curso = 'Mestrado em Ciências NeuroEducação';

-- Doutorado em Ciências da Educação: T1, T2
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, turma FROM public.cursos 
CROSS JOIN (VALUES ('T1'), ('T2')) AS t(turma)
WHERE nome_curso = 'Doutorado em Ciências da Educação';

-- Doutorado em Ciências Jurídicas: T1
INSERT INTO public.turmas (id_curso, nome_turma) 
SELECT id, 'T1' FROM public.cursos WHERE nome_curso = 'Doutorado em Ciências Jurídicas';

-- Adicionar campos curso_id e turma_id na tabela event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id),
ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES public.turmas(id),
ADD COLUMN IF NOT EXISTS participant_type TEXT;
