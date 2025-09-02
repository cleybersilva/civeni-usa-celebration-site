-- Storage policies to allow banner image uploads to the public 'site-civeni' bucket
-- This enables the Admin SaaS to upload banner images via the browser without RLS violations
-- Policies are restricted to the 'banners/' folder within the 'site-civeni' bucket for safety

-- Allow SELECT for banner objects in site-civeni
CREATE POLICY "site_civeni_banners_select_public"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'site-civeni'
  AND name LIKE 'banners/%'
);

-- Allow INSERT (uploads) for banner objects in site-civeni
CREATE POLICY "site_civeni_banners_insert_public"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'site-civeni'
  AND name LIKE 'banners/%'
);

-- Allow UPDATE for banner objects in site-civeni (e.g., overwrite metadata)
CREATE POLICY "site_civeni_banners_update_public"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'site-civeni' AND name LIKE 'banners/%'
)
WITH CHECK (
  bucket_id = 'site-civeni' AND name LIKE 'banners/%'
);

-- Allow DELETE for banner objects in site-civeni (cleanup when removing a banner)
CREATE POLICY "site_civeni_banners_delete_public"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'site-civeni' AND name LIKE 'banners/%'
);
