-- Add Turkish translation fields to banner_slides table
ALTER TABLE banner_slides 
ADD COLUMN IF NOT EXISTS title_tr TEXT,
ADD COLUMN IF NOT EXISTS subtitle_tr TEXT,
ADD COLUMN IF NOT EXISTS description_tr TEXT,
ADD COLUMN IF NOT EXISTS button_text_tr TEXT;