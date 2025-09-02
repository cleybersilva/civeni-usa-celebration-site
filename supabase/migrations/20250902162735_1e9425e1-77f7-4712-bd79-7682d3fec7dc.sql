-- CMS Tables for Congresso refactoring
-- Create CMS pages table
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  title TEXT NOT NULL,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  content_md TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, locale)
);

-- Create CMS committees table
CREATE TABLE IF NOT EXISTS cms_committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, locale)
);

-- Create CMS committee members table
CREATE TABLE IF NOT EXISTS cms_committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID REFERENCES cms_committees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  affiliation TEXT,
  photo_url TEXT,
  email TEXT,
  lattes_url TEXT,
  linkedin_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug_locale ON cms_pages(slug, locale);
CREATE INDEX IF NOT EXISTS idx_cms_committees_locale ON cms_committees(locale);
CREATE INDEX IF NOT EXISTS idx_cms_committee_members_committee ON cms_committee_members(committee_id, locale);

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_committee_members ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "cms_pages_public_read" ON cms_pages
FOR SELECT USING (status = 'published');

CREATE POLICY "cms_committees_public_read" ON cms_committees
FOR SELECT USING (true);

CREATE POLICY "cms_committee_members_public_read" ON cms_committee_members
FOR SELECT USING (visible = true);

-- Admin write policies
CREATE POLICY "cms_pages_admin_all" ON cms_pages
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "cms_committees_admin_all" ON cms_committees
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "cms_committee_members_admin_all" ON cms_committee_members
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Insert initial data for Apresentação page
INSERT INTO cms_pages (slug, locale, title, hero_title, hero_subtitle, content_md, status)
VALUES (
  'congresso/apresentacao',
  'pt-BR',
  'Apresentação',
  'III CIVENI 2025',
  'Congresso Internacional Multidisciplinar da VCCU',
  '# III CIVENI - Congresso Internacional Multidisciplinar da VCCU

**TEMA:** *Saberes em Conexão: Inovação, Justiça e Humanidade na Sociedade Contemporânea*

No contexto da sociedade contemporânea, marcada por crises globais, desigualdades persistentes e transformações tecnológicas aceleradas, torna-se urgente repensar os modos de produção e circulação do conhecimento. A articulação entre saberes diversos e conectados — científicos, éticos, culturais e espirituais — revela-se fundamental para promover soluções inovadoras que estejam alinhadas não apenas à eficiência, mas à justiça social e ao cuidado com a dignidade humana.

Sob esse horizonte, a inovação não pode ser compreendida apenas como avanço técnico, mas como prática situada e comprometida com o bem comum. Unir inovação, justiça e humanidade significa construir pontes entre disciplinas, setores e povos, em busca de uma sociedade mais inclusiva, sensível às diferenças e orientada por valores que transcendam o utilitarismo e a exclusão.',
  'published'
)
ON CONFLICT (slug, locale) DO UPDATE SET
  title = EXCLUDED.title,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  content_md = EXCLUDED.content_md,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert sample committees
INSERT INTO cms_committees (slug, name, locale, sort_order) VALUES
('organizador', 'Comitê Organizador', 'pt-BR', 1),
('cientifico', 'Comitê Científico', 'pt-BR', 2),
('avaliacao', 'Comissão de Avaliação', 'pt-BR', 3),
('apoio-tecnico', 'Comissão de Apoio Técnico', 'pt-BR', 4)
ON CONFLICT (slug, locale) DO NOTHING;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_cms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();

CREATE TRIGGER update_cms_committees_updated_at
  BEFORE UPDATE ON cms_committees
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();

CREATE TRIGGER update_cms_committee_members_updated_at
  BEFORE UPDATE ON cms_committee_members
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();