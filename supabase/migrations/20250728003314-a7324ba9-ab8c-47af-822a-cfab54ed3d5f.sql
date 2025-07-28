-- Update the admin user password to a known password for testing
UPDATE public.admin_users 
SET password_hash = crypt('123456', gen_salt('bf'))
WHERE email = 'cleyber.silva@live.com';