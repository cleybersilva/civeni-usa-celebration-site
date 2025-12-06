-- Atualizar carga horária de 20h para 60h em todos os certificados
UPDATE event_certificates
SET hours = '60h'
WHERE hours = '20h';