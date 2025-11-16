-- Reativar os 3 banners principais
UPDATE banner_slides 
SET is_active = true, updated_at = now()
WHERE id IN (
  'b612a599-1a49-4bb5-bb56-7dee6a05a3a4',
  '5167980b-b269-4bb5-aaee-31b3b636cd16', 
  'db3b4e03-a818-40a2-8dab-d212fcc02faf'
);