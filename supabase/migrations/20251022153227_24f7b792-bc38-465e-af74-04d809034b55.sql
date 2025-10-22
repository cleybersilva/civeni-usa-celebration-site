-- Conceder permissões de SELECT e INSERT nos buckets para todos os roles
GRANT SELECT ON storage.buckets TO anon, authenticated, public;

-- Conceder permissões completas em storage.objects para todos os roles
GRANT ALL ON storage.objects TO anon, authenticated, public;