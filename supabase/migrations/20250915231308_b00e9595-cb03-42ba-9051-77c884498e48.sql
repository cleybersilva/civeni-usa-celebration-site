-- Inserir configurações padrão
INSERT INTO civeni_program_settings (page_title, page_subtitle) 
VALUES ('Programação Presencial', 'Confira toda a programação presencial do III CIVENI 2025')
ON CONFLICT (id) DO NOTHING;

-- Inserir os dias da programação
WITH days_data AS (
  INSERT INTO civeni_program_days (date, weekday_label, headline, theme, sort_order, is_published)
  VALUES
    ('2025-12-11', 'Quinta-feira', 'Abertura e Conferência', 'Horizontes Globais para a Educação e Justiça Social', 1, true),
    ('2025-12-12', 'Sexta-feira', 'Sessões Temáticas e Painéis', 'Saberes Interdisciplinares e Práticas Transformadoras', 2, true),
    ('2025-12-13', 'Sábado', 'Diálogos, Mostra e Encerramento', 'Pesquisa, Cooperação e Impacto Social', 3, true)
  RETURNING id, date
)
-- Inserir sessões do Dia 1 (11/12/2025)
INSERT INTO civeni_program_sessions (day_id, start_at, session_type, title, description, modality, order_in_day, is_published)
SELECT 
  d.id, 
  sessions.start_at::timestamptz, 
  sessions.session_type::civeni_session_type, 
  sessions.title, 
  sessions.description, 
  sessions.modality::civeni_modality, 
  sessions.order_in_day, 
  sessions.is_published
FROM days_data d
CROSS JOIN (
  VALUES
    ('2025-12-11 14:00:00-03', 'credenciamento', 'Credenciamento presencial e teste de conexão (online)', null, 'hibrido', 1, true),
    ('2025-12-11 14:30:00-03', 'abertura', 'Cerimônia de Abertura oficial', 'Mensagens institucionais e boas-vindas da Reitoria', 'hibrido', 2, true),
    ('2025-12-11 15:30:00-03', 'conferencia', 'Conferência Magna Internacional', 'Profa. Dra. Esra Sipahi Döngül — Istanbul Gelisim University (Department of Business Administration)', 'hibrido', 3, true),
    ('2025-12-11 16:30:00-03', 'conferencia', 'Conferência Internacional', 'Prof. Dr. Luis Miguel — Educação na Era Digital: fronteiras da Capacitação e da Literacia em IA', 'hibrido', 4, true),
    ('2025-12-11 17:30:00-03', 'conferencia', 'Conferência Internacional: Educação e Justiça Social', 'Prof. Dr. Walter Priesnitz Filho', 'hibrido', 5, true),
    ('2025-12-11 18:30:00-03', 'encerramento', 'Encerramento do primeiro dia', null, 'hibrido', 6, true)
) AS sessions(start_at, session_type, title, description, modality, order_in_day, is_published)
WHERE d.date = '2025-12-11';

-- Inserir sessões do Dia 2 (12/12/2025)
WITH day2 AS (
  SELECT id FROM civeni_program_days WHERE date = '2025-12-12'
)
INSERT INTO civeni_program_sessions (day_id, start_at, session_type, title, description, modality, is_parallel, order_in_day, is_published)
SELECT 
  d.id, 
  sessions.start_at::timestamptz, 
  sessions.session_type::civeni_session_type, 
  sessions.title, 
  sessions.description, 
  sessions.modality::civeni_modality,
  sessions.is_parallel,
  sessions.order_in_day, 
  sessions.is_published
FROM day2 d
CROSS JOIN (
  VALUES
    ('2025-12-12 09:00:00-03', 'palestra', 'Palestra 1 — Espiritualidade, Saúde Mental e Bem-Estar nas Organizações', 'Profa. Dra. Silvana Guedes — Universidade de Caxias do Sul', 'hibrido', false, 1, true),
    ('2025-12-12 10:30:00-03', 'sessoes_simultaneas', 'Sessões simultâneas: Apresentação de trabalhos', 'Salas Temáticas', 'hibrido', true, 2, true),
    ('2025-12-12 12:30:00-03', 'intervalo', 'Intervalo para almoço', null, 'presencial', false, 3, true),
    ('2025-12-12 14:00:00-03', 'palestra', 'Palestra 2 — Inovação, Direito e Sustentabilidade no Século XXI', 'Profa. Dra. Maria Emilia Camargo', 'hibrido', false, 4, true),
    ('2025-12-12 15:30:00-03', 'sessoes_simultaneas', 'Sessões simultâneas: Apresentações orais e vídeos de trabalhos', null, 'hibrido', true, 5, true),
    ('2025-12-12 17:30:00-03', 'conferencia', 'Conferência de Encerramento do Dia — Humanos e Algoritmos: A Parceria Estratégica na Gestão de Pessoas', 'Prof. Ms Adriano Abreu', 'hibrido', false, 6, true),
    ('2025-12-12 18:30:00-03', 'intervalo', 'Coffee e networking (híbrido)', 'Ambiente informal de interação entre participantes', 'hibrido', false, 7, true)
) AS sessions(start_at, session_type, title, description, modality, is_parallel, order_in_day, is_published);

-- Inserir sessões do Dia 3 (13/12/2025)
WITH day3 AS (
  SELECT id FROM civeni_program_days WHERE date = '2025-12-13'
)
INSERT INTO civeni_program_sessions (day_id, start_at, session_type, title, description, modality, order_in_day, is_published)
SELECT 
  d.id, 
  sessions.start_at::timestamptz, 
  sessions.session_type::civeni_session_type, 
  sessions.title, 
  sessions.description, 
  sessions.modality::civeni_modality, 
  sessions.order_in_day, 
  sessions.is_published
FROM day3 d
CROSS JOIN (
  VALUES
    ('2025-12-13 09:00:00-03', 'mesa_redonda', 'Mesa-redonda — Metodologias Emergentes e Pesquisa Multidisciplinar', null, 'hibrido', 1, true),
    ('2025-12-13 10:30:00-03', 'outro', 'Slot em definição', 'Conteúdo a definir no SaaS (placeholder para edição)', 'hibrido', 2, true),
    ('2025-12-13 12:00:00-03', 'outro', 'Apresentação de parcerias institucionais (Índia, EUA, Brasil)', null, 'hibrido', 3, true),
    ('2025-12-13 13:00:00-03', 'intervalo', 'Intervalo para almoço', null, 'presencial', 4, true),
    ('2025-12-13 14:30:00-03', 'workshop', 'Workshop interativo (híbrido) — Publicação Científica e Internacionalização', null, 'hibrido', 5, true),
    ('2025-12-13 15:30:00-03', 'outro', 'Slot em definição', 'Conteúdo a definir no SaaS (placeholder para edição)', 'hibrido', 6, true),
    ('2025-12-13 16:30:00-03', 'cerimonia', 'Consórcio Mestral e Doutoral + Entrega simbólica dos certificados III CIVENI', null, 'hibrido', 7, true),
    ('2025-12-13 17:00:00-03', 'encerramento', 'Cerimônia de Encerramento e Convite para o IV CIVENI', null, 'hibrido', 8, true)
) AS sessions(start_at, session_type, title, description, modality, order_in_day, is_published);