-- Inserir tipos de participantes padrão (ignorando se já existirem)
-- Usando uma subquery para evitar erro de constraint
DO $$
BEGIN
  -- Aluno(a) VCCU
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Aluno(a) VCCU') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Aluno(a) VCCU', 'Estudante regularmente matriculado na VCCU', true, true);
  END IF;

  -- Sorteados
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Sorteados') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Sorteados', 'Participantes sorteados com inscrição gratuita', false, true);
  END IF;

  -- Estudante de Graduação
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Estudante de Graduação') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Estudante de Graduação', 'Estudante de curso de graduação de outras instituições', false, true);
  END IF;

  -- Estudante de Pós-Graduação
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Estudante de Pós-Graduação') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Estudante de Pós-Graduação', 'Estudante de mestrado, doutorado ou especialização', false, true);
  END IF;

  -- Professor/Docente
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Professor/Docente') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Professor/Docente', 'Professor universitário ou de educação básica', false, true);
  END IF;

  -- Pesquisador
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Pesquisador') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Pesquisador', 'Pesquisador vinculado a instituição de pesquisa', false, true);
  END IF;

  -- Profissional
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Profissional') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Profissional', 'Profissional da área sem vínculo acadêmico', false, true);
  END IF;

  -- Ouvinte
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Ouvinte') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Ouvinte', 'Participante ouvinte geral', false, true);
  END IF;

  -- Palestrante/Convidado
  IF NOT EXISTS (SELECT 1 FROM public.participant_types WHERE type_name = 'Palestrante/Convidado') THEN
    INSERT INTO public.participant_types (type_name, description, requires_course_selection, is_active)
    VALUES ('Palestrante/Convidado', 'Palestrante ou convidado especial do evento', false, true);
  END IF;
END $$;