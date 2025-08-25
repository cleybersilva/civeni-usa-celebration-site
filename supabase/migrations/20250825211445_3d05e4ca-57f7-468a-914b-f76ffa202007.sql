-- Criar tabela de tipos de participantes
CREATE TABLE public.participant_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT NOT NULL,
  description TEXT,
  requires_course_selection BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.participant_types ENABLE ROW LEVEL SECURITY;

-- Políticas para tipos de participantes
CREATE POLICY "participant_types_admin_all" ON public.participant_types
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "participant_types_public_read" ON public.participant_types
  FOR SELECT
  USING (is_active = true);

-- Adicionar trigger de atualização
CREATE TRIGGER update_participant_types_updated_at
  BEFORE UPDATE ON public.participant_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Permitir que os administradores editem cursos e turmas
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Políticas para cursos
CREATE POLICY "cursos_admin_all" ON public.cursos
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Políticas para turmas  
CREATE POLICY "turmas_admin_all" ON public.turmas
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Permitir que os administradores editem lotes de inscrição
CREATE POLICY "registration_batches_admin_all" ON public.registration_batches
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Permitir que os administradores editem categorias de inscrição
CREATE POLICY "registration_categories_admin_all" ON public.registration_categories
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());