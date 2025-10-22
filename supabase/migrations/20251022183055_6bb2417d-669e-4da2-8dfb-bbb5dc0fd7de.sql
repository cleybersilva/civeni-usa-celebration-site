-- Adicionar foreign key entre stripe_charges e stripe_customers
ALTER TABLE public.stripe_charges 
  ADD CONSTRAINT fk_stripe_charges_customer 
  FOREIGN KEY (customer_id) 
  REFERENCES public.stripe_customers(id)
  ON DELETE SET NULL;