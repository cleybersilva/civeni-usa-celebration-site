-- Tabela para lista de artigos/projetos aprovados
CREATE TABLE public.approved_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  numero INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  autor_responsavel TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approved_works ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Anyone can view approved works" 
ON public.approved_works 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_approved_works_updated_at
BEFORE UPDATE ON public.approved_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC for admin upsert
CREATE OR REPLACE FUNCTION public.admin_upsert_approved_work(
  work_data JSONB,
  user_email TEXT,
  session_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok BOOLEAN;
  result_row approved_works%ROWTYPE;
BEGIN
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  IF work_data ? 'id' AND NULLIF(work_data->>'id','') IS NOT NULL THEN
    UPDATE approved_works
    SET
      area = COALESCE(work_data->>'area', area),
      numero = COALESCE((work_data->>'numero')::int, numero),
      titulo = COALESCE(work_data->>'titulo', titulo),
      autor_responsavel = COALESCE(work_data->>'autor_responsavel', autor_responsavel),
      observacoes = NULLIF(work_data->>'observacoes', ''),
      updated_at = now()
    WHERE id = (work_data->>'id')::uuid
    RETURNING * INTO result_row;
  ELSE
    INSERT INTO approved_works (area, numero, titulo, autor_responsavel, observacoes)
    VALUES (
      work_data->>'area',
      (work_data->>'numero')::int,
      work_data->>'titulo',
      work_data->>'autor_responsavel',
      NULLIF(work_data->>'observacoes', '')
    )
    RETURNING * INTO result_row;
  END IF;

  RETURN to_json(result_row);
END;
$$;

-- RPC for admin delete
CREATE OR REPLACE FUNCTION public.admin_delete_approved_work(
  work_id UUID,
  user_email TEXT,
  session_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok BOOLEAN;
  affected_rows INTEGER;
BEGIN
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  DELETE FROM approved_works WHERE id = work_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Work deleted successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Work not found');
  END IF;
END;
$$;