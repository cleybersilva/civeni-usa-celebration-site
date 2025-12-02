-- Atualizar function para não exigir verificação de admin (dashboard já é protegido)
CREATE OR REPLACE FUNCTION public.get_total_registration_revenue()
RETURNS TABLE(total_revenue numeric, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount_paid), 0)::numeric as total_revenue,
    COUNT(*)::bigint as total_count
  FROM event_registrations 
  WHERE payment_status = 'completed';
END;
$$;