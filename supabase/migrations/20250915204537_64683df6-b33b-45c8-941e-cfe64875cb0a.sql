-- Fix Security Definer View Issue
-- Drop and recreate the view with explicit SECURITY INVOKER

DROP VIEW IF EXISTS public.v_lote_atual;

-- Recreate the view with SECURITY INVOKER (uses querying user's permissions)
CREATE VIEW public.v_lote_atual
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  price_cents,
  dt_inicio,
  dt_fim,
  ativo,
  created_at,
  updated_at
FROM public.lotes 
WHERE ativo = true 
  AND dt_inicio <= CURRENT_DATE 
  AND dt_fim >= CURRENT_DATE
ORDER BY dt_inicio DESC
LIMIT 1;

-- Add comment explaining the security setting
COMMENT ON VIEW public.v_lote_atual IS 'View with SECURITY INVOKER - executes with querying user permissions, respecting RLS policies';