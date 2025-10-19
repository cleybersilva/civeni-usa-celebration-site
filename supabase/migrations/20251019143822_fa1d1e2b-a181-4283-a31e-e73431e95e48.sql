-- Corrigir views removendo SECURITY DEFINER e adicionando search_path nas funções

DROP VIEW IF EXISTS public.public_meet_rooms;
DROP VIEW IF EXISTS public.v_sessions_front;

-- Recriar views sem SECURITY DEFINER
CREATE VIEW public.public_meet_rooms AS
SELECT id, name, status, moderators, capacity, visibility, notes
FROM public.meet_rooms;

CREATE VIEW public.v_sessions_front AS
SELECT 
  s.id,
  s.day,
  s.track,
  s.type,
  s.title,
  s.speakers,
  s.location,
  s.start_at AS start_et,
  s.end_at AS end_et,
  s.timezone,
  s.status,
  s.stream_id,
  s.meet_room_id,
  s.materials
FROM public.sessions s
WHERE s.visibility = 'public';

-- Recriar função com search_path
DROP FUNCTION IF EXISTS public.user_is_enrolled(UUID);
CREATE OR REPLACE FUNCTION public.user_is_enrolled(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_registrations 
    WHERE id = uid 
    AND payment_status = 'completed'
  );
$$;

-- Recriar trigger function com search_path
DROP FUNCTION IF EXISTS public.update_transmission_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_transmission_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar triggers
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON public.streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

CREATE TRIGGER update_meet_rooms_updated_at
  BEFORE UPDATE ON public.meet_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transmission_updated_at();