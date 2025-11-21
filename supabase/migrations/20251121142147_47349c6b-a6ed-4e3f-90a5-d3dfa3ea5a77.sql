-- Inserir dias da programação III CIVENI 2025
INSERT INTO civeni_program_days (date, weekday_label, headline, theme, event_slug, modality, location, sort_order, is_published)
VALUES 
  ('2025-12-11', 'Quinta-feira', 'Dia 1 - Abertura e Conferências', 'Credenciamento, Cerimônia de Abertura e Palestras Magistrais', 'iii-civeni-2025', 'hibrido', 'Fortaleza/CE', 1, true),
  ('2025-12-12', 'Sexta-feira', 'Dia 2 - Conferências Internacionais', 'Inovação, Educação e Transformação Social', 'iii-civeni-2025', 'hibrido', 'Fortaleza/CE', 2, true),
  ('2025-12-13', 'Sábado', 'Dia 3 - Mesa-redonda e Encerramento', 'Direitos Humanos, Apresentação de Trabalhos e Consórcios', 'iii-civeni-2025', 'hibrido', 'Fortaleza/CE', 3, true)
ON CONFLICT DO NOTHING;

-- Inserir sessões do Dia 1 (11/12/2025)
INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 14:00:00+00'::timestamptz, -- 09:00 EUA (EST = UTC-5)
  '2025-12-11 14:30:00+00'::timestamptz,
  'Credenciamento e Cerimônia de Abertura',
  '<p>Credenciamento presencial e teste de conexão para participantes online.</p><p><strong>Cerimônia de Abertura oficial</strong> – Mensagens institucionais e boas-vindas</p>',
  'abertura',
  'hibrido',
  1,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 14:30:00+00'::timestamptz,
  '2025-12-11 15:00:00+00'::timestamptz,
  'Dr. Chai Ching Tan',
  '<p>Palestra magistral</p>',
  'palestra',
  'hibrido',
  2,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 15:00:00+00'::timestamptz,
  '2025-12-11 15:30:00+00'::timestamptz,
  'Dr. Pankaj Srivastava',
  '<p>Palestra magistral</p>',
  'palestra',
  'hibrido',
  3,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 15:30:00+00'::timestamptz,
  '2025-12-11 16:00:00+00'::timestamptz,
  'Dr. Ramesh Chandra Rath',
  '<p>Palestra magistral</p>',
  'palestra',
  'hibrido',
  4,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 16:00:00+00'::timestamptz,
  '2025-12-11 16:30:00+00'::timestamptz,
  'Dr. Ampu Harikrishnan',
  '<p>Palestra magistral</p>',
  'palestra',
  'hibrido',
  5,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 16:30:00+00'::timestamptz,
  '2025-12-11 17:00:00+00'::timestamptz,
  'Convergence of career knowledge and career transition',
  '<p><strong>Dra. Dani Pividori Lopez</strong></p><p>Challenges and interdisciplinary strategies for professional development in the technological future of the United States.</p>',
  'palestra',
  'hibrido',
  6,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 17:00:00+00'::timestamptz,
  '2025-12-11 19:00:00+00'::timestamptz,
  'Intervalo',
  '<p>Pausa para almoço/descanso</p>',
  'intervalo',
  'hibrido',
  7,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 19:20:00+00'::timestamptz,
  '2025-12-11 19:40:00+00'::timestamptz,
  'Dra. Nataliia Vdovenko',
  '<p>Palestra magistral</p>',
  'palestra',
  'hibrido',
  8,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 21:00:00+00'::timestamptz,
  '2025-12-11 21:20:00+00'::timestamptz,
  'Dra. Nina Poyda-Nosyk',
  '<p>Palestra magistral</p>',
  'palestra',
  'hibrido',
  9,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 21:20:00+00'::timestamptz,
  '2025-12-11 21:40:00+00'::timestamptz,
  'Learning How to Learn',
  '<p><strong>Me. Aditi Basu Roy</strong></p><p>A Neurobiological Approach with practical test taking tips.</p>',
  'palestra',
  'hibrido',
  10,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 21:40:00+00'::timestamptz,
  '2025-12-11 22:00:00+00'::timestamptz,
  'Momento Cultural',
  '<p>Apresentação cultural</p>',
  'outro',
  'hibrido',
  11,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-11 22:00:00+00'::timestamptz,
  '2025-12-12 00:00:00+00'::timestamptz,
  'Painel de Propriedade Intelectual e Inovação',
  '<p><strong>Painelistas:</strong></p><ul><li>Dr. Aprígio Teles Mascarenhas Neto</li><li>Dra. Marina Bezerra</li><li>Me. Maria do Socorro Cruz Linhares</li><li>Me. Jaqueline Santos Vieira</li></ul>',
  'painel',
  'hibrido',
  12,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 00:00:00+00'::timestamptz,
  NULL,
  'Encerramento do Dia 1',
  '<p>Encerramento das atividades do primeiro dia</p>',
  'encerramento',
  'hibrido',
  13,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-11' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

-- Inserir sessões do Dia 2 (12/12/2025)
INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 14:00:00+00'::timestamptz,
  '2025-12-12 14:30:00+00'::timestamptz,
  'Conferência Internacional: Dra. Esra Sipahi Döngül',
  '<p><strong>Istanbul Gelisim University</strong> - Department of Business Administration</p>',
  'conferencia',
  'hibrido',
  1,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 14:30:00+00'::timestamptz,
  '2025-12-12 15:00:00+00'::timestamptz,
  'Espiritualidade, Saúde Mental e Bem-Estar nas Organizações',
  '<p><strong>Dra. Silvana Guedes</strong> – Universidade de Caxias do Sul</p>',
  'palestra',
  'hibrido',
  2,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 15:00:00+00'::timestamptz,
  '2025-12-12 15:30:00+00'::timestamptz,
  'Humanos e Algoritmos: A Parceria Estratégica na Gestão de Pessoas',
  '<p><strong>Adriano Abreu</strong></p>',
  'palestra',
  'hibrido',
  3,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 15:30:00+00'::timestamptz,
  '2025-12-12 16:00:00+00'::timestamptz,
  'Inovação, Direito e Sustentabilidade no Século XXI',
  '<p><strong>Dra. Maria Emilia Camargo</strong></p>',
  'palestra',
  'hibrido',
  4,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 16:00:00+00'::timestamptz,
  '2025-12-12 16:30:00+00'::timestamptz,
  'Educação na Era Digital',
  '<p><strong>Dr. Luís Miguel Oliveira de Barros Cardoso</strong></p><p>As fronteiras da Capacitação e da Literacia em Inteligência Artificial.</p>',
  'palestra',
  'hibrido',
  5,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 16:30:00+00'::timestamptz,
  '2025-12-12 17:00:00+00'::timestamptz,
  'Transformar para impactar',
  '<p><strong>Dra. Gabriela Zanandrea</strong></p><p>O papel das Empresas na Inovação social.</p>',
  'palestra',
  'hibrido',
  6,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 17:00:00+00'::timestamptz,
  '2025-12-12 19:00:00+00'::timestamptz,
  'Intervalo',
  '<p>Pausa para almoço/descanso</p>',
  'intervalo',
  'hibrido',
  7,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-12 21:30:00+00'::timestamptz,
  '2025-12-12 22:00:00+00'::timestamptz,
  'Saúde mental e propósito de vida no trabalho e na vida',
  '<p><strong>Des. Alexandre Freire Pimentel</strong></p>',
  'palestra',
  'hibrido',
  8,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 01:00:00+00'::timestamptz,
  NULL,
  'Encerramento do Dia 2',
  '<p>Encerramento das atividades do segundo dia</p>',
  'encerramento',
  'hibrido',
  9,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-12' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

-- Inserir sessões do Dia 3 (13/12/2025)
INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 14:00:00+00'::timestamptz,
  '2025-12-13 15:30:00+00'::timestamptz,
  'Mesa-redonda: Direitos Humanos, cidadania e políticas públicas',
  '<p><strong>Participantes:</strong></p><ul><li>Psicóloga Lanna Elias</li><li>Dra. Maria de Fátima Ferreira Rodrigues</li><li>Dra. Mirella de Almeida Braga</li></ul><p><strong>Moderadoras:</strong></p><ul><li>Dra. Gabriela Marcolino Alves Machado</li><li>Dra. Viviane de Sousa - VCCU</li></ul>',
  'mesa_redonda',
  'hibrido',
  1,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 15:30:00+00'::timestamptz,
  '2025-12-13 15:50:00+00'::timestamptz,
  'Saberes que transformam: Um compromisso Social',
  '<p><strong>Dra. Luciane Webwer Baia Heez</strong> - VCCU</p>',
  'palestra',
  'hibrido',
  2,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 15:50:00+00'::timestamptz,
  '2025-12-13 16:10:00+00'::timestamptz,
  'A palavra e o poder',
  '<p><strong>Dra. Rúbia Cátia Azevedo Montenegro</strong> - VCCU</p><p>O letramento como mediação entre saberes e Emancipação Humana.</p>',
  'palestra',
  'hibrido',
  3,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 16:10:00+00'::timestamptz,
  '2025-12-13 16:50:00+00'::timestamptz,
  'Dr. Milton Dantas da Silva',
  '<p>VCCU - Palestra magistral</p>',
  'palestra',
  'hibrido',
  4,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 17:00:00+00'::timestamptz,
  '2025-12-13 19:00:00+00'::timestamptz,
  'Intervalo',
  '<p>Pausa para almoço/descanso</p>',
  'intervalo',
  'hibrido',
  5,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 19:00:00+00'::timestamptz,
  '2025-12-13 21:00:00+00'::timestamptz,
  'Apresentação de trabalhos e consórcios',
  '<p>Sessão de apresentação dos trabalhos acadêmicos e consórcios</p>',
  'sessoes_simultaneas',
  'hibrido',
  6,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d.id,
  '2025-12-13 21:00:00+00'::timestamptz,
  NULL,
  'Encerramento do III CIVENI 2025',
  '<p>Cerimônia de encerramento do III Congresso Internacional Virtual de Educação e Inovação</p>',
  'encerramento',
  'hibrido',
  7,
  true
FROM civeni_program_days d 
WHERE d.date = '2025-12-13' AND d.event_slug = 'iii-civeni-2025'
ON CONFLICT DO NOTHING;

-- Inserir dias da programação online III CIVENI 2025
INSERT INTO civeni_program_days (date, weekday_label, headline, theme, event_slug, modality, location, sort_order, is_published)
VALUES 
  ('2025-12-11', 'Quinta-feira', 'Dia 1 - Abertura e Conferências Online', 'Credenciamento, Cerimônia de Abertura e Palestras Magistrais', 'iii-civeni-2025-online', 'online', 'Online', 1, true),
  ('2025-12-12', 'Sexta-feira', 'Dia 2 - Conferências Internacionais Online', 'Inovação, Educação e Transformação Social', 'iii-civeni-2025-online', 'online', 'Online', 2, true),
  ('2025-12-13', 'Sábado', 'Dia 3 - Mesa-redonda e Encerramento Online', 'Direitos Humanos, Apresentação de Trabalhos e Consórcios', 'iii-civeni-2025-online', 'online', 'Online', 3, true)
ON CONFLICT DO NOTHING;

-- Copiar sessões para modalidade online
INSERT INTO civeni_program_sessions (day_id, start_at, end_at, title, description, session_type, modality, order_in_day, is_published)
SELECT 
  d_online.id,
  s.start_at,
  s.end_at,
  s.title,
  s.description,
  s.session_type,
  'online',
  s.order_in_day,
  s.is_published
FROM civeni_program_sessions s
JOIN civeni_program_days d_presencial ON s.day_id = d_presencial.id
JOIN civeni_program_days d_online ON d_presencial.date = d_online.date
WHERE d_presencial.event_slug = 'iii-civeni-2025'
  AND d_online.event_slug = 'iii-civeni-2025-online'
ON CONFLICT DO NOTHING;