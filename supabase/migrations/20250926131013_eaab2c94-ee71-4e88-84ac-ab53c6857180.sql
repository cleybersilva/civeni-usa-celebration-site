-- 1) Criar tipo enumerado (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_kind') THEN
    CREATE TYPE submission_kind AS ENUM ('artigo', 'consorcio');
  END IF;
END$$;

-- 2) Adicionar coluna (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='work_submissions' AND column_name='submission_kind'
  ) THEN
    ALTER TABLE public.work_submissions
      ADD COLUMN submission_kind submission_kind NOT NULL DEFAULT 'artigo';
  END IF;
END$$;

-- 3) Índice para consultas/admin
CREATE INDEX IF NOT EXISTS idx_work_submissions_kind ON public.work_submissions (submission_kind);