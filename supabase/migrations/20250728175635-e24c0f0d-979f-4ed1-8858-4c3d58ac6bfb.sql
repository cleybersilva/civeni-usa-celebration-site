-- Limpar dados existentes se houver
DELETE FROM public.hybrid_format_config;

-- Inserir as 4 atividades padrão do formato híbrido
INSERT INTO public.hybrid_format_config (
  activity_type, 
  title, 
  description, 
  image_url, 
  order_index, 
  is_active
) VALUES 
(
  'exhibition',
  'Estandes de Exposição',
  'Explore os estandes de tecnologia e inovação, interaja com expositores e descubra as últimas novidades do setor.',
  '/src/assets/hybrid-exhibition-stands.jpg',
  1,
  true
),
(
  'keynote',
  'Palestras Magistrais',
  'Assista às apresentações principais de especialistas renomados, abordando tendências e visões futuras da área.',
  '/src/assets/hybrid-keynote-lectures.jpg',
  2,
  true
),
(
  'panel',
  'Discussões em Painel',
  'Participe de debates interativos com múltiplos especialistas, explorando diferentes perspectivas sobre temas relevantes.',
  '/src/assets/hybrid-panel-discussions.jpg',
  3,
  true
),
(
  'oral',
  'Comunicações Orais',
  'Acompanhe apresentações de pesquisas acadêmicas e projetos inovadores de profissionais e estudantes.',
  '/src/assets/hybrid-oral-communications.jpg',
  4,
  true
);