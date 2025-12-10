-- Create RPC function to upsert manual work entries with RLS bypass
CREATE OR REPLACE FUNCTION public.admin_upsert_manual_work(
  p_id uuid DEFAULT NULL,
  p_sala_id uuid DEFAULT NULL,
  p_titulo_apresentacao text DEFAULT NULL,
  p_autores text DEFAULT NULL,
  p_ordem integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF p_id IS NOT NULL THEN
    -- Update existing
    UPDATE salas_apresentacao_trabalhos
    SET 
      titulo_apresentacao = COALESCE(p_titulo_apresentacao, titulo_apresentacao),
      autores = COALESCE(p_autores, autores),
      ordem = COALESCE(p_ordem, ordem),
      updated_at = now()
    WHERE id = p_id
    RETURNING row_to_json(salas_apresentacao_trabalhos.*) INTO v_result;
  ELSE
    -- Insert new
    INSERT INTO salas_apresentacao_trabalhos (sala_id, titulo_apresentacao, autores, ordem)
    VALUES (p_sala_id, p_titulo_apresentacao, p_autores, p_ordem)
    RETURNING row_to_json(salas_apresentacao_trabalhos.*) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create RPC function to delete manual work entries with RLS bypass
CREATE OR REPLACE FUNCTION public.admin_delete_manual_work(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM salas_apresentacao_trabalhos WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_upsert_manual_work TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_manual_work TO anon, authenticated;