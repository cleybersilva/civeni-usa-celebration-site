
-- Add missing payment-related columns to event_registrations table
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_type TEXT;
