-- Adicionar política de DELETE para admins root na tabela event_registrations
CREATE POLICY "event_registrations_admin_root_delete"
ON public.event_registrations
FOR DELETE
TO public
USING (is_admin_root_user(current_setting('app.current_user_email'::text, true)));