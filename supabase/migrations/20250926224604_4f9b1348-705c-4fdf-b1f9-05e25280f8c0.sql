-- Inserir configuração básica para certificados do evento principal
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

-- Se não existir o evento, criar um evento padrão
INSERT INTO events (
  slug,
  inicio_at,
  fim_at,
  modalidade,
  endereco,
  status_publicacao,
  created_by,
  updated_by
)
SELECT 
  'iii-civeni-2025',
  '2025-03-15 08:00:00-03',
  '2025-03-17 18:00:00-03',
  'hibrido',
  'Fortaleza, CE - Brasil',
  'published',
  'system',
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM events WHERE slug = 'iii-civeni-2025'
);

-- Inserir configuração para o evento criado (se não existia)
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