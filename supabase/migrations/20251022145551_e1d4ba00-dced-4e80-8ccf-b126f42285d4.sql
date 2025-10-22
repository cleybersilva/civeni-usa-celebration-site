-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'work-submissions';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view work submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete work submissions" ON storage.objects;

-- Create comprehensive RLS policies for work submissions bucket
CREATE POLICY "Public can upload work submissions"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'work-submissions' AND
  (storage.foldername(name))[1] = 'submissions'
);

CREATE POLICY "Public can view work submissions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-submissions');

CREATE POLICY "Public can update work submissions metadata"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'work-submissions')
WITH CHECK (bucket_id = 'work-submissions');

CREATE POLICY "Admins can delete work submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'work-submissions');