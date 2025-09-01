-- Add is_promotional column to event_category table
ALTER TABLE public.event_category 
ADD COLUMN is_promotional BOOLEAN NOT NULL DEFAULT false;

-- Add index for better performance when filtering
CREATE INDEX idx_event_category_promotional_active ON public.event_category (is_promotional, is_active);