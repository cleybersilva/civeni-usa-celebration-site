-- Create table for works associated with presentation rooms
CREATE TABLE IF NOT EXISTS public.salas_apresentacao_trabalhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES public.presentation_rooms(id) ON DELETE CASCADE,
  titulo_apresentacao text NOT NULL,
  autores text NOT NULL,
  ordem integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salas_apresentacao_trabalhos ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY salas_apresentacao_trabalhos_admin_all
ON public.salas_apresentacao_trabalhos
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Public read access (needed for public Salas Meet page)
CREATE POLICY salas_apresentacao_trabalhos_public_read
ON public.salas_apresentacao_trabalhos
FOR SELECT
USING (true);

-- Keep updated_at in sync on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_salas_apresentacao_trabalhos'
  ) THEN
    CREATE TRIGGER set_updated_at_salas_apresentacao_trabalhos
    BEFORE UPDATE ON public.salas_apresentacao_trabalhos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;