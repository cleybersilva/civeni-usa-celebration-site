-- Clean up duplicate policies on storage.objects for work-submissions bucket
-- Keep only the essential ones

-- Drop all existing work-submissions policies
DROP POLICY IF EXISTS "Allow admin read from work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete work-submissions files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update work-submissions files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view work-submissions files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to work-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to work-submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_admin_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_admin_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "work_submissions_insert_policy" ON storage.objects;

-- Now we have only these 4 policies from the previous migration:
-- 1. "Public can upload work submissions" (INSERT)
-- 2. "Public can view work submissions" (SELECT)
-- 3. "Public can update work submissions metadata" (UPDATE)
-- 4. "Admins can delete work submissions" (DELETE)