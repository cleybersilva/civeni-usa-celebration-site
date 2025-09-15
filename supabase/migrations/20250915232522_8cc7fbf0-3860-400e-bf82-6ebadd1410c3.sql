-- Continue with Day 2 and Day 3 sessions for online program

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
  'palestra'::civeni_session_type,
  'Espiritualidade, Saúde Mental e Bem-Estar nas Organizações',
  'Profa. Dra. Silvana Guedes — Universidade de Caxias do Sul',
  'online'::civeni_modality,
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
  'sessoes_simultaneas'::civeni_session_type,
  'Sessões Simultâneas: Apresentação de Trabalhos',
  'Salas temáticas com apresentações de pesquisas e estudos',
  'online'::civeni_modality,
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
  'intervalo'::civeni_session_type,
  'Intervalo para Almoço',
  'Pausa para refeição e networking informal',
  'online'::civeni_modality,
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
  'palestra'::civeni_session_type,
  'Inovação, Direito e Sustentabilidade no Século XXI',
  'Profa. Dra. Maria Emilia Camargo',
  'online'::civeni_modality,
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
  'sessoes_simultaneas'::civeni_session_type,
  'Sessões Simultâneas: Apresentações Orais e Vídeos',
  'Apresentações de trabalhos em formato oral e audiovisual',
  'online'::civeni_modality,
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
  'conferencia'::civeni_session_type,
  'Humanos e Algoritmos: A Parceria Estratégica na Gestão de Pessoas',
  'Prof. Ms Adriano Abreu — Conferência de Encerramento do Dia',
  'online'::civeni_modality,
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
  'intervalo'::civeni_session_type,
  'Coffee e Networking Virtual',
  'Ambiente informal de interação entre participantes online',
  'online'::civeni_modality,
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
  'mesa_redonda'::civeni_session_type,
  'Mesa-redonda: Metodologias Emergentes e Pesquisa Multidisciplinar',
  'Discussão sobre novas abordagens metodológicas na pesquisa contemporânea',
  'online'::civeni_modality,
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
  'outro'::civeni_session_type,
  'Slot em Definição',
  'Conteúdo a ser definido pela organização - editável via painel administrativo',
  'online'::civeni_modality,
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
  'outro'::civeni_session_type,
  'Apresentação de Parcerias Institucionais',
  'Colaborações internacionais: Índia, EUA e Brasil',
  'online'::civeni_modality,
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
  'intervalo'::civeni_session_type,
  'Intervalo para Almoço',
  'Pausa para refeição',
  'online'::civeni_modality,
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
  'workshop'::civeni_session_type,
  'Workshop: Publicação Científica e Internacionalização',
  'Oficina interativa sobre estratégias de publicação e cooperação internacional',
  'online'::civeni_modality,
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
  'outro'::civeni_session_type,
  'Slot em Definição',
  'Conteúdo a ser definido pela organização - editável via painel administrativo',
  'online'::civeni_modality,
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
  'cerimonia'::civeni_session_type,
  'Consórcio Mestral e Doutoral + Entrega de Certificados',
  'Apresentação do consórcio e entrega simbólica dos certificados III CIVENI',
  'online'::civeni_modality,
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
  'encerramento'::civeni_session_type,
  'Cerimônia de Encerramento e Convite para o IV CIVENI',
  'Encerramento oficial e divulgação da próxima edição',
  'online'::civeni_modality,
  8,
  true,
  true,
  'Auditório Virtual Principal'
FROM day_ids d WHERE d.date = '2025-12-13';