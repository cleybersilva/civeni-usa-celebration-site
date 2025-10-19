-- Criar enum de status para transmissões
DO $$ BEGIN
  CREATE TYPE transmission_status AS ENUM ('scheduled', 'live', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela principal de transmissões
CREATE TABLE IF NOT EXISTS transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL DEFAULT 'transmissao-ao-vivo',
  title JSONB NOT NULL DEFAULT '{"pt":"","en":"","es":"","tr":""}'::jsonb,
  subtitle JSONB DEFAULT '{"pt":"","en":"","es":"","tr":""}'::jsonb,
  description JSONB DEFAULT '{"pt":"","en":"","es":"","tr":""}'::jsonb,
  status transmission_status NOT NULL DEFAULT 'scheduled',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  youtube_video_id TEXT,
  channel_handle TEXT DEFAULT '@CiveniUSA2025',
  badge_label JSONB DEFAULT '{"pt":"","en":"","es":"","tr":""}'::jsonb,
  banner_from TEXT DEFAULT '#7928CA',
  banner_to TEXT DEFAULT '#FF0080',
  faq_url TEXT,
  schedule_url TEXT,
  rooms_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de salas de transmissão
CREATE TABLE IF NOT EXISTS transmission_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transmission_id UUID REFERENCES transmissions(id) ON DELETE CASCADE,
  name JSONB NOT NULL DEFAULT '{"pt":"","en":"","es":"","tr":""}'::jsonb,
  meet_url TEXT NOT NULL,
  is_live BOOLEAN DEFAULT false,
  ord INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- View para próximas transmissões
CREATE OR REPLACE VIEW transmissions_upcoming AS
SELECT *
FROM transmissions
WHERE status IN ('scheduled')
  AND is_public = true
ORDER BY COALESCE(start_at, now()) ASC
LIMIT 6;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_transmissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_transmissions_timestamp
BEFORE UPDATE ON transmissions
FOR EACH ROW
EXECUTE FUNCTION update_transmissions_updated_at();

CREATE TRIGGER update_transmission_rooms_timestamp
BEFORE UPDATE ON transmission_rooms
FOR EACH ROW
EXECUTE FUNCTION update_transmissions_updated_at();

-- RLS Policies para transmissions
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transmissions_public_read"
ON transmissions FOR SELECT
USING (is_public = true);

CREATE POLICY "transmissions_admin_all"
ON transmissions FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- RLS Policies para transmission_rooms
ALTER TABLE transmission_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transmission_rooms_public_read"
ON transmission_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM transmissions t
    WHERE t.id = transmission_rooms.transmission_id
    AND t.is_public = true
  )
);

CREATE POLICY "transmission_rooms_admin_all"
ON transmission_rooms FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Inserir seed inicial
INSERT INTO transmissions (slug, title, subtitle, description, status, start_at, timezone, channel_handle, badge_label, schedule_url, rooms_url, faq_url)
VALUES (
  'transmissao-ao-vivo',
  '{"pt":"Transmissão ao vivo","en":"Live Stream","es":"Transmisión en vivo","tr":"Canlı Yayın"}'::jsonb,
  '{"pt":"Direto da Florida","en":"Live from Florida","es":"En directo desde Florida","tr":"Florida''dan canlı"}'::jsonb,
  '{"pt":"Acompanhe ao vivo todas as sessões do III CIVENI 2025.","en":"Follow all sessions of III CIVENI 2025 live.","es":"Siga todas las sesiones del III CIVENI 2025 en vivo.","tr":"III CIVENI 2025''in tüm oturumlarını canlı takip edin."}'::jsonb,
  'scheduled',
  '2025-12-11T17:30:00-05:00'::timestamptz,
  'America/New_York',
  '@CiveniUSA2025',
  '{"pt":"Voltamos em instantes","en":"Be right back","es":"Volvemos en breve","tr":"Hemen döneceğiz"}'::jsonb,
  '/programacao-online',
  '/programacao-online#salas',
  '#faq'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  updated_at = now();