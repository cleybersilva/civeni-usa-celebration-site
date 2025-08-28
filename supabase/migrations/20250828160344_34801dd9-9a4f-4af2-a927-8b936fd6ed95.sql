-- Create public storage bucket for site images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-civeni', 'site-civeni', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create public read policy for the site bucket
CREATE POLICY "public read images"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'site-civeni');

-- Also allow authenticated users to read
CREATE POLICY "authenticated read images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'site-civeni');

-- Admin policies for managing images
CREATE POLICY "admin insert images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-civeni' AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true)
    AND (user_type IN ('admin', 'admin_root') OR is_admin_root = true)
  )
);

CREATE POLICY "admin update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-civeni' AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true)
    AND (user_type IN ('admin', 'admin_root') OR is_admin_root = true)
  )
);

CREATE POLICY "admin delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-civeni' AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = current_setting('app.current_user_email', true)
    AND (user_type IN ('admin', 'admin_root') OR is_admin_root = true)
  )
);