-- Habilitar RLS na tabela site_config
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública das configurações do site
CREATE POLICY "Allow public read access to site config" 
ON public.site_config 
FOR SELECT 
USING (true);

-- Criar política para permitir apenas admins atualizarem configurações
CREATE POLICY "Allow admin users to update site config" 
ON public.site_config 
FOR ALL 
USING (is_current_user_admin());