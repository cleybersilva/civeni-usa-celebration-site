-- Create video submissions table for managing student video submissions
CREATE TABLE public.video_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  participant_type TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('video_link', 'video_email')),
  video_link TEXT NULL,
  message TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  internal_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "video_submissions_public_insert" 
ON public.video_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "video_submissions_admin_read" 
ON public.video_submissions 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "video_submissions_admin_update" 
ON public.video_submissions 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_submissions_updated_at
BEFORE UPDATE ON public.video_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();