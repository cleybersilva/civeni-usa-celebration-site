-- Ensure anon role has access to storage.buckets
GRANT SELECT ON storage.buckets TO anon;

-- Ensure anon role has necessary storage permissions
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO anon, authenticated;

-- Verify the work-submissions bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'work-submissions';