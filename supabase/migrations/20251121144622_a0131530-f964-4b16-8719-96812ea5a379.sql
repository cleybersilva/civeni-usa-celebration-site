-- Remove duplicate day entries and keep only the correct ones
DELETE FROM civeni_program_days 
WHERE id IN (
  'e5842f71-5586-4809-a617-4e4db898e41e',
  '945d0773-7020-43c5-b019-a86e7fd25b79',
  'b2d300f1-f1cc-4337-a897-4dc2be7cdfb4',
  'e53c49d6-60bf-419e-b6de-2510a617c105',
  'e5bbc0ed-a6d2-40f2-91b2-0646f3776e20',
  '0b83d761-4f38-498d-b682-35f9d05ac3e3'
);

-- Update the remaining days with correct information
UPDATE civeni_program_days 
SET 
  headline = 'Dia 1 - Abertura e Conferências',
  theme = 'Credenciamento, Cerimônia de Abertura e Palestras Magistrais',
  weekday_label = 'Quinta-feira'
WHERE id = 'b7c893db-e298-4081-b405-a10d7ed62752';

UPDATE civeni_program_days 
SET 
  headline = 'Dia 2 - Conferências Internacionais',
  theme = 'Inovação, Educação e Transformação Social',
  weekday_label = 'Sexta-feira'
WHERE id = '045d6314-0700-4414-b985-afc57f884ec5';

UPDATE civeni_program_days 
SET 
  headline = 'Dia 3 - Mesa-redonda e Encerramento',
  theme = 'Direitos Humanos, Apresentação de Trabalhos e Consórcios',
  weekday_label = 'Sábado'
WHERE id = 'dc783cc9-ecd6-4260-9bc0-672d1f312e64';

UPDATE civeni_program_days 
SET 
  headline = 'Dia 1 - Abertura e Conferências',
  theme = 'Credenciamento, Cerimônia de Abertura e Palestras Magistrais',
  weekday_label = 'Quinta-feira'
WHERE id = 'a6934bd4-8ea2-4f32-9e6c-c6f9ebf08d2a';

UPDATE civeni_program_days 
SET 
  headline = 'Dia 2 - Conferências Internacionais',
  theme = 'Inovação, Educação e Transformação Social',
  weekday_label = 'Sexta-feira'
WHERE id = '08cf1348-e2ab-44a6-8b40-71033e5e56ed';

UPDATE civeni_program_days 
SET 
  headline = 'Dia 3 - Mesa-redonda e Encerramento',
  theme = 'Direitos Humanos, Apresentação de Trabalhos e Consórcios',
  weekday_label = 'Sábado'
WHERE id = 'fb6291ec-3104-481d-9536-89aa915caf06';