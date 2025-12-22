-- Add UPDATE policy for event_registrations to allow updates from anon users
-- This is needed for admin panel functionality

-- First, drop existing UPDATE policy if any
DROP POLICY IF EXISTS "Allow update event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow anon update event_registrations" ON public.event_registrations;

-- Create new UPDATE policy to allow updates
CREATE POLICY "Allow anon update event_registrations" 
ON public.event_registrations 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Also add DELETE policy for admin functionality
DROP POLICY IF EXISTS "Allow delete event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow anon delete event_registrations" ON public.event_registrations;

CREATE POLICY "Allow anon delete event_registrations" 
ON public.event_registrations 
FOR DELETE 
USING (true);