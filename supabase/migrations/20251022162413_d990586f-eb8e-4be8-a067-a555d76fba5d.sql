-- Permitir que usuários anônimos leiam informações do bucket work-submissions
CREATE POLICY "work_submissions_bucket_anon_select"
ON storage.buckets
FOR SELECT
TO anon
USING (id = 'work-submissions');

-- Verificar que a política foi criada
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'buckets'
    AND policyname = 'work_submissions_bucket_anon_select'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    RAISE EXCEPTION 'Política não foi criada';
  END IF;
  
  RAISE NOTICE 'Política criada com sucesso em storage.buckets';
END $$;