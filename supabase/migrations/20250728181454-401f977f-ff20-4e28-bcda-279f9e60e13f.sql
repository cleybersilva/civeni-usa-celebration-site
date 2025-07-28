-- Atualizar as URLs das imagens para usar as imagens geradas localmente
UPDATE public.hybrid_format_config SET 
  image_url = '/img/formato_hibrido/estandes-exposicao.png',
  title = 'Estandes de Exposição',
  description = 'Explore os estandes de tecnologia e inovação com displays interativos, realidade aumentada e networking profissional.'
WHERE activity_type = 'exhibition';

UPDATE public.hybrid_format_config SET 
  image_url = '/img/formato_hibrido/palestras-magistrais.png',
  title = 'Palestras Magistrais',
  description = 'Assista às apresentações principais de especialistas renomados com insights valiosos e conhecimento técnico avançado.'
WHERE activity_type = 'keynote';

UPDATE public.hybrid_format_config SET 
  image_url = '/img/formato_hibrido/painel.png',
  title = 'Discussões em Painel',
  description = 'Participe de debates interativos com múltiplos especialistas, troca de experiências e discussões enriquecedoras.'
WHERE activity_type = 'panel';

UPDATE public.hybrid_format_config SET 
  image_url = '/img/formato_hibrido/comunicacoes-orais.png',
  title = 'Comunicações Orais',
  description = 'Acompanhe apresentações de pesquisas acadêmicas e projetos inovadores por jovens pesquisadores e profissionais.'
WHERE activity_type = 'oral';

-- Inserir novos registros caso não existam
INSERT INTO public.hybrid_format_config (activity_type, title, description, image_url, order_index, is_active)
SELECT 'exhibition', 'Estandes de Exposição', 'Explore os estandes de tecnologia e inovação com displays interativos, realidade aumentada e networking profissional.', '/img/formato_hibrido/estandes-exposicao.png', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.hybrid_format_config WHERE activity_type = 'exhibition');

INSERT INTO public.hybrid_format_config (activity_type, title, description, image_url, order_index, is_active)
SELECT 'keynote', 'Palestras Magistrais', 'Assista às apresentações principais de especialistas renomados com insights valiosos e conhecimento técnico avançado.', '/img/formato_hibrido/palestras-magistrais.png', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hybrid_format_config WHERE activity_type = 'keynote');

INSERT INTO public.hybrid_format_config (activity_type, title, description, image_url, order_index, is_active)
SELECT 'panel', 'Discussões em Painel', 'Participe de debates interativos com múltiplos especialistas, troca de experiências e discussões enriquecedoras.', '/img/formato_hibrido/painel.png', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hybrid_format_config WHERE activity_type = 'panel');

INSERT INTO public.hybrid_format_config (activity_type, title, description, image_url, order_index, is_active)
SELECT 'oral', 'Comunicações Orais', 'Acompanhe apresentações de pesquisas acadêmicas e projetos inovadores por jovens pesquisadores e profissionais.', '/img/formato_hibrido/comunicacoes-orais.png', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.hybrid_format_config WHERE activity_type = 'oral');