-- Create CIVENI Online Program tables with proper structure and data

-- First, let's update the existing civeni_modality enum to include 'online'
ALTER TYPE civeni_modality ADD VALUE IF NOT EXISTS 'online';

-- Update civeni_program_days to support online events
UPDATE civeni_program_days 
SET modality = 'online' 
WHERE event_slug = 'iii-civeni-2025';

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
  'online',
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
  'online',
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
  'online',
  3, 
  true,
  'Programação Online - Dia 3 - III CIVENI 2025',
  'Mesa-redonda, workshops e cerimônia de encerramento'
);

-- Get the day IDs for inserting sessions
-- We'll need to insert sessions with proper day_id references
WITH day_ids AS (
  SELECT id, date FROM civeni_program_days 
  WHERE event_slug = 'iii-civeni-2025-online'
  ORDER BY sort_order
)
-- Day 1 Sessions (2025-12-11)
INSERT INTO civeni_program_sessions (
  day_id, start_at, end_at, session_type, title, description, modality, 
  order_in_day, is_published, is_featured, room
)
SELECT 
  d.id,
  '2025-12-11 14:00:00-03'::timestamptz,
  '2025-12-11 14:30:00-03'::timestamptz,
  'credenciamento',
  'Credenciamento Online e teste de conexão',
  'Verificação de acesso e configuração de dispositivos para participação online',
  'online',
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
  'abertura',
  'Cerimônia de Abertura Oficial',
  'Mensagens institucionais e boas-vindas da Reitoria',
  'online',
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
  'conferencia',
  'Conferência Magna Internacional',
  'Profa. Dra. Esra Sipahi Döngül — Istanbul Gelisim University (Department of Business Administration)',
  'online',
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
  'conferencia',
  'Conferência Internacional: Educação na Era Digital',
  'Prof. Dr. Luis Miguel — Fronteiras da Capacitação e da Literacia em IA',
  'online',
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
  'conferencia',
  'Conferência Internacional: Educação e Justiça Social',
  'Prof. Dr. Walter Priesnitz Filho',
  'online',
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
  'encerramento',
  'Encerramento do Primeiro Dia',
  'Considerações finais e programação do próximo dia',
  'online',
  6,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-11';

-- Day 2 Sessions (2025-12-12)
WITH day_ids AS (
  SELECT id, date FROM civeni_program_days 
  WHERE event_slug = 'iii-civeni-2025-online'
  ORDER BY sort_order
)
INSERT INTO civeni_program_sessions (
  day_id, start_at, end_at, session_type, title, description, modality, 
  order_in_day, is_published, is_featured, is_parallel, room
)
SELECT 
  d.id,
  '2025-12-12 09:00:00-03'::timestamptz,
  '2025-12-12 10:30:00-03'::timestamptz,
  'palestra',
  'Espiritualidade, Saúde Mental e Bem-Estar nas Organizações',
  'Profa. Dra. Silvana Guedes — Universidade de Caxias do Sul',
  'online',
  1,
  true,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-12'

UNION ALL

SELECT 
  d.id,
  '2025-12-12 10:30:00-03'::timestamptz,
  '2025-12-12 12:30:00-03'::timestamptz,
  'sessoes_simultaneas',
  'Sessões Simultâneas: Apresentação de Trabalhos',
  'Salas temáticas com apresentações de pesquisas e estudos',
  'online',
  2,
  true,
  false,
  true,
  'Salas Virtuais Temáticas'
FROM day_ids d WHERE d.date = '2025-12-12'

UNION ALL

SELECT 
  d.id,
  '2025-12-12 12:30:00-03'::timestamptz,
  '2025-12-12 14:00:00-03'::timestamptz,
  'intervalo',
  'Intervalo para Almoço',
  'Pausa para refeição e networking informal',
  'online',
  3,
  true,
  false,
  false,
  'Livre'
FROM day_ids d WHERE d.date = '2025-12-12'

UNION ALL

