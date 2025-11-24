-- Add missing country fields to cms_speakers
ALTER TABLE cms_speakers
ADD COLUMN IF NOT EXISTS country_name text,
ADD COLUMN IF NOT EXISTS show_flag boolean DEFAULT true;

-- Create index on country_code for faster queries
CREATE INDEX IF NOT EXISTS idx_cms_speakers_country_code ON cms_speakers(country_code);