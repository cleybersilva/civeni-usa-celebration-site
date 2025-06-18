
-- Criar tabela alert_logs
CREATE TABLE public.alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  triggered_by_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access
CREATE POLICY "Allow public access on alert_logs" ON public.alert_logs 
FOR ALL USING (true) WITH CHECK (true);

-- Função para validar cupom
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code TEXT)
RETURNS JSON AS $$
DECLARE
  coupon_record RECORD;
  result JSON;
BEGIN
  SELECT * INTO coupon_record
  FROM public.coupon_codes
  WHERE code = coupon_code
  AND is_active = true
  AND (usage_limit IS NULL OR used_count < usage_limit);
  
  IF coupon_record.id IS NOT NULL THEN
    result := json_build_object(
      'is_valid', true,
      'coupon_id', coupon_record.id,
      'category_id', coupon_record.category_id
    );
  ELSE
    result := json_build_object('is_valid', false);
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar relatório diário
CREATE OR REPLACE FUNCTION public.generate_daily_report(report_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  registration_count INTEGER;
  total_revenue DECIMAL(10,2);
  report_data JSON;
BEGIN
  -- Contar inscrições do dia
  SELECT COUNT(*) INTO registration_count
  FROM public.event_registrations
  WHERE DATE(created_at) = report_date;
  
  -- Calcular faturamento do dia
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
