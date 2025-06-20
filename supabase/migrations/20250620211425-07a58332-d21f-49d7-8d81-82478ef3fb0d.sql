
-- Verificar se a tabela partners existe, se não existir, criar ela
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('organizer', 'academic', 'sponsor')),
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir exemplos de patrocinadores na tabela partners
INSERT INTO partners (name, logo, type, sort_order) VALUES 
('Microsoft', '🏢', 'sponsor', 1),
('Google', '🌐', 'sponsor', 2);
