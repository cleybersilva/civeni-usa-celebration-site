
-- Create event_registrations table (referenced by Stripe edge function)
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

-- Create policy to allow public access (needed for Stripe webhooks)
CREATE POLICY "Allow public insert on event_registrations" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on event_registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Allow public update on event_registrations" ON public.event_registrations FOR UPDATE USING (true);

-- Add some sample coupon codes for testing
INSERT INTO public.coupon_codes (code, category_id, is_active, usage_limit) VALUES
('STUDENT2025', (SELECT id FROM public.registration_categories WHERE category_name = 'vccu_professor_partner' LIMIT 1), true, 50),
('PROFESSOR2025', (SELECT id FROM public.registration_categories WHERE category_name = 'vccu_professor_partner' LIMIT 1), true, 100);

-- Create validate_coupon function
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  category_id UUID,
  category_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (cc.is_active AND (cc.usage_limit IS NULL OR cc.used_count < cc.usage_limit)) as is_valid,
    rc.id as category_id,
    rc.category_name
  FROM public.coupon_codes cc
  JOIN public.registration_categories rc ON cc.category_id = rc.id
  WHERE cc.code = coupon_code;
END;
$$;
