-- Fix the type casting issue for civeni_session_type
-- Create CIVENI Online Program data with proper type casting

-- Insert online program settings
INSERT INTO civeni_program_settings (id, page_title, page_subtitle, show_add_to_calendar, show_download_pdf)
VALUES (2, 'Programação Online', 'Confira toda a programação online do III CIVENI 2025', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert online program days with normalized dates
INSERT INTO civeni_program_days (
  event_slug, date, weekday_label, headline, theme, modality, sort_order, is_published, 
  seo_title, seo_description
) VALUES 
(
  'iii-civeni-2025-online', 
  '2025-12-11', 
  'Quinta-feira', 
  'Abertura e Conferência', 
  'Horizontes Globais para a Educação e Justiça Social',
  'online'::civeni_modality,
  1, 
  true,
  'Programação Online - Dia 1 - III CIVENI 2025',
  'Abertura oficial e conferências internacionais do III CIVENI 2025'
),
(
  'iii-civeni-2025-online', 
  '2025-12-12', 
  'Sexta-feira', 
  'Sessões Temáticas e Painéis', 
  'Saberes Interdisciplinares e Práticas Transformadoras',
  'online'::civeni_modality,
  2, 
  true,
  'Programação Online - Dia 2 - III CIVENI 2025',
  'Palestras, sessões simultâneas e apresentações de trabalhos'
),
(
  'iii-civeni-2025-online', 
  '2025-12-13', 
  'Sábado', 
  'Diálogos, Mostra e Encerramento', 
  'Pesquisa, Cooperação e Impacto Social',
  'online'::civeni_modality,
  3, 
  true,
  'Programação Online - Dia 3 - III CIVENI 2025',
  'Mesa-redonda, workshops e cerimônia de encerramento'
);

-- Get the day IDs for inserting sessions
-- Day 1 Sessions (2025-12-11)
WITH day_ids AS (
  SELECT id, date FROM civeni_program_days 
  WHERE event_slug = 'iii-civeni-2025-online'
  ORDER BY sort_order
)
INSERT INTO civeni_program_sessions (
  day_id, start_at, end_at, session_type, title, description, modality, 
  order_in_day, is_published, is_featured, room
)
SELECT 
  d.id,
  '2025-12-11 14:00:00-03'::timestamptz,
  '2025-12-11 14:30:00-03'::timestamptz,
  'credenciamento'::civeni_session_type,
  'Credenciamento Online e teste de conexão',
  'Verificação de acesso e configuração de dispositivos para participação online',
  'online'::civeni_modality,
  1,
  true,
  false,
  'Plataforma Digital'
FROM day_ids d WHERE d.date = '2025-12-11'

UNION ALL

SELECT 
  d.id,
  '2025-12-11 14:30:00-03'::timestamptz,
  '2025-12-11 15:30:00-03'::timestamptz,
  'abertura'::civeni_session_type,
  'Cerimônia de Abertura Oficial',
  'Mensagens institucionais e boas-vindas da Reitoria',
  'online'::civeni_modality,
  2,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-11'

UNION ALL

SELECT 
  d.id,
  '2025-12-11 15:30:00-03'::timestamptz,
  '2025-12-11 16:30:00-03'::timestamptz,
  'conferencia'::civeni_session_type,
  'Conferência Magna Internacional',
  'Profa. Dra. Esra Sipahi Döngül — Istanbul Gelisim University (Department of Business Administration)',
  'online'::civeni_modality,
  3,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-11'

UNION ALL

SELECT 
  d.id,
  '2025-12-11 16:30:00-03'::timestamptz,
  '2025-12-11 17:30:00-03'::timestamptz,
  'conferencia'::civeni_session_type,
  'Conferência Internacional: Educação na Era Digital',
  'Prof. Dr. Luis Miguel — Fronteiras da Capacitação e da Literacia em IA',
  'online'::civeni_modality,
  4,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-11'

UNION ALL

SELECT 
  d.id,
  '2025-12-11 17:30:00-03'::timestamptz,
  '2025-12-11 18:30:00-03'::timestamptz,
  'conferencia'::civeni_session_type,
  'Conferência Internacional: Educação e Justiça Social',
  'Prof. Dr. Walter Priesnitz Filho',
  'online'::civeni_modality,
  5,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-11'

UNION ALL

SELECT 
  d.id,
  '2025-12-11 18:30:00-03'::timestamptz,
  '2025-12-11 19:00:00-03'::timestamptz,
  'encerramento'::civeni_session_type,
  'Encerramento do Primeiro Dia',
  'Considerações finais e programação do próximo dia',
  'online'::civeni_modality,
  6,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-11';