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

-- Helper: base Supabase URL
-- Note: hardcoded to current project ref per client config
WITH const AS (
  SELECT 'https://wdkeqxfglmritghmakma.supabase.co'::text AS base
)

-- Normalize banner_slides.bg_image
UPDATE public.banner_slides b
SET bg_image = CASE
  WHEN b.bg_image IS NULL OR b.bg_image = '' THEN b.bg_image
  WHEN b.bg_image LIKE 'data:%' THEN b.bg_image
  WHEN b.bg_image LIKE 'http%' THEN split_part(regexp_replace(b.bg_image, '/object/sign/', '/object/public/'), '?', 1)
  WHEN b.bg_image LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(b.bg_image,'?',1) FROM const)
  WHEN b.bg_image LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(b.bg_image,'?',1) FROM const)
  WHEN b.bg_image LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || b.bg_image FROM const)
  ELSE b.bg_image
END
WHERE b.bg_image IS NOT NULL AND b.bg_image <> '';

-- Normalize civeni_ii_2024_images.url
UPDATE public.civeni_ii_2024_images i
SET url = CASE
  WHEN i.url IS NULL OR i.url = '' THEN i.url
  WHEN i.url LIKE 'data:%' THEN i.url
  WHEN i.url LIKE 'http%' THEN split_part(regexp_replace(i.url, '/object/sign/', '/object/public/'), '?', 1)
  WHEN i.url LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(i.url,'?',1) FROM const)
  WHEN i.url LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(i.url,'?',1) FROM const)
  WHEN i.url LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || i.url FROM const)
  ELSE i.url
END
WHERE i.url IS NOT NULL AND i.url <> '';

-- Normalize partners.logo
UPDATE public.partners p
SET logo = CASE
  WHEN p.logo IS NULL OR p.logo = '' THEN p.logo
  WHEN p.logo LIKE 'data:%' THEN p.logo
  WHEN p.logo LIKE 'http%' THEN split_part(regexp_replace(p.logo, '/object/sign/', '/object/public/'), '?', 1)
  WHEN p.logo LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(p.logo,'?',1) FROM const)
  WHEN p.logo LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(p.logo,'?',1) FROM const)
  WHEN p.logo LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || p.logo FROM const)
  ELSE p.logo
END
WHERE p.logo IS NOT NULL AND p.logo <> '';

-- Normalize videos.thumbnail
UPDATE public.videos v
SET thumbnail = CASE
  WHEN v.thumbnail IS NULL OR v.thumbnail = '' THEN v.thumbnail
  WHEN v.thumbnail LIKE 'data:%' THEN v.thumbnail
  WHEN v.thumbnail LIKE 'http%' THEN split_part(regexp_replace(v.thumbnail, '/object/sign/', '/object/public/'), '?', 1)
  WHEN v.thumbnail LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(v.thumbnail,'?',1) FROM const)
  WHEN v.thumbnail LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(v.thumbnail,'?',1) FROM const)
  WHEN v.thumbnail LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || v.thumbnail FROM const)
  ELSE v.thumbnail
END
WHERE v.thumbnail IS NOT NULL AND v.thumbnail <> '';

-- Normalize schedules.speaker_photo_url
UPDATE public.schedules s
SET speaker_photo_url = CASE
  WHEN s.speaker_photo_url IS NULL OR s.speaker_photo_url = '' THEN s.speaker_photo_url
  WHEN s.speaker_photo_url LIKE 'data:%' THEN s.speaker_photo_url
  WHEN s.speaker_photo_url LIKE 'http%' THEN split_part(regexp_replace(s.speaker_photo_url, '/object/sign/', '/object/public/'), '?', 1)
  WHEN s.speaker_photo_url LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(s.speaker_photo_url,'?',1) FROM const)
  WHEN s.speaker_photo_url LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(s.speaker_photo_url,'?',1) FROM const)
  WHEN s.speaker_photo_url LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || s.speaker_photo_url FROM const)
  ELSE s.speaker_photo_url
END
WHERE s.speaker_photo_url IS NOT NULL AND s.speaker_photo_url <> '';

-- Normalize congresso_comite.foto_url
UPDATE public.congresso_comite c
SET foto_url = CASE
  WHEN c.foto_url IS NULL OR c.foto_url = '' THEN c.foto_url
  WHEN c.foto_url LIKE 'data:%' THEN c.foto_url
  WHEN c.foto_url LIKE 'http%' THEN split_part(regexp_replace(c.foto_url, '/object/sign/', '/object/public/'), '?', 1)
  WHEN c.foto_url LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(c.foto_url,'?',1) FROM const)
  WHEN c.foto_url LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(c.foto_url,'?',1) FROM const)
  WHEN c.foto_url LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || c.foto_url FROM const)
  ELSE c.foto_url
END
WHERE c.foto_url IS NOT NULL AND c.foto_url <> '';

-- Normalize congresso_apresentacao.imagem_destaque
UPDATE public.congresso_apresentacao ca
SET imagem_destaque = CASE
  WHEN ca.imagem_destaque IS NULL OR ca.imagem_destaque = '' THEN ca.imagem_destaque
  WHEN ca.imagem_destaque LIKE 'data:%' THEN ca.imagem_destaque
  WHEN ca.imagem_destaque LIKE 'http%' THEN split_part(regexp_replace(ca.imagem_destaque, '/object/sign/', '/object/public/'), '?', 1)
  WHEN ca.imagem_destaque LIKE '/storage/v1/object/public/site-civeni/%' THEN (SELECT base || split_part(ca.imagem_destaque,'?',1) FROM const)
  WHEN ca.imagem_destaque LIKE 'storage/v1/object/public/site-civeni/%' THEN (SELECT base || '/' || split_part(ca.imagem_destaque,'?',1) FROM const)
  WHEN ca.imagem_destaque LIKE 'site-civeni/%' THEN (SELECT base || '/storage/v1/object/public/' || ca.imagem_destaque FROM const)
  ELSE ca.imagem_destaque
END
WHERE ca.imagem_destaque IS NOT NULL AND ca.imagem_destaque <> '';
