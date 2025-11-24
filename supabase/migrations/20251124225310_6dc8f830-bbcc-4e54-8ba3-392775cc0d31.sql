-- Adicionar campos de tradução para banner_slides
ALTER TABLE banner_slides
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
ADD COLUMN IF NOT EXISTS subtitle_es TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT,
ADD COLUMN IF NOT EXISTS button_text_en TEXT,
ADD COLUMN IF NOT EXISTS button_text_es TEXT;

-- Comentário explicativo
COMMENT ON COLUMN banner_slides.title_en IS 'Título do banner em inglês';
COMMENT ON COLUMN banner_slides.title_es IS 'Título do banner em espanhol';
COMMENT ON COLUMN banner_slides.subtitle_en IS 'Subtítulo do banner em inglês';
COMMENT ON COLUMN banner_slides.subtitle_es IS 'Subtítulo do banner em espanhol';
COMMENT ON COLUMN banner_slides.description_en IS 'Descrição do banner em inglês';
COMMENT ON COLUMN banner_slides.description_es IS 'Descrição do banner em espanhol';
COMMENT ON COLUMN banner_slides.button_text_en IS 'Texto do botão em inglês';
COMMENT ON COLUMN banner_slides.button_text_es IS 'Texto do botão em espanhol';