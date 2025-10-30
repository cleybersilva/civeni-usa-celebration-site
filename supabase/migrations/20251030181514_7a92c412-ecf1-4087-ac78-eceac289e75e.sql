-- 1) Tabela principal de submissões
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('artigo', 'consorcio')),
  titulo TEXT NOT NULL,
  resumo TEXT,
  area_tematica TEXT,
  palavras_chave TEXT[],
  autor_principal TEXT NOT NULL,
  autores JSONB,
  email TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  instituicao TEXT,
  arquivo_path TEXT NOT NULL,
  arquivo_mime TEXT NOT NULL,
  arquivo_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'em_analise', 'validado', 'invalidado', 'arquivado')),
  status_motivo TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON public.submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_tipo ON public.submissions(tipo);

-- 2) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_submissions_updated
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Tabela de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor UUID REFERENCES auth.users(id),
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_row_id ON public.audit_logs(row_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4) Função de auditoria
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  payload JSONB;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    payload = to_jsonb(NEW);
    INSERT INTO public.audit_logs(table_name, row_id, action, actor, diff)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert', auth.uid(), payload);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    payload = jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    INSERT INTO public.audit_logs(table_name, row_id, action, actor, diff)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', auth.uid(), payload);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    payload = to_jsonb(OLD);
    INSERT INTO public.audit_logs(table_name, row_id, action, actor, diff)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', auth.uid(), payload);
    RETURN OLD;
  END IF;
END;
$$;

-- Triggers de auditoria
CREATE TRIGGER trg_submissions_audit_ins
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER trg_submissions_audit_upd
AFTER UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER trg_submissions_audit_del
AFTER DELETE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- 5) Habilitar RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6) Políticas RLS para submissions
CREATE POLICY "insert_via_service_role" ON public.submissions
FOR INSERT WITH CHECK (true);

CREATE POLICY "read_submissions_admin" ON public.submissions
FOR SELECT USING (is_current_user_admin());

CREATE POLICY "update_submissions_admin" ON public.submissions
FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "no_delete_direct" ON public.submissions
FOR DELETE USING (false);

-- 7) Políticas RLS para audit_logs
CREATE POLICY "read_audit_admin" ON public.audit_logs
FOR SELECT USING (is_current_user_admin());

CREATE POLICY "no_update_audit" ON public.audit_logs
FOR UPDATE USING (false);

CREATE POLICY "no_delete_audit" ON public.audit_logs
FOR DELETE USING (false);

-- 8) Habilitar Realtime
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;