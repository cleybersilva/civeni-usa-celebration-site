-- Criar tabela de customers do Stripe
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  description TEXT,
  metadata JSONB,
  default_source TEXT,
  invoice_prefix TEXT,
  balance INT DEFAULT 0,
  currency TEXT DEFAULT 'brl',
  delinquent BOOLEAN DEFAULT false,
  discount JSONB,
  created_utc TIMESTAMPTZ NOT NULL,
  updated_utc TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON public.stripe_customers(email);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_created ON public.stripe_customers(created_utc DESC);

-- RLS (somente admin)
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to stripe_customers"
  ON public.stripe_customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = current_setting('app.current_user_email', true)
      AND user_type IN ('admin', 'admin_root')
    )
  );

-- Realtime
ALTER TABLE public.stripe_customers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_customers;

-- Relacionar charges com customers
ALTER TABLE public.stripe_charges ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES public.stripe_customers(id);
CREATE INDEX IF NOT EXISTS idx_stripe_charges_customer ON public.stripe_charges(customer_id);

-- Relacionar payment_intents com customers  
ALTER TABLE public.stripe_payment_intents ADD COLUMN IF NOT EXISTS customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_stripe_payment_intents_customer ON public.stripe_payment_intents(customer_id);

-- View com estatísticas de customers
CREATE OR REPLACE VIEW v_fin_customers AS
SELECT 
  c.id,
  c.email,
  c.name,
  c.created_utc,
  COUNT(DISTINCT ch.id) AS total_pagamentos,
  SUM(CASE WHEN ch.status = 'succeeded' AND ch.paid THEN ch.amount ELSE 0 END) / 100.0 AS total_gasto,
  COUNT(DISTINCT r.id) AS total_reembolsos,
  MAX(ch.created_utc) AS ultimo_pagamento,
  c.default_source AS forma_pagamento_padrao
FROM public.stripe_customers c
LEFT JOIN public.stripe_charges ch ON ch.customer_id = c.id
LEFT JOIN public.stripe_refunds r ON r.charge_id = ch.id
GROUP BY c.id, c.email, c.name, c.created_utc, c.default_source
ORDER BY total_gasto DESC;