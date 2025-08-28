-- Restrict work_submissions to use secure edge function only
-- Remove public INSERT policy and replace with system-only policy

DROP POLICY IF EXISTS "work_submissions_insert_public" ON public.work_submissions;

-- Create system-only INSERT policy (only edge functions with service role can insert)
CREATE POLICY "work_submissions_insert_system_only" 
ON public.work_submissions 
FOR INSERT 
WITH CHECK (false); -- No direct public inserts allowed

-- Ensure RLS is enabled
ALTER TABLE public.work_submissions ENABLE ROW LEVEL SECURITY;