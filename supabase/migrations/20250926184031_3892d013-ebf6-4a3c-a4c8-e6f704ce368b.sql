-- Criar categoria para participante externo
INSERT INTO event_category (
  event_id,
  slug,
  title_pt,
  title_en,
  title_es,
  description_pt,
  description_en,
  description_es,
  order_index,
  is_active,
  is_free,
  price_cents,
  currency,
  is_promotional
) VALUES (
  'afc90e54-fdb6-48bc-8631-ede4ab79b21d', -- usando o event_id da categoria gratuita existente 
  'participante-externo',
  'Participante Externo',
  'External Participant',
  'Participante Externo',
  'Categoria para participantes externos ao evento com valor fixo de R$ 200,00',
  'Category for external participants with fixed value of R$ 200.00',
  'Categoría para participantes externos con valor fijo de R$ 200,00',
  4,
  true,
  false,
  20000, -- R$ 200,00 em centavos
  'BRL',
  false
);