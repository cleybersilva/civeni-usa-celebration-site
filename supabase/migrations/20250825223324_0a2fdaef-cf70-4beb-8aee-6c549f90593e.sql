-- Create event_category table
CREATE TABLE public.event_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_free BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'BRL',
  price_cents INTEGER,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  quota_total INTEGER,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  lot_id UUID,
  title_pt TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  title_tr TEXT,
  description_pt TEXT,
  description_en TEXT,
  description_es TEXT,
  description_tr TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_category ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (filtered by is_active and date ranges)
CREATE POLICY "event_category_public_read" ON public.event_category
FOR SELECT
USING (
  is_active = true AND
  (available_from IS NULL OR available_from <= now()) AND
  (available_until IS NULL OR available_until >= now())
);

-- Create policies for admin access
CREATE POLICY "event_category_admin_all" ON public.event_category
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create audit table for changes
CREATE TABLE public.event_category_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.event_category(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.event_category_audit ENABLE ROW LEVEL SECURITY;

-- Admin-only access to audit
CREATE POLICY "event_category_audit_admin_read" ON public.event_category_audit
FOR SELECT
USING (is_current_user_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_event_category_updated_at
BEFORE UPDATE ON public.event_category
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial categories based on current data
INSERT INTO public.event_category (
  event_id,
  slug,
  order_index,
  is_active,
  is_free,
  currency,
  price_cents,
  title_pt,
  title_en,
  title_es,
  title_tr
) VALUES 
(
  gen_random_uuid(), -- We'll use a fixed event_id for CIVENI
  'aluno-vccu-apresentacao',
  1,
  true,
  false,
  'BRL',
  15000, -- R$ 150.00 in cents
  'Aluno(a) VCCU – Apresentação',
  'VCCU Student – Presentation',
  'Estudiante VCCU – Presentación',
  'VCCU Öğrencisi – Sunum'
),
(
  (SELECT event_id FROM public.event_category LIMIT 1), -- Same event_id
  'aluno-vccu-ouvinte',
  2,
  true,
  false,
  'BRL',
  10000, -- R$ 100.00 in cents
  'Aluno(a) VCCU – Ouvinte',
  'VCCU Student – Listener',
  'Estudiante VCCU – Oyente',
  'VCCU Öğrencisi – Dinleyici'
),
(
  (SELECT event_id FROM public.event_category LIMIT 1), -- Same event_id
  'professor-vccu-parceiro',
  3,
  true,
  true,
  'BRL',
  0,
  'Professor(a) VCCU – Parceiro',
  'VCCU Professor – Partner',
  'Profesor VCCU – Socio',
  'VCCU Profesörü – Ortak'
),
(
  (SELECT event_id FROM public.event_category LIMIT 1), -- Same event_id
  'participante-geral',
  4,
  true,
  false,
  'BRL',
  30000, -- R$ 300.00 in cents
  'Participante Geral',
  'General Participant',
  'Participante General',
  'Genel Katılımcı'
);