import { supabase } from '@/integrations/supabase/client';
import { normalizeSupabaseUrl, getStableAssetUrl } from './imageAssetManager';

function normalizeSupabasePublicUrl(input?: string): string {
  return normalizeSupabaseUrl(input);
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';

  // Usar nova função de normalização
  const supaUrl = normalizeSupabasePublicUrl(url);
  if (supaUrl.includes('://') || supaUrl.startsWith('data:') || supaUrl.startsWith('blob:')) {
    return supaUrl;
  }
  
  // Se já é URL absoluta (não-Supabase)
  if (url.includes('://')) return url;

  // Normalizar separadores de caminho e prefixos
  let cleanUrl = supaUrl.replace(/\\/g, '/').replace(/^\.\//, '');
  cleanUrl = cleanUrl.replace(/^\/??public\//, ''); // remover public/ inicial

  // Compatibilidade com cPanel - construir URL absoluta
  const baseDomain = window.location.origin;
  const currentPath = window.location.pathname;
  
  // Se estamos em subdiretório no cPanel, ajustar caminho
  if (currentPath !== '/' && !currentPath.endsWith('/')) {
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // Remover último segmento se for arquivo
      pathSegments.pop();
      const basePath = pathSegments.length > 0 ? '/' + pathSegments.join('/') : '';
      return `${baseDomain}${basePath}/${cleanUrl.replace(/^\/+/, '')}`;
    }
  }
  
  // Padrão: garantir barra inicial e retornar URL absoluta
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }
  
  return baseDomain + cleanUrl;
}
