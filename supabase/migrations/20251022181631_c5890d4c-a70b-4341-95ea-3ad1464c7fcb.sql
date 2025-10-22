-- Adicionar foreign key entre stripe_charges e stripe_balance_transactions
ALTER TABLE public.stripe_charges 
  ADD CONSTRAINT fk_stripe_charges_balance_txn 
  FOREIGN KEY (balance_txn_id) 
  REFERENCES public.stripe_balance_transactions(id)
  ON DELETE SET NULL;