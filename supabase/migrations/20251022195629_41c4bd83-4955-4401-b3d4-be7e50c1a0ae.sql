-- Enable RLS on tables if not already enabled
ALTER TABLE event_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can view all event translations" ON event_translations;
DROP POLICY IF EXISTS "Admins can insert event translations" ON event_translations;
DROP POLICY IF EXISTS "Admins can update event translations" ON event_translations;
DROP POLICY IF EXISTS "Admins can delete event translations" ON event_translations;

DROP POLICY IF EXISTS "Admins can view all event speakers" ON event_speakers;
DROP POLICY IF EXISTS "Admins can insert event speakers" ON event_speakers;
DROP POLICY IF EXISTS "Admins can update event speakers" ON event_speakers;
DROP POLICY IF EXISTS "Admins can delete event speakers" ON event_speakers;

-- Create admin policies for event_translations (full CRUD access for admins)
CREATE POLICY "Admins can view all event translations"
  ON event_translations
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Admins can insert event translations"
  ON event_translations
  FOR INSERT
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update event translations"
  ON event_translations
  FOR UPDATE
  USING (is_current_user_admin());

CREATE POLICY "Admins can delete event translations"
  ON event_translations
  FOR DELETE
  USING (is_current_user_admin());

-- Create admin policies for event_speakers (full CRUD access for admins)
CREATE POLICY "Admins can view all event speakers"
  ON event_speakers
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Admins can insert event speakers"
  ON event_speakers
  FOR INSERT
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update event speakers"
  ON event_speakers
  FOR UPDATE
  USING (is_current_user_admin());

CREATE POLICY "Admins can delete event speakers"
  ON event_speakers
  FOR DELETE
  USING (is_current_user_admin());

-- Also ensure public can read published event data (if not already done)
DROP POLICY IF EXISTS "Public can view published event translations" ON event_translations;
DROP POLICY IF EXISTS "Public can view published event speakers" ON event_speakers;

CREATE POLICY "Public can view published event translations"
  ON event_translations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_translations.event_id
      AND events.status_publicacao = 'published'
    )
  );

CREATE POLICY "Public can view published event speakers"
  ON event_speakers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.status_publicacao = 'published'
    )
  );