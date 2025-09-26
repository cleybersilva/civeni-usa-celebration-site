-- Verificar se a tabela event_certificates existe, se não, criar
CREATE TABLE IF NOT EXISTS event_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  required_correct INTEGER DEFAULT 4,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  issuer_name TEXT DEFAULT 'Coordenador Acadêmico',
  issuer_role TEXT DEFAULT 'Coordenador',
  hours TEXT DEFAULT '40h',
  city TEXT DEFAULT 'Fortaleza',
  country TEXT DEFAULT 'Brasil',
  certificate_template_url TEXT,
  background_image_url TEXT,
  logo_url TEXT,
  signature_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id)
);

-- Criar tabela para certificados emitidos se não existir
CREATE TABLE IF NOT EXISTS issued_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  keywords_matched INTEGER DEFAULT 0,
  keywords_provided TEXT[] DEFAULT ARRAY[]::TEXT[],
  issued_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_event_certificates_event_id ON event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_event_id ON issued_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_email ON issued_certificates(email);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_code ON issued_certificates(code);

-- RLS Policies
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para event_certificates
DROP POLICY IF EXISTS "event_certificates_admin_all" ON event_certificates;
CREATE POLICY "event_certificates_admin_all" ON event_certificates
  FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "event_certificates_public_read" ON event_certificates;
CREATE POLICY "event_certificates_public_read" ON event_certificates
  FOR SELECT USING (is_enabled = true);

-- Políticas para issued_certificates
DROP POLICY IF EXISTS "issued_certificates_admin_all" ON issued_certificates;
CREATE POLICY "issued_certificates_admin_all" ON issued_certificates
  FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "issued_certificates_public_read_code" ON issued_certificates;
CREATE POLICY "issued_certificates_public_read_code" ON issued_certificates
  FOR SELECT USING (true); -- Permite verificação pública por código

-- Inserir configuração para o evento padrão se não existir
INSERT INTO event_certificates (
  event_id, 
  is_enabled,
  required_correct,
  keywords,
  issuer_name,
  issuer_role,
  hours,
  city,
  country
) 
SELECT 
  id,
  true as is_enabled,
  4 as required_correct,
  ARRAY['civeni', 'internacional', 'multidisciplinar', 'congresso', 'conhecimento'] as keywords,
  'Dr. Coordenador Acadêmico' as issuer_name,
  'Coordenador do III CIVENI 2025' as issuer_role,
  '40h' as hours,
  'Fortaleza' as city,
  'Brasil' as country
FROM events 
WHERE slug = 'iii-civeni-2025'
AND NOT EXISTS (
  SELECT 1 FROM event_certificates 
  WHERE event_certificates.event_id = events.id
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_event_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_certificates_updated_at_trigger ON event_certificates;
CREATE TRIGGER update_event_certificates_updated_at_trigger
  BEFORE UPDATE ON event_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_event_certificates_updated_at();