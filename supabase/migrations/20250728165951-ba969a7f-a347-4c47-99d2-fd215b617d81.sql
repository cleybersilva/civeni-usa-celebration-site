-- Verificar e corrigir as políticas RLS para event_config
DROP POLICY IF EXISTS "event_config_admin_insert" ON public.event_config;
DROP POLICY IF EXISTS "event_config_admin_update" ON public.event_config;
DROP POLICY IF EXISTS "event_config_admin_delete" ON public.event_config;

-- Criar políticas mais simples e funcionais
CREATE POLICY "event_config_admin_all" 
ON public.event_config 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Verificar se existe dados na tabela, se não inserir dados padrão
INSERT INTO public.event_config (event_date, event_location, event_city, start_time, end_time) 
SELECT '2025-12-08', 'Celebration, Florida', 'Celebration', '09:00:00', '20:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.event_config LIMIT 1);