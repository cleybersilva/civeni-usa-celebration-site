-- Configuração das categorias para o formulário de inscrição Civeni 2025
-- Desativar todas as categorias atuais
UPDATE event_category SET is_active = false WHERE is_active = true;

-- Criar/atualizar categoria "Lote de lançamento" 
INSERT INTO event_category (
  event_id, 
  slug, 
  title_pt, 
  description_pt,
  is_free, 
  price_cents, 
  currency,
  is_active,
  order_index
) VALUES (
  gen_random_uuid(),
  'lote-lancamento',
  'Lote de lançamento',
  'Categoria para inscrições no lote de lançamento do Civeni 2025',
  false,
  0, -- Será definido pelo lote ativo
  'BRL',
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  title_pt = 'Lote de lançamento',
  description_pt = 'Categoria para inscrições no lote de lançamento do Civeni 2025',
  order_index = 1;

-- Criar/atualizar categoria "Professor(a) VCCU - Parceiro GRATUITO"
INSERT INTO event_category (
  event_id,
  slug,
  title_pt,
  description_pt, 
  is_free,
  price_cents,
  currency,
  is_active,
  order_index
) VALUES (
  gen_random_uuid(),
  'professor-vccu-gratuito',
  'Professor(a) VCCU - Parceiro GRATUITO',
  'Categoria gratuita para professores da VCCU mediante código de cupom',
  true,
  0,
  'BRL', 
  true,
  2
) ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  title_pt = 'Professor(a) VCCU - Parceiro GRATUITO',
  description_pt = 'Categoria gratuita para professores da VCCU mediante código de cupom',
  order_index = 2;