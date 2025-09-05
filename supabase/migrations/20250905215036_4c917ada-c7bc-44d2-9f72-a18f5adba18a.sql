-- Add versioning and updated_at columns for image cache-busting
-- BANNERS
ALTER TABLE public.banner_slides
  ADD COLUMN IF NOT EXISTS image_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- SPEAKERS  
ALTER TABLE public.cms_speakers
  ADD COLUMN IF NOT EXISTS photo_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BANNERS triggers
DROP TRIGGER IF EXISTS tr_banners_updated_at ON public.banner_slides;
CREATE TRIGGER tr_banners_updated_at
  BEFORE UPDATE ON public.banner_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Increment version when image URL changes
CREATE OR REPLACE FUNCTION public.bump_image_version_banners() 
RETURNS trigger AS $$
BEGIN
  IF NEW.bg_image IS DISTINCT FROM OLD.bg_image THEN
    NEW.image_version := COALESCE(OLD.image_version,1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_banners_bump_version ON public.banner_slides;
CREATE TRIGGER tr_banners_bump_version
  BEFORE UPDATE ON public.banner_slides
  FOR EACH ROW EXECUTE FUNCTION public.bump_image_version_banners();

-- SPEAKERS triggers
DROP TRIGGER IF EXISTS tr_speakers_updated_at ON public.cms_speakers;
CREATE TRIGGER tr_speakers_updated_at
  BEFORE UPDATE ON public.cms_speakers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.bump_photo_version_speakers() 
RETURNS trigger AS $$
BEGIN
  IF NEW.image_url IS DISTINCT FROM OLD.image_url THEN
    NEW.photo_version := COALESCE(OLD.photo_version,1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_speakers_bump_version ON public.cms_speakers;
CREATE TRIGGER tr_speakers_bump_version
  BEFORE UPDATE ON public.cms_speakers
  FOR EACH ROW EXECUTE FUNCTION public.bump_photo_version_speakers();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_banners_updated_at ON public.banner_slides(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_speakers_updated_at ON public.cms_speakers(updated_at DESC);

-- Counter settings table for atomic saves
CREATE TABLE IF NOT EXISTS public.counter_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date,
  event_title_pt text,
  event_title_en text,
  event_title_es text,
  event_title_tr text,
  event_description_pt text,
  event_description_en text,
  event_description_es text,
  event_description_tr text,
  is_active boolean NOT NULL DEFAULT true,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure single row for counter settings
CREATE UNIQUE INDEX IF NOT EXISTS idx_counter_settings_single_row 
ON public.counter_settings((1)) WHERE is_active = true;

-- Counter settings trigger
DROP TRIGGER IF EXISTS tr_counter_settings_updated_at ON public.counter_settings;
CREATE TRIGGER tr_counter_settings_updated_at
  BEFORE UPDATE ON public.counter_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atomic save function for counter
CREATE OR REPLACE FUNCTION public.save_counter_settings(
  p_event_date date,
  p_event_title_pt text,
  p_event_title_en text,
  p_event_title_es text,
  p_event_title_tr text,
  p_event_description_pt text,
  p_event_description_en text,
  p_event_description_es text,
  p_event_description_tr text,
  p_user_email text,
  p_session_token uuid
)
RETURNS json AS $$
DECLARE
  session_ok boolean;
  result_id uuid;
BEGIN
  -- Validate session
  SELECT set_current_user_email_secure(p_user_email, p_session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;
  
  -- Ensure caller is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Atomic upsert
  INSERT INTO public.counter_settings (
    event_date, event_title_pt, event_title_en, event_title_es, event_title_tr,
    event_description_pt, event_description_en, event_description_es, event_description_tr,
    updated_by, is_active
  ) VALUES (
    p_event_date, p_event_title_pt, p_event_title_en, p_event_title_es, p_event_title_tr,
    p_event_description_pt, p_event_description_en, p_event_description_es, p_event_description_tr,
    p_user_email, true
  )
  ON CONFLICT ((1)) WHERE is_active = true
  DO UPDATE SET
    event_date = EXCLUDED.event_date,
    event_title_pt = EXCLUDED.event_title_pt,
    event_title_en = EXCLUDED.event_title_en,
    event_title_es = EXCLUDED.event_title_es,
    event_title_tr = EXCLUDED.event_title_tr,
    event_description_pt = EXCLUDED.event_description_pt,
    event_description_en = EXCLUDED.event_description_en,
    event_description_es = EXCLUDED.event_description_es,
    event_description_tr = EXCLUDED.event_description_tr,
    updated_by = EXCLUDED.updated_by,
    updated_at = now()
  RETURNING id INTO result_id;

  RETURN json_build_object('success', true, 'id', result_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for counter_settings
ALTER TABLE public.counter_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "counter_settings_admin_all" 
ON public.counter_settings 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "counter_settings_public_read" 
ON public.counter_settings 
FOR SELECT 
USING (is_active = true);

-- Initialize default counter settings if empty
INSERT INTO public.counter_settings (
  event_date, event_title_pt, event_title_en, event_title_es, event_title_tr,
  event_description_pt, event_description_en, event_description_es, event_description_tr
) 
SELECT 
  '2025-12-11'::date,
  'III CIVENI 2025',
  'III CIVENI 2025', 
  'III CIVENI 2025',
  'III CIVENI 2025',
  'Participe do maior evento de educação mundial',
  'Join the biggest education event worldwide',
  'Únete al mayor evento educativo mundial',
  'Dünyanın en büyük eğitim etkinliğine katılın'
WHERE NOT EXISTS (SELECT 1 FROM public.counter_settings WHERE is_active = true);