-- Add country_code and flag_image_url fields to cms_speakers table
ALTER TABLE public.cms_speakers
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS flag_image_url TEXT;

COMMENT ON COLUMN public.cms_speakers.country_code IS 'ISO country code (e.g., br, us, pt) for automatic flag display';
COMMENT ON COLUMN public.cms_speakers.flag_image_url IS 'URL for custom uploaded flag image (PNG/SVG)';