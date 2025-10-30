-- Tornar o bucket civeni-submissoes público para permitir acesso via signed URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'civeni-submissoes';