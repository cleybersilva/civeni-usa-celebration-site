
-- Criar função para disparar alertas de nova inscrição
CREATE OR REPLACE FUNCTION public.trigger_registration_alert()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar função para disparar alertas de pagamento
CREATE OR REPLACE FUNCTION public.trigger_payment_alert()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar a tabela event_registrations
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  category_id UUID REFERENCES public.registration_categories(id),
  batch_id UUID REFERENCES public.registration_batches(id),
  stripe_session_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (needed for Stripe webhooks)
CREATE POLICY "Allow public insert on event_registrations" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on event_registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Allow public update on event_registrations" ON public.event_registrations FOR UPDATE USING (true);

-- Criar triggers na tabela event_registrations
CREATE TRIGGER registration_alert_trigger
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_registration_alert();

CREATE TRIGGER payment_alert_trigger
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_payment_alert();
