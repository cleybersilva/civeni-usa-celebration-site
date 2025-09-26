-- 1) Template dos certificados
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT CHECK (brand IN ('VCCU','CIVENI')) DEFAULT 'VCCU',
  is_active BOOLEAN DEFAULT true,
  paper_size TEXT DEFAULT 'A4',
  orientation TEXT DEFAULT 'landscape',
  base_colors JSONB,
  logo_url TEXT,
  background_url TEXT,
  watermark_url TEXT,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Config por evento
CREATE TABLE event_certificates (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  required_correct INTEGER DEFAULT 4,
  keywords TEXT[] NOT NULL CHECK (array_length(keywords,1) = 5),
  template_id UUID REFERENCES certificate_templates(id),
  issuer_name TEXT,
  issuer_role TEXT,
  issuer_signature_url TEXT,
  hours TEXT,
  city TEXT,
  country TEXT,
  issue_rule TEXT CHECK (issue_rule IN ('immediate','on_event_end')) DEFAULT 'on_event_end',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Emissões
CREATE TABLE issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES event_registrations(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (char_length(full_name) <= 50),
  code TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT NOT NULL,
  keywords_matched INTEGER NOT NULL,
  keywords_provided TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Tentativas (rate-limit / auditoria)
CREATE TABLE certificate_attempts (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  email TEXT NOT NULL,
  ip INET,
  matched INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- certificate_templates: somente admin
CREATE POLICY "certificate_templates_admin_all" ON certificate_templates
FOR ALL USING (is_current_user_admin());

-- event_certificates: somente admin
CREATE POLICY "event_certificates_admin_all" ON event_certificates
FOR ALL USING (is_current_user_admin());

-- issued_certificates: leitura pelo dono (via email) e por admin
CREATE POLICY "issued_certificates_admin_all" ON issued_certificates
FOR ALL USING (is_current_user_admin());

CREATE POLICY "issued_certificates_public_read_own" ON issued_certificates
FOR SELECT USING (email = current_setting('request.headers', true)::json->>'x-user-email');

-- certificate_attempts: somente admin
CREATE POLICY "certificate_attempts_admin_only" ON certificate_attempts
FOR ALL USING (is_current_user_admin());

-- Indexes para performance
CREATE INDEX idx_issued_certificates_email ON issued_certificates(email);
CREATE INDEX idx_issued_certificates_code ON issued_certificates(code);
CREATE INDEX idx_issued_certificates_event_id ON issued_certificates(event_id);
CREATE INDEX idx_certificate_attempts_email_created ON certificate_attempts(email, created_at);

-- Template padrão
INSERT INTO certificate_templates (
  name,
  brand,
  body_html,
  base_colors
) VALUES (
  'Template Padrão VCCU',
  'VCCU',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 landscape; margin: 18mm; }
    body { font-family: "Arial", sans-serif; margin: 0; padding: 0; }
    .certificate { width: 100%; height: 100vh; position: relative; }
    .header { text-align: center; border-bottom: 3px solid {{primary_color}}; padding: 20px 0; }
    .logo { height: 80px; margin-bottom: 10px; }
    .title { font-size: 24px; color: {{primary_color}}; font-weight: bold; }
    .content { text-align: center; padding: 60px 40px; }
    .name { font-size: 48px; font-weight: 700; color: {{text_color}}; margin: 30px 0; }
    .text { font-size: 18px; line-height: 1.6; color: {{text_color}}; margin: 20px 0; }
    .footer { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: end; padding: 20px; }
    .signature { text-align: center; }
    .signature img { height: 60px; margin-bottom: 10px; }
    .qr-section { text-align: center; }
    .qr-code { width: 80px; height: 80px; margin-bottom: 5px; }
    .code { font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <img src="{{logo_url}}" alt="Logo" class="logo">
      <div class="title">{{event_title}}</div>
    </div>
    
    <div class="content">
      <div class="text">Certificamos que</div>
      <div class="name">{{full_name}}</div>
      <div class="text">
        participou do {{event_title}}<br>
        com carga horária de {{hours}}<br>
        realizado em {{city}}/{{country}} em {{issue_date}}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature">
        <img src="{{issuer_signature_url}}" alt="Assinatura">
        <div>{{issuer_name}}</div>
        <div style="font-size: 14px;">{{issuer_role}}</div>
      </div>
      <div class="qr-section">
        <img src="{{qr_url}}" alt="QR Code" class="qr-code">
        <div class="code">{{code}}</div>
      </div>
    </div>
  </div>
</body>
</html>',
  '{"primary": "#1F3A5F", "secondary": "#B22234", "text": "#1A1A1A", "background": "#FFFFFF"}'::jsonb
);