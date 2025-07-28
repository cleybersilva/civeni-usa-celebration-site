-- Primeiro, criar um índice único para activity_type
CREATE UNIQUE INDEX IF NOT EXISTS hybrid_format_config_activity_type_idx 
ON public.hybrid_format_config (activity_type);

-- Limpar dados existentes para evitar conflitos
DELETE FROM public.hybrid_format_config;

-- Inserir configurações do formato híbrido com imagens
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
);