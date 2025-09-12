-- Seed data: Create initial event for CIVENI III 2025
INSERT INTO events (
  slug,
  inicio_at,
  fim_at,
  timezone,
  modalidade,
  endereco,
  banner_url,
  youtube_url,
  tem_inscricao,
  inscricao_url,
  featured,
  status_publicacao,
  created_by,
  updated_by
) VALUES (
  'civeni-iii-2025',
  '2025-09-01 08:00:00-03'::timestamptz,
  '2025-09-01 18:00:00-03'::timestamptz,
  'America/Sao_Paulo',
  'hibrido',
  'Celebration, FL 34747 - EUA',
  NULL,
  'https://youtube.com/watch?v=example',
  true,
  '/inscricoes',
  true,
  'published',
  'system',
  'system'
);

-- Add translation for the event
INSERT INTO event_translations (
  event_id,
  idioma,
  titulo,
  subtitulo,
  descricao_richtext,
  meta_title,
  meta_description
) VALUES (
  (SELECT id FROM events WHERE slug = 'civeni-iii-2025'),
  'pt-BR',
  'III CIVENI USA 2025',
  'Congresso Internacional Multidisciplinar',
  '<p>O III Congresso Internacional Virtual de Ensino, Inovação e Multidisciplinaridade (III CIVENI USA 2025) representa um marco na evolução acadêmica internacional.</p>',
  'III CIVENI USA 2025 - Congresso Internacional Multidisciplinar',
  'Participe do III CIVENI USA 2025, o maior congresso internacional multidisciplinar de ensino e inovação.'
);