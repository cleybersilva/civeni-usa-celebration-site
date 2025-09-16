-- Adicionar evento de teste para debug
INSERT INTO public.events (
  slug,
  inicio_at,
  fim_at,
  timezone,
  modalidade,
  endereco,
  banner_url,
  youtube_url,
  tem_inscricao,
  inscricao_url,
  featured,
  status_publicacao,
  created_by
) VALUES (
  'evento-teste-debug',
  '2025-03-15 14:00:00+00',
  '2025-03-15 18:00:00+00',
  'America/Sao_Paulo',
  'hibrido',
  'Centro de Convenções de Fortaleza - CE',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400',
  'https://youtube.com/watch?v=test',
  true,
  '/inscricoes',
  true,
  'published',
  'system'
) ON CONFLICT (slug) DO UPDATE SET
  inicio_at = EXCLUDED.inicio_at,
  status_publicacao = 'published',
  featured = true;

-- Adicionar tradução em português para o evento de teste
INSERT INTO public.event_translations (
  event_id,
  idioma,
  titulo,
  subtitulo,
  descricao_richtext,
  meta_title,
  meta_description
) 
SELECT 
  e.id,
  'pt-BR',
  'Evento de Teste - CIVENI 2025',
  'Evento para testar a funcionalidade de detalhes',
  '<p>Este é um evento de teste criado para debugar a funcionalidade de visualização de detalhes dos eventos.</p><p>Inclui informações básicas para verificar se todos os componentes estão funcionando corretamente.</p>',
  'Evento de Teste - CIVENI 2025',
  'Evento de teste para verificar a funcionalidade de detalhes dos eventos do CIVENI'
FROM public.events e 
WHERE e.slug = 'evento-teste-debug'
ON CONFLICT (event_id, idioma) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  subtitulo = EXCLUDED.subtitulo,
  descricao_richtext = EXCLUDED.descricao_richtext;