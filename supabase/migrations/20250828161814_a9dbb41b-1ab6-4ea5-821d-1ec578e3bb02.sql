-- Ensure public bucket exists
insert into storage.buckets (id, name, public)
values ('site-civeni','site-civeni', true)
on conflict (id) do update set public = excluded.public;

-- Public read policy on storage.objects for this bucket (anon role)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'public read images'
  ) THEN
    CREATE POLICY "public read images"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'site-civeni');
  END IF;
END $$;

-- Normalize all image URLs to use public URLs
UPDATE public.banner_slides 
SET bg_image = CASE
  WHEN bg_image IS NULL OR bg_image = '' THEN bg_image
  WHEN bg_image LIKE 'data:%' THEN bg_image
  WHEN bg_image LIKE 'http%' THEN split_part(regexp_replace(bg_image, '/object/sign/', '/object/public/'), '?', 1)
  WHEN bg_image LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(bg_image,'?',1)
  WHEN bg_image LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(bg_image,'?',1)
  WHEN bg_image LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || bg_image
  ELSE bg_image
END
WHERE bg_image IS NOT NULL AND bg_image <> '';

UPDATE public.civeni_ii_2024_images
SET url = CASE
  WHEN url IS NULL OR url = '' THEN url
  WHEN url LIKE 'data:%' THEN url
  WHEN url LIKE 'http%' THEN split_part(regexp_replace(url, '/object/sign/', '/object/public/'), '?', 1)
  WHEN url LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(url,'?',1)
  WHEN url LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(url,'?',1)
  WHEN url LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || url
  ELSE url
END
WHERE url IS NOT NULL AND url <> '';

UPDATE public.partners
SET logo = CASE
  WHEN logo IS NULL OR logo = '' THEN logo
  WHEN logo LIKE 'data:%' THEN logo
  WHEN logo LIKE 'http%' THEN split_part(regexp_replace(logo, '/object/sign/', '/object/public/'), '?', 1)
  WHEN logo LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(logo,'?',1)
  WHEN logo LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(logo,'?',1)
  WHEN logo LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || logo
  ELSE logo
END
WHERE logo IS NOT NULL AND logo <> '';

UPDATE public.videos
SET thumbnail = CASE
  WHEN thumbnail IS NULL OR thumbnail = '' THEN thumbnail
  WHEN thumbnail LIKE 'data:%' THEN thumbnail
  WHEN thumbnail LIKE 'http%' THEN split_part(regexp_replace(thumbnail, '/object/sign/', '/object/public/'), '?', 1)
  WHEN thumbnail LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(thumbnail,'?',1)
  WHEN thumbnail LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(thumbnail,'?',1)
  WHEN thumbnail LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || thumbnail
  ELSE thumbnail
END
WHERE thumbnail IS NOT NULL AND thumbnail <> '';

UPDATE public.schedules
SET speaker_photo_url = CASE
  WHEN speaker_photo_url IS NULL OR speaker_photo_url = '' THEN speaker_photo_url
  WHEN speaker_photo_url LIKE 'data:%' THEN speaker_photo_url
  WHEN speaker_photo_url LIKE 'http%' THEN split_part(regexp_replace(speaker_photo_url, '/object/sign/', '/object/public/'), '?', 1)
  WHEN speaker_photo_url LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(speaker_photo_url,'?',1)
  WHEN speaker_photo_url LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(speaker_photo_url,'?',1)
  WHEN speaker_photo_url LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || speaker_photo_url
  ELSE speaker_photo_url
END
WHERE speaker_photo_url IS NOT NULL AND speaker_photo_url <> '';

UPDATE public.congresso_comite
SET foto_url = CASE
  WHEN foto_url IS NULL OR foto_url = '' THEN foto_url
  WHEN foto_url LIKE 'data:%' THEN foto_url
  WHEN foto_url LIKE 'http%' THEN split_part(regexp_replace(foto_url, '/object/sign/', '/object/public/'), '?', 1)
  WHEN foto_url LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(foto_url,'?',1)
  WHEN foto_url LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(foto_url,'?',1)
  WHEN foto_url LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || foto_url
  ELSE foto_url
END
WHERE foto_url IS NOT NULL AND foto_url <> '';

UPDATE public.congresso_apresentacao
SET imagem_destaque = CASE
  WHEN imagem_destaque IS NULL OR imagem_destaque = '' THEN imagem_destaque
  WHEN imagem_destaque LIKE 'data:%' THEN imagem_destaque
  WHEN imagem_destaque LIKE 'http%' THEN split_part(regexp_replace(imagem_destaque, '/object/sign/', '/object/public/'), '?', 1)
  WHEN imagem_destaque LIKE '/storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co' || split_part(imagem_destaque,'?',1)
  WHEN imagem_destaque LIKE 'storage/v1/object/public/site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/' || split_part(imagem_destaque,'?',1)
  WHEN imagem_destaque LIKE 'site-civeni/%' THEN 'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/' || imagem_destaque
  ELSE imagem_destaque
END
WHERE imagem_destaque IS NOT NULL AND imagem_destaque <> '';