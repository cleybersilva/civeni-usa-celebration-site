-- Atualizar os banners com novas imagens temáticas
UPDATE public.banner_slides 
SET 
  bg_image = '/src/assets/conference-event.jpg',
  updated_at = now()
WHERE order_index = 1;

-- Para os outros banners, vamos usar imagens do Unsplash relacionadas ao tema educacional
UPDATE public.banner_slides 
SET 
  bg_image = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=80',
  updated_at = now()
WHERE order_index = 2;

UPDATE public.banner_slides 
SET 
  bg_image = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2000&q=80',
  updated_at = now()
WHERE order_index = 3;