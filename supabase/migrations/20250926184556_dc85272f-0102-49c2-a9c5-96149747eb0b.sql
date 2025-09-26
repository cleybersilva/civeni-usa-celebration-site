-- Criar categoria para convidado
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
  'afc90e54-fdb6-48bc-8631-ede4ab79b21d', -- usando o mesmo event_id
  'convidado',
  'Convidado',
  'Guest',
  'Invitado',
  'Categoria para convidados ao evento com valor fixo de R$ 100,00',
  'Category for event guests with fixed value of R$ 100.00',
  'Categoría para invitados del evento con valor fijo de R$ 100,00',
  5,
  true,
  false,
  10000, -- R$ 100,00 em centavos
  'BRL',
  false
);