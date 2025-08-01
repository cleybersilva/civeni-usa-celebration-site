-- Corrigir a função generate_daily_report para contar inscrições reais
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
  -- Contar TODAS as inscrições até a data especificada
  SELECT COUNT(*) INTO registration_count
  FROM public.event_registrations
  WHERE DATE(created_at) <= report_date;
  
  -- Calcular faturamento total dos pagamentos confirmados até a data
  SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
  FROM public.event_registrations
  WHERE DATE(created_at) <= report_date
  AND payment_status = 'completed';
  
  -- Se não há pagamentos confirmados, considerar valor potencial dos pendentes
  IF total_revenue = 0 THEN
    SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
    FROM public.event_registrations
    WHERE DATE(created_at) <= report_date
    AND payment_status = 'pending';
  END IF;
  
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