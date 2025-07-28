-- Inserir ou atualizar configurações do formato híbrido com imagens
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
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=600&q=80',
  1,
  true
),
(
  'keynote',
  'Palestras Magistrais',
  'Assista às apresentações principais de especialistas renomados, abordando tendências e visões futuras da área.',
  'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80',
  2,
  true
),
(
  'panel',
  'Discussões em Painel',
  'Participe de debates interativos com múltiplos especialistas, explorando diferentes perspectivas sobre temas relevantes.',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
  3,
  true
),
(
  'oral',
  'Comunicações Orais',
  'Acompanhe apresentações de pesquisas acadêmicas e projetos inovadores de profissionais e estudantes.',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80',
  4,
  true
)
ON CONFLICT (activity_type) 
DO UPDATE SET
  image_url = EXCLUDED.image_url,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active,
  updated_at = now();