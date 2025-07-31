-- Atualizar as imagens das atividades do formato híbrido com as novas imagens geradas
UPDATE public.hybrid_format_config 
SET 
  image_url = CASE 
    WHEN activity_type = 'estandes_exposicao' THEN '/src/assets/hybrid-exhibition-stands.jpg'
    WHEN activity_type = 'palestras_magistrais' THEN '/src/assets/hybrid-keynote-lectures.jpg'
    WHEN activity_type = 'discussoes_painel' THEN '/src/assets/hybrid-panel-discussions.jpg'
    WHEN activity_type = 'comunicacoes_orais' THEN '/src/assets/hybrid-oral-communications.jpg'
    ELSE image_url
  END,
  updated_at = now()
WHERE activity_type IN ('estandes_exposicao', 'palestras_magistrais', 'discussoes_painel', 'comunicacoes_orais');