-- Atualizar URLs das imagens do banner para produção
UPDATE banner_slides 
SET bg_image = '/assets/conference-event.jpg'
WHERE bg_image = 'src/assets/conference-event.jpg';

-- Adicionar tabela para configurações de CSP se não existir
CREATE TABLE IF NOT EXISTS public.site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configurações de CSP
INSERT INTO public.site_config (config_key, config_value, description) VALUES
('csp_img_src', '''self'' data: https: blob:', 'Content Security Policy for images'),
('csp_frame_src', 'https://www.youtube.com https://www.google.com https://maps.google.com https://youtube.com', 'Content Security Policy for frames'),
('csp_media_src', '''self'' data: https: blob:', 'Content Security Policy for media')
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  updated_at = now();