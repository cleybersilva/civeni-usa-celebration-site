
-- Create registration batches table
CREATE TABLE public.registration_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create registration categories table
CREATE TABLE public.registration_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.registration_batches(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  price_brl DECIMAL(10,2) NOT NULL,
  requires_proof BOOLEAN DEFAULT false,
  is_exempt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coupon codes table
CREATE TABLE public.coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.registration_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create registrations table to track payments
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  category_id UUID REFERENCES public.registration_categories(id),
  batch_id UUID REFERENCES public.registration_batches(id),
  stripe_session_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert sample data for testing
INSERT INTO public.registration_batches (batch_number, start_date, end_date) VALUES
(1, '2025-01-01', '2025-03-31'),
(2, '2025-04-01', '2025-06-30'),
(3, '2025-07-01', '2025-09-30');

-- Get the first batch ID for categories
INSERT INTO public.registration_categories (batch_id, category_name, price_brl, requires_proof, is_exempt) VALUES
((SELECT id FROM public.registration_batches WHERE batch_number = 1), 'vccu_student_presentation', 150.00, true, false),
((SELECT id FROM public.registration_batches WHERE batch_number = 1), 'vccu_student_listener', 100.00, true, false),
((SELECT id FROM public.registration_batches WHERE batch_number = 1), 'vccu_professor_partner', 0.00, true, true),
((SELECT id FROM public.registration_batches WHERE batch_number = 1), 'general_participant', 300.00, false, false);

-- Enable Row Level Security (optional - can be added later if needed)
ALTER TABLE public.registration_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access for registration data
CREATE POLICY "Allow public read on registration_batches" ON public.registration_batches FOR SELECT USING (true);
CREATE POLICY "Allow public read on registration_categories" ON public.registration_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read on coupon_codes" ON public.coupon_codes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on registrations" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on registrations" ON public.registrations FOR SELECT USING (true);
