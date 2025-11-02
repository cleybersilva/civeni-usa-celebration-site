-- Criar tabela participant_types
CREATE TABLE IF NOT EXISTS public.participant_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT NOT NULL,
  description TEXT,
  requires_course_selection BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participant_types_type_name_key'
  ) THEN
    ALTER TABLE public.participant_types ADD CONSTRAINT participant_types_type_name_key UNIQUE (type_name);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.participant_types ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "participant_types_public_read" ON public.participant_types;
DROP POLICY IF EXISTS "participant_types_admin_all" ON public.participant_types;

-- Política de leitura pública para tipos ativos
CREATE POLICY "participant_types_public_read"
ON public.participant_types
FOR SELECT
USING (is_active = true);

-- Política de admin para todas as operações
CREATE POLICY "participant_types_admin_all"
ON public.participant_types
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Inserir tipos de participantes padrão (usando ON CONFLICT para evitar duplicatas)
INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
VALUES 
  ('Aluno(a) VCCU', 'Estudante regularmente matriculado na VCCU', true, true),
  ('Sorteados', 'Participantes sorteados com inscrição gratuita', false, true),
  ('Estudante de Graduação', 'Estudante de curso de graduação de outras instituições', false, true),
  ('Estudante de Pós-Graduação', 'Estudante de mestrado, doutorado ou especialização', false, true),
  ('Professor/Docente', 'Professor universitário ou de educação básica', false, true),
  ('Pesquisador', 'Pesquisador vinculado a instituição de pesquisa', false, true),
  ('Profissional', 'Profissional da área sem vínculo acadêmico', false, true),
  ('Ouvinte', 'Participante ouvinte geral', false, true),
  ('Palestrante/Convidado', 'Palestrante ou convidado especial do evento', false, true)
ON CONFLICT (type_name) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_participant_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_participant_types_updated_at_trigger ON public.participant_types;
CREATE TRIGGER update_participant_types_updated_at_trigger
BEFORE UPDATE ON public.participant_types
FOR EACH ROW
EXECUTE FUNCTION update_participant_types_updated_at();