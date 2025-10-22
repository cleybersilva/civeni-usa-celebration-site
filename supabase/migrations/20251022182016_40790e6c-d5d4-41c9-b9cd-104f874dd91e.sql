-- Adicionar foreign key entre stripe_charges e stripe_payment_intents
ALTER TABLE public.stripe_charges 
  ADD CONSTRAINT fk_stripe_charges_payment_intent 
  FOREIGN KEY (payment_intent_id) 
  REFERENCES public.stripe_payment_intents(id)
  ON DELETE CASCADE;