-- Create storage bucket for work submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-submissions', 'work-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for work submissions bucket
CREATE POLICY "Anyone can upload work submissions"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'work-submissions');

CREATE POLICY "Anyone can view work submissions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-submissions');

CREATE POLICY "Admins can delete work submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'work-submissions');