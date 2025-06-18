
-- Atualizar a data de início do 1º lote para hoje (18/06/2025)
UPDATE public.registration_batches 
SET start_date = '2025-06-18' 
WHERE batch_number = 1;
