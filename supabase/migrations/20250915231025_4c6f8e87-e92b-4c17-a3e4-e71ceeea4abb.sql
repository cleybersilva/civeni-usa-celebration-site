-- Corrigir warnings de segurança: adicionar SET search_path nas funções
CREATE OR REPLACE FUNCTION civeni_touch_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;$$;