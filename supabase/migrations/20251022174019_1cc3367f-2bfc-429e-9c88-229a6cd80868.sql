-- ============================================
-- CIVENI 2025 - STRIPE MIRROR SCHEMA
-- Dashboard Financeiro em tempo real
-- ============================================

-- 1. Tabela de eventos Stripe (idempotência)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY, -- event.id do Stripe
  type TEXT NOT NULL,
  api_version TEXT,
  created_utc TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  payload_json JSONB,
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created ON public.stripe_events(created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON public.stripe_events(status) WHERE status != 'processed';

-- 2. Checkout Sessions
CREATE TABLE IF NOT EXISTS public.stripe_checkout_sessions (
  id TEXT PRIMARY KEY, -- session_id
  payment_intent_id TEXT,
  customer_id TEXT,
  mode TEXT,
  status TEXT,
  currency TEXT DEFAULT 'BRL',
  amount_total INTEGER, -- centavos
  url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_utc TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_pi ON public.stripe_checkout_sessions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_created ON public.stripe_checkout_sessions(created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_metadata ON public.stripe_checkout_sessions USING GIN(metadata);

-- 3. Payment Intents
CREATE TABLE IF NOT EXISTS public.stripe_payment_intents (
  id TEXT PRIMARY KEY,
  status TEXT,
  amount INTEGER,
  amount_received INTEGER,
  currency TEXT DEFAULT 'BRL',
  confirmation_method TEXT,
  latest_charge_id TEXT,
  customer_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_utc TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_pi_status ON public.stripe_payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_stripe_pi_created ON public.stripe_payment_intents(created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_pi_metadata ON public.stripe_payment_intents USING GIN(metadata);

-- 4. Charges (verdade de captura + detalhes do cartão)
CREATE TABLE IF NOT EXISTS public.stripe_charges (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT,
  status TEXT,
  amount INTEGER,
  currency TEXT DEFAULT 'BRL',
  paid BOOLEAN DEFAULT FALSE,
  captured BOOLEAN DEFAULT FALSE,
  balance_txn_id TEXT,
  brand TEXT, -- Visa, Mastercard, etc
  funding TEXT, -- credit, debit
  last4 TEXT, -- últimos 4 dígitos
  exp_month INTEGER,
  exp_year INTEGER,
  card_country TEXT,
  receipt_url TEXT,
  outcome_type TEXT, -- authorized, manual_review, issuer_declined, etc
  failure_code TEXT,
  failure_message TEXT,
  created_utc TIMESTAMPTZ NOT NULL,
  fee_amount INTEGER,
  fee_currency TEXT,
  net_amount INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_charges_pi ON public.stripe_charges(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_charges_status ON public.stripe_charges(status);
CREATE INDEX IF NOT EXISTS idx_stripe_charges_created ON public.stripe_charges(created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_charges_brand ON public.stripe_charges(brand);
CREATE INDEX IF NOT EXISTS idx_stripe_charges_balance ON public.stripe_charges(balance_txn_id);

-- 5. Refunds
CREATE TABLE IF NOT EXISTS public.stripe_refunds (
  id TEXT PRIMARY KEY,
  charge_id TEXT,
  payment_intent_id TEXT,
  status TEXT,
  amount INTEGER,
  currency TEXT DEFAULT 'BRL',
  reason TEXT,
  created_utc TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_refunds_charge ON public.stripe_refunds(charge_id);
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_pi ON public.stripe_refunds(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_created ON public.stripe_refunds(created_utc DESC);

-- 6. Disputes (chargebacks)
CREATE TABLE IF NOT EXISTS public.stripe_disputes (
  id TEXT PRIMARY KEY,
  charge_id TEXT,
  amount INTEGER,
  currency TEXT DEFAULT 'BRL',
  reason TEXT,
  status TEXT,
  evidence_due_by TIMESTAMPTZ,
  created_utc TIMESTAMPTZ NOT NULL,
  closed_utc TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_disputes_charge ON public.stripe_disputes(charge_id);
CREATE INDEX IF NOT EXISTS idx_stripe_disputes_status ON public.stripe_disputes(status);
CREATE INDEX IF NOT EXISTS idx_stripe_disputes_created ON public.stripe_disputes(created_utc DESC);

-- 7. Payouts
CREATE TABLE IF NOT EXISTS public.stripe_payouts (
  id TEXT PRIMARY KEY,
  amount INTEGER,
  currency TEXT DEFAULT 'BRL',
  arrival_date_utc TIMESTAMPTZ,
  status TEXT,
  balance_txn_id TEXT,
  created_utc TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_payouts_arrival ON public.stripe_payouts(arrival_date_utc DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_status ON public.stripe_payouts(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_created ON public.stripe_payouts(created_utc DESC);

-- 8. Balance Transactions (verdade sobre taxas e líquido)
CREATE TABLE IF NOT EXISTS public.stripe_balance_transactions (
  id TEXT PRIMARY KEY,
  amount INTEGER,
  currency TEXT DEFAULT 'BRL',
  fee INTEGER,
  net INTEGER,
  reporting_category TEXT,
  available_on_utc TIMESTAMPTZ,
  created_utc TIMESTAMPTZ NOT NULL,
  source_id TEXT,
  type TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_bt_source ON public.stripe_balance_transactions(source_id);
CREATE INDEX IF NOT EXISTS idx_stripe_bt_created ON public.stripe_balance_transactions(created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_bt_available ON public.stripe_balance_transactions(available_on_utc DESC);

-- 9. Atualizar event_registrations com referências Stripe
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_event_reg_session ON public.event_registrations(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_pi ON public.event_registrations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_charge ON public.event_registrations(stripe_charge_id);

-- ============================================
-- VIEWS PARA O DASHBOARD
-- ============================================

-- View: KPIs gerais
CREATE OR REPLACE VIEW public.v_fin_kpis AS
SELECT
  c.currency,
  SUM(c.amount)::NUMERIC / 100.0 AS bruto,
  SUM(COALESCE(bt.fee, c.fee_amount, 0))::NUMERIC / 100.0 AS taxas,
  SUM(COALESCE(bt.net, c.net_amount, c.amount - COALESCE(c.fee_amount, 0)))::NUMERIC / 100.0 AS liquido,
  AVG(NULLIF(c.amount, 0))::NUMERIC / 100.0 AS ticket_medio,
  COUNT(*) FILTER (WHERE c.status = 'succeeded' AND c.paid = TRUE) AS pagos,
  COUNT(*) FILTER (WHERE c.status != 'succeeded' OR c.paid = FALSE) AS nao_pagos,
  COUNT(DISTINCT c.payment_intent_id) AS intents_unicos
FROM public.stripe_charges c
LEFT JOIN public.stripe_balance_transactions bt ON bt.id = c.balance_txn_id
GROUP BY c.currency;

-- View: Receita diária (timezone America/Fortaleza)
CREATE OR REPLACE VIEW public.v_fin_receita_diaria AS
SELECT
  (c.created_utc AT TIME ZONE 'America/Fortaleza')::DATE AS dia,
  c.currency,
  SUM(COALESCE(bt.net, c.net_amount, c.amount - COALESCE(c.fee_amount, 0)))::NUMERIC / 100.0 AS receita_liquida,
  SUM(c.amount)::NUMERIC / 100.0 AS receita_bruta,
  SUM(COALESCE(bt.fee, c.fee_amount, 0))::NUMERIC / 100.0 AS taxas,
  COUNT(*) AS transacoes
FROM public.stripe_charges c
LEFT JOIN public.stripe_balance_transactions bt ON bt.id = c.balance_txn_id
WHERE c.status = 'succeeded' AND c.paid = TRUE
GROUP BY 1, 2
ORDER BY 1 DESC;

-- View: Por bandeira
CREATE OR REPLACE VIEW public.v_fin_por_bandeira AS
SELECT
  COALESCE(c.brand, 'unknown') AS bandeira,
  c.funding,
  c.currency,
  COUNT(*) AS qtd,
  SUM(COALESCE(bt.net, c.net_amount, c.amount - COALESCE(c.fee_amount, 0)))::NUMERIC / 100.0 AS receita_liquida,
  SUM(c.amount)::NUMERIC / 100.0 AS receita_bruta
FROM public.stripe_charges c
LEFT JOIN public.stripe_balance_transactions bt ON bt.id = c.balance_txn_id
WHERE c.status = 'succeeded' AND c.paid = TRUE
GROUP BY 1, 2, 3
ORDER BY receita_liquida DESC;

-- View: Funnel de conversão
CREATE OR REPLACE VIEW public.v_fin_funnel AS
WITH sessions AS (
  SELECT COUNT(*) AS total_sessions
  FROM public.stripe_checkout_sessions
),
intents AS (
  SELECT COUNT(*) AS total_intents
  FROM public.stripe_payment_intents
),
charges_ok AS (
  SELECT COUNT(*) AS charges_succeeded
  FROM public.stripe_charges
  WHERE status = 'succeeded' AND paid = TRUE
)
SELECT 
  s.total_sessions,
  i.total_intents,
  c.charges_succeeded,
  CASE WHEN s.total_sessions > 0 
    THEN (c.charges_succeeded::NUMERIC / s.total_sessions * 100)::NUMERIC(5,2)
    ELSE 0 
  END AS taxa_conversao
FROM sessions s, intents i, charges_ok c;

-- View: Heatmap por hora (timezone BRT)
CREATE OR REPLACE VIEW public.v_fin_heatmap_hora AS
SELECT
  EXTRACT(HOUR FROM c.created_utc AT TIME ZONE 'America/Fortaleza') AS hora,
  COUNT(*) AS qtd_transacoes,
  SUM(COALESCE(bt.net, c.net_amount))::NUMERIC / 100.0 AS receita_liquida
FROM public.stripe_charges c
LEFT JOIN public.stripe_balance_transactions bt ON bt.id = c.balance_txn_id
WHERE c.status = 'succeeded' AND c.paid = TRUE
GROUP BY 1
ORDER BY 1;

-- View: Por lote/cupom (via metadata)
CREATE OR REPLACE VIEW public.v_fin_coupons_lotes AS
SELECT
  COALESCE(pi.metadata->>'lot_code', pi.metadata->>'category_name', 'Sem Lote') AS lote,
  COALESCE(pi.metadata->>'coupon_code', 'sem_cupom') AS cupom,
  c.currency,
  COUNT(*) AS qtd,
  SUM(COALESCE(bt.net, c.net_amount))::NUMERIC / 100.0 AS receita_liquida,
  SUM(c.amount)::NUMERIC / 100.0 AS receita_bruta
FROM public.stripe_charges c
JOIN public.stripe_payment_intents pi ON pi.id = c.payment_intent_id
LEFT JOIN public.stripe_balance_transactions bt ON bt.id = c.balance_txn_id
WHERE c.status = 'succeeded' AND c.paid = TRUE
GROUP BY 1, 2, 3
ORDER BY receita_liquida DESC;

-- ============================================
-- RLS POLICIES (Admin financeiro apenas)
-- ============================================

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_balance_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas admin pode ler
CREATE POLICY stripe_events_admin_only ON public.stripe_events FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_sessions_admin_only ON public.stripe_checkout_sessions FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_pi_admin_only ON public.stripe_payment_intents FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_charges_admin_only ON public.stripe_charges FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_refunds_admin_only ON public.stripe_refunds FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_disputes_admin_only ON public.stripe_disputes FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_payouts_admin_only ON public.stripe_payouts FOR ALL USING (is_current_user_admin());
CREATE POLICY stripe_bt_admin_only ON public.stripe_balance_transactions FOR ALL USING (is_current_user_admin());

-- ============================================
-- REALTIME (habilitar para as tabelas críticas)
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_charges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_payment_intents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_refunds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_payouts;