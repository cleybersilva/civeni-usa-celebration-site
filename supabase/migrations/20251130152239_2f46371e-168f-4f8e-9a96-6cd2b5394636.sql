-- Function para buscar receita total de inscrições (bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_total_registration_revenue()
RETURNS TABLE(total_revenue numeric, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário é admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount_paid), 0)::numeric as total_revenue,
    COUNT(*)::bigint as total_count
  FROM event_registrations 
  WHERE payment_status = 'completed';
END;
$$;