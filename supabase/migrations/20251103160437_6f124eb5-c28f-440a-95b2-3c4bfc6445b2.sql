-- Índices para otimização de consultas temporais e financeiras
-- Estes índices reduzem drasticamente o tempo de resposta das queries de tendências

-- Índice para consultas de pagamentos por data de ocorrência (stripe_payments)
CREATE INDEX IF NOT EXISTS idx_stripe_payments_occurred_at 
  ON stripe_payments (occurred_at DESC NULLS LAST)
  WHERE occurred_at IS NOT NULL;

-- Índice composto para consultas de pagamentos por status e data
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status_occurred 
  ON stripe_payments (status, occurred_at DESC NULLS LAST)
  WHERE occurred_at IS NOT NULL;

-- Índice para consultas de charges por data de criação (stripe_charges)
CREATE INDEX IF NOT EXISTS idx_stripe_charges_created_utc 
  ON stripe_charges (created_utc DESC NULLS LAST)
  WHERE created_utc IS NOT NULL;

-- Índice composto para charges por currency e data (usado na view v_fin_receita_diaria)
CREATE INDEX IF NOT EXISTS idx_stripe_charges_currency_created 
  ON stripe_charges (currency, created_utc DESC NULLS LAST)
  WHERE created_utc IS NOT NULL;

-- Índice composto para charges por status e data
CREATE INDEX IF NOT EXISTS idx_stripe_charges_status_created 
  ON stripe_charges (status, created_utc DESC NULLS LAST)
  WHERE created_utc IS NOT NULL;

-- Índice para consultas de submissões por data de criação
CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
  ON submissions (created_at DESC);

-- Índice composto para consultas de submissões por status e data
CREATE INDEX IF NOT EXISTS idx_submissions_status_created_at 
  ON submissions (status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Índice para registros de eventos por data de criação
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at 
  ON event_registrations (created_at DESC);

-- Índice composto para registros por status de pagamento e data
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status_created 
  ON event_registrations (payment_status, created_at DESC);

-- Índice adicional para email normalizado em registros (usado no can_submit_trabalho)
CREATE INDEX IF NOT EXISTS idx_event_registrations_email_norm_status
  ON event_registrations (email_normalized, payment_status)
  WHERE email_normalized IS NOT NULL;

-- Índice para nome normalizado em registros
CREATE INDEX IF NOT EXISTS idx_event_registrations_name_norm_status
  ON event_registrations (full_name_normalized, payment_status)
  WHERE full_name_normalized IS NOT NULL;

-- Comentários explicativos
COMMENT ON INDEX idx_stripe_payments_occurred_at IS 'Acelera consultas de tendências temporais de pagamentos';
COMMENT ON INDEX idx_stripe_charges_created_utc IS 'Acelera consultas de tendências temporais de charges';
COMMENT ON INDEX idx_submissions_created_at IS 'Acelera consultas de tendências temporais de submissões';
COMMENT ON INDEX idx_event_registrations_created_at IS 'Acelera consultas de tendências temporais de registros';
COMMENT ON INDEX idx_event_registrations_email_norm_status IS 'Acelera validação de elegibilidade para submissão de trabalhos';