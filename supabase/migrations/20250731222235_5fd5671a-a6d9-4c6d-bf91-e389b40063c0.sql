-- Corrigir políticas RLS para event_registrations para permitir leitura admin
DROP POLICY IF EXISTS "event_registrations_admin_read" ON event_registrations;

CREATE POLICY "event_registrations_admin_read" 
ON event_registrations FOR SELECT 
USING (is_current_user_admin());

-- Atualizar função para o relatório diário
CREATE OR REPLACE FUNCTION public.generate_daily_report(report_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  registration_count INTEGER;
  total_revenue DECIMAL(10,2);
  report_data JSON;
BEGIN
  -- Contar inscrições do dia
  SELECT COUNT(*) INTO registration_count
  FROM public.event_registrations
  WHERE DATE(created_at) = report_date;
  
  -- Calcular faturamento do dia (apenas pagamentos confirmados)
  SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
  FROM public.event_registrations
  WHERE DATE(created_at) = report_date
  AND payment_status = 'completed';
  
  -- Montar relatório
  report_data := json_build_object(
    'date', report_date,
    'total_registrations', registration_count,
    'total_revenue', total_revenue,
    'generated_at', NOW()
  );
  
  -- Inserir logs de alerta para relatório diário
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'email',
    'cleyber.silva@live.com',
    'Relatório diário - Inscrições: ' || registration_count || ' | Faturamento: R$ ' || total_revenue,
    'sent'
  );
  
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'sms',
    '(83) 98832-9018',
    'Relatório ' || report_date || ': ' || registration_count || ' inscrições, R$ ' || total_revenue,
    'sent'
  );
  
  RETURN report_data;
END;
$$;