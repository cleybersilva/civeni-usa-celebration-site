-- Limpar todos os stripe_price_id e stripe_product_id para evitar conflitos test/live
UPDATE public.event_category 
SET stripe_price_id = NULL, stripe_product_id = NULL, sync_status = 'pending'
WHERE stripe_price_id IS NOT NULL OR stripe_product_id IS NOT NULL;