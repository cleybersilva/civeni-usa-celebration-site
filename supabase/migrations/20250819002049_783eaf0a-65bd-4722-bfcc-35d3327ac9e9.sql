-- Fix remaining functions with missing search_path

CREATE OR REPLACE FUNCTION public.trigger_payment_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só dispara se o status mudou para 'completed'
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Inserir log de alerta para email
    INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
    VALUES (
      'payment_completed',
      'email',
      'cleyber.silva@live.com',
      'Pagamento confirmado: ' || NEW.full_name || ' - R$ ' || COALESCE(NEW.amount_paid::text, '0'),
      NEW.id
    );
    
    -- Inserir log de alerta para SMS
    INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
    VALUES (
      'payment_completed',
      'sms',
      '(83) 98832-9018',
      'Pagamento: ' || NEW.full_name || ' - R$ ' || COALESCE(NEW.amount_paid::text, '0'),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_registration_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir log de alerta para email
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
  VALUES (
    'new_registration',
    'email',
    'cleyber.silva@live.com',
    'Nova inscrição realizada: ' || NEW.full_name || ' (' || NEW.email || ')',
    NEW.id
  );
  
  -- Inserir log de alerta para SMS
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
  VALUES (
    'new_registration',
    'sms',
    '(83) 98832-9018',
    'Nova inscrição: ' || NEW.full_name,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;