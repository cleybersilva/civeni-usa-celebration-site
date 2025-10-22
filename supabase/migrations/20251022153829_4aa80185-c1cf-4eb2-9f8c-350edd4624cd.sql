-- Conceder permissões básicas em storage.buckets
GRANT SELECT ON storage.buckets TO anon, authenticated, public;

-- Conceder permissões completas em storage.objects
GRANT ALL ON storage.objects TO anon, authenticated, public;