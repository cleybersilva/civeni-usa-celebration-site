-- Update the specific VCCU promotional category to hide it from public display
UPDATE public.event_category 
SET is_promotional = true 
WHERE id = '15418895-0c45-4105-a47b-c761839cfe25';