SELECT 
  d.id,
  '2025-12-12 14:00:00-03'::timestamptz,
  '2025-12-12 15:30:00-03'::timestamptz,
  'palestra',
  'Inovação, Direito e Sustentabilidade no Século XXI',
  'Profa. Dra. Maria Emilia Camargo',
  'online',
  4,
  true,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-12'

UNION ALL

SELECT 
  d.id,
  '2025-12-12 15:30:00-03'::timestamptz,
  '2025-12-12 17:30:00-03'::timestamptz,
  'sessoes_simultaneas',
  'Sessões Simultâneas: Apresentações Orais e Vídeos',
  'Apresentações de trabalhos em formato oral e audiovisual',
  'online',
  5,
  true,
  false,
  true,
  'Salas Virtuais Temáticas'
FROM day_ids d WHERE d.date = '2025-12-12'

UNION ALL

SELECT 
  d.id,
  '2025-12-12 17:30:00-03'::timestamptz,
  '2025-12-12 18:30:00-03'::timestamptz,
  'conferencia',
  'Humanos e Algoritmos: A Parceria Estratégica na Gestão de Pessoas',
  'Prof. Ms Adriano Abreu — Conferência de Encerramento do Dia',
  'online',
  6,
  true,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-12'

UNION ALL

SELECT 
  d.id,
  '2025-12-12 18:30:00-03'::timestamptz,
  '2025-12-12 19:30:00-03'::timestamptz,
  'intervalo',
  'Coffee e Networking Virtual',
  'Ambiente informal de interação entre participantes online',
  'online',
  7,
  true,
  false,
  false,
  'Salas de Breakout'
FROM day_ids d WHERE d.date = '2025-12-12';

-- Day 3 Sessions (2025-12-13)
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
  '2025-12-13 09:00:00-03'::timestamptz,
  '2025-12-13 10:30:00-03'::timestamptz,
  'mesa_redonda',
  'Mesa-redonda: Metodologias Emergentes e Pesquisa Multidisciplinar',
  'Discussão sobre novas abordagens metodológicas na pesquisa contemporânea',
  'online',
  1,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 10:30:00-03'::timestamptz,
  '2025-12-13 12:00:00-03'::timestamptz,
  'outro',
  'Slot em Definição',
  'Conteúdo a ser definido pela organização - editável via painel administrativo',
  'online',
  2,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 12:00:00-03'::timestamptz,
  '2025-12-13 13:00:00-03'::timestamptz,
  'outro',
  'Apresentação de Parcerias Institucionais',
  'Colaborações internacionais: Índia, EUA e Brasil',
  'online',
  3,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 13:00:00-03'::timestamptz,
  '2025-12-13 14:30:00-03'::timestamptz,
  'intervalo',
  'Intervalo para Almoço',
  'Pausa para refeição',
  'online',
  4,
  true,
  false,
  'Livre'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 14:30:00-03'::timestamptz,
  '2025-12-13 15:30:00-03'::timestamptz,
  'workshop',
  'Workshop: Publicação Científica e Internacionalização',
  'Oficina interativa sobre estratégias de publicação e cooperação internacional',
  'online',
  5,
  true,
  true,
  'Sala de Workshop Virtual'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 15:30:00-03'::timestamptz,
  '2025-12-13 16:30:00-03'::timestamptz,
  'outro',
  'Slot em Definição',
  'Conteúdo a ser definido pela organização - editável via painel administrativo',
  'online',
  6,
  true,
  false,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 16:30:00-03'::timestamptz,
  '2025-12-13 17:00:00-03'::timestamptz,
  'cerimonia',
  'Consórcio Mestral e Doutoral + Entrega de Certificados',
  'Apresentação do consórcio e entrega simbólica dos certificados III CIVENI',
  'online',
  7,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13'

UNION ALL

SELECT 
  d.id,
  '2025-12-13 17:00:00-03'::timestamptz,
  '2025-12-13 18:00:00-03'::timestamptz,
  'encerramento',
  'Cerimônia de Encerramento e Convite para o IV CIVENI',
  'Encerramento oficial e divulgação da próxima edição',
  'online',
  8,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13';