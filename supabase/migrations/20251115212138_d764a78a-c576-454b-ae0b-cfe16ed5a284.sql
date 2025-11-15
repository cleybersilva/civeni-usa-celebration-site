-- Create presentation_rooms table
CREATE TABLE IF NOT EXISTS public.presentation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_sala TEXT NOT NULL,
  descricao_sala TEXT,
  meet_link TEXT NOT NULL,
  data_apresentacao DATE NOT NULL,
  horario_inicio_sala TIME NOT NULL,
  horario_fim_sala TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'inativo')),
  responsavel_sala TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create presentation_room_assignments table
CREATE TABLE IF NOT EXISTS public.presentation_room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.presentation_rooms(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  ordem_apresentacao INTEGER NOT NULL,
  inicio_apresentacao TIMESTAMPTZ NOT NULL,
  fim_apresentacao TIMESTAMPTZ NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, submission_id)
);

-- Create indexes
CREATE INDEX idx_presentation_rooms_status ON public.presentation_rooms(status);
CREATE INDEX idx_presentation_rooms_data ON public.presentation_rooms(data_apresentacao);
CREATE INDEX idx_presentation_room_assignments_room ON public.presentation_room_assignments(room_id);
CREATE INDEX idx_presentation_room_assignments_submission ON public.presentation_room_assignments(submission_id);

-- Enable RLS
ALTER TABLE public.presentation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_room_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presentation_rooms
CREATE POLICY "presentation_rooms_public_read" ON public.presentation_rooms
  FOR SELECT USING (status = 'publicado');

CREATE POLICY "presentation_rooms_admin_all" ON public.presentation_rooms
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- RLS Policies for presentation_room_assignments
CREATE POLICY "presentation_room_assignments_public_read" ON public.presentation_room_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.presentation_rooms pr
      WHERE pr.id = presentation_room_assignments.room_id
      AND pr.status = 'publicado'
    )
  );

CREATE POLICY "presentation_room_assignments_admin_all" ON public.presentation_room_assignments
  FOR ALL USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Trigger for updated_at
CREATE TRIGGER update_presentation_rooms_updated_at
  BEFORE UPDATE ON public.presentation_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presentation_room_assignments_updated_at
  BEFORE UPDATE ON public.presentation_room_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();