
-- Update the batch dates according to the requirements
UPDATE public.registration_batches 
SET start_date = '2025-06-20', end_date = '2025-08-31' 
WHERE batch_number = 1;

UPDATE public.registration_batches 
SET start_date = '2025-09-01', end_date = '2025-11-01' 
WHERE batch_number = 2;

-- Make sure we have categories for both batches
INSERT INTO public.registration_categories (batch_id, category_name, price_brl, requires_proof, is_exempt) VALUES
((SELECT id FROM public.registration_batches WHERE batch_number = 2), 'vccu_student_presentation', 180.00, true, false),
((SELECT id FROM public.registration_batches WHERE batch_number = 2), 'vccu_student_listener', 130.00, true, false),
((SELECT id FROM public.registration_batches WHERE batch_number = 2), 'vccu_professor_partner', 0.00, true, true),
((SELECT id FROM public.registration_batches WHERE batch_number = 2), 'general_participant', 350.00, false, false);
