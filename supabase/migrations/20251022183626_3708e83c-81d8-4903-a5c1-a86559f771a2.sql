-- Remover foreign key antiga duplicada
ALTER TABLE public.stripe_charges 
  DROP CONSTRAINT IF EXISTS stripe_charges_customer_id_fkey;