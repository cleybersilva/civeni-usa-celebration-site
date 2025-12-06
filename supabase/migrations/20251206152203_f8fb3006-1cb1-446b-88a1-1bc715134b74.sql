-- Seed navigation_items with existing Civeni menus and submenus

-- First, clear any existing data to avoid duplicates
DELETE FROM navigation_items;

-- Insert main menus
INSERT INTO navigation_items (id, type, parent_id, slug, path, order_index, is_visible, status, restricted_to_registered, label_pt_br, label_en, label_es, label_tr, icon)
VALUES
  -- Menu 1: Áreas Temáticas (no submenus, direct link)
  ('11111111-1111-1111-1111-111111111101', 'menu', NULL, 'areas-tematicas', '/area-tematica', 1, true, 'active', false, 'Áreas Temáticas', 'Thematic Areas', 'Áreas Temáticas', 'Tematik Alanlar', NULL),
  
  -- Menu 2: Congresso (has submenus)
  ('11111111-1111-1111-1111-111111111102', 'menu', NULL, 'congresso', '/congresso', 2, true, 'active', false, 'Congresso', 'Congress', 'Congreso', 'Kongre', NULL),
  
  -- Menu 3: Eventos (no submenus, direct link)
  ('11111111-1111-1111-1111-111111111103', 'menu', NULL, 'eventos', '/eventos', 3, true, 'active', false, 'Eventos', 'Events', 'Eventos', 'Etkinlikler', NULL),
  
  -- Menu 4: Palestrantes (no submenus, direct link)
  ('11111111-1111-1111-1111-111111111104', 'menu', NULL, 'palestrantes', '/palestrantes', 4, true, 'active', false, 'Palestrantes', 'Speakers', 'Ponentes', 'Konuşmacılar', NULL),
  
  -- Menu 5: Programação (has submenus)
  ('11111111-1111-1111-1111-111111111105', 'menu', NULL, 'programacao', '/programacao', 5, true, 'active', false, 'Programação', 'Schedule', 'Programación', 'Program', NULL),
  
  -- Menu 6: Trabalhos (has submenus)
  ('11111111-1111-1111-1111-111111111106', 'menu', NULL, 'trabalhos', '/trabalhos', 6, true, 'active', false, 'Trabalhos', 'Papers', 'Trabajos', 'Çalışmalar', NULL);

-- Insert submenus for Congresso
INSERT INTO navigation_items (id, type, parent_id, slug, path, order_index, is_visible, status, restricted_to_registered, label_pt_br, label_en, label_es, label_tr, icon)
VALUES
  ('11111111-1111-1111-1111-111111111201', 'submenu', '11111111-1111-1111-1111-111111111102', 'apresentacao', '/congresso/apresentacao', 1, true, 'active', false, 'Apresentação', 'Presentation', 'Presentación', 'Sunum', NULL),
  ('11111111-1111-1111-1111-111111111202', 'submenu', '11111111-1111-1111-1111-111111111102', 'avaliadores', '/congresso/avaliadores', 2, true, 'active', false, 'Avaliadores', 'Evaluators', 'Evaluadores', 'Değerlendiriciler', NULL),
  ('11111111-1111-1111-1111-111111111203', 'submenu', '11111111-1111-1111-1111-111111111102', 'comite', '/congresso/comite', 3, true, 'active', false, 'Comitê', 'Committee', 'Comité', 'Komite', NULL);

-- Insert submenus for Programação
INSERT INTO navigation_items (id, type, parent_id, slug, path, order_index, is_visible, status, restricted_to_registered, label_pt_br, label_en, label_es, label_tr, icon)
VALUES
  ('11111111-1111-1111-1111-111111111301', 'submenu', '11111111-1111-1111-1111-111111111105', 'presencial', '/programacao-presencial', 1, true, 'active', false, 'Presencial', 'In-Person', 'Presencial', 'Yüz Yüze', NULL),
  ('11111111-1111-1111-1111-111111111302', 'submenu', '11111111-1111-1111-1111-111111111105', 'online', '/programacao-online', 2, true, 'active', false, 'Online', 'Online', 'En Línea', 'Çevrimiçi', NULL),
  ('11111111-1111-1111-1111-111111111303', 'submenu', '11111111-1111-1111-1111-111111111105', 'transmissao-ao-vivo', '/transmissao-ao-vivo', 3, true, 'active', false, 'Transmissão ao Vivo', 'Live Stream', 'Transmisión en Vivo', 'Canlı Yayın', NULL);

-- Insert submenus for Trabalhos
INSERT INTO navigation_items (id, type, parent_id, slug, path, order_index, is_visible, status, restricted_to_registered, label_pt_br, label_en, label_es, label_tr, icon)
VALUES
  ('11111111-1111-1111-1111-111111111401', 'submenu', '11111111-1111-1111-1111-111111111106', 'submissao-artigo-consorcio', '/submissao-trabalhos', 1, true, 'active', false, 'Submissão Artigo/Consórcio', 'Article/Consortium Submission', 'Envío de Artículo/Consorcio', 'Makale/Konsorsiyum Gönderimi', NULL),
  ('11111111-1111-1111-1111-111111111402', 'submenu', '11111111-1111-1111-1111-111111111106', 'lista-apresentacao', '/lista-apresentacao', 2, true, 'active', false, 'Lista de Apresentação Artigos/Projetos', 'Articles/Projects Presentation List', 'Lista de Presentación Artículos/Proyectos', 'Makale/Proje Sunum Listesi', NULL),
  ('11111111-1111-1111-1111-111111111403', 'submenu', '11111111-1111-1111-1111-111111111106', 'sessoes-poster', '/sessoes-poster', 3, true, 'active', false, 'Sessões de Pôster', 'Poster Sessions', 'Sesiones de Póster', 'Poster Oturumları', NULL),
  ('11111111-1111-1111-1111-111111111404', 'submenu', '11111111-1111-1111-1111-111111111106', 'envio-videos', '/envio-videos', 4, true, 'active', false, 'Envio de Vídeos', 'Video Submission', 'Envío de Videos', 'Video Gönderimi', NULL),
  ('11111111-1111-1111-1111-111111111405', 'submenu', '11111111-1111-1111-1111-111111111106', 'templates-artigos-slides', '/templates-artigos-slides', 5, true, 'active', false, 'Templates Artigos/Slides', 'Article/Slides Templates', 'Plantillas Artículos/Diapositivas', 'Makale/Slayt Şablonları', NULL);