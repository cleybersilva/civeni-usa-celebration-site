-- Corrigir política RLS para permitir upsert nas configurações do evento
DROP POLICY IF EXISTS "event_config_admin_all" ON public.event_config;

-- Nova política mais específica para inserção
CREATE POLICY "event_config_admin_insert" 
ON public.event_config 
FOR INSERT 
WITH CHECK (is_current_user_admin());

-- Nova política para atualização
CREATE POLICY "event_config_admin_update" 
ON public.event_config 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Nova política para deleção (caso necessário)
CREATE POLICY "event_config_admin_delete" 
ON public.event_config 
FOR DELETE 
USING (is_current_user_admin());