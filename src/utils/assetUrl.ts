import { supabase } from '@/integrations/supabase/client';

function normalizeSupabasePublicUrl(input?: string): string {
  if (!input) return '';
  const s = input.trim();

  // Already absolute non-supabase URL or data/blob
  if (s.startsWith('data:') || s.startsWith('blob:')) return s;
  
  try {
    const u = new URL(s);
    
    // Se for uma URL do Supabase
    if (u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/')) {
      // Converter signed URLs para public URLs
      if (u.pathname.includes('/object/sign/')) {
        const publicPath = u.pathname.replace('/object/sign/', '/object/public/');
        return `${u.origin}${publicPath.split('?')[0]}`; // Remove query params
      }
      
      // Se já for uma URL pública, retornar sem query params para cache consistency
      if (u.pathname.includes('/object/public/')) {
        return `${u.origin}${u.pathname}`;
      }
    }
    
    // Any other absolute URL: return as-is
    return s;
  } catch {
    // Not an absolute URL, continue
  }

  // Se o valor parece ser um caminho público do storage, reconstruir usando SDK
  const storageMatch = s.match(/storage\/v1\/object\/public\/site-civeni\/(.+)$/);
  if (storageMatch && storageMatch[1]) {
    return supabase.storage.from('site-civeni').getPublicUrl(storageMatch[1]).data.publicUrl;
  }

  // Se for um caminho dentro do bucket (e.g., "site-civeni/speakers/image.jpg" ou "speakers/image.jpg")
  if (s.startsWith('site-civeni/')) {
    const path = s.replace(/^site-civeni\//, '');
    return supabase.storage.from('site-civeni').getPublicUrl(path).data.publicUrl;
  }
  
  // Se parece ser um caminho direto para uma imagem de palestrante
  if (s.includes('speakers/') && !s.startsWith('http')) {
    return supabase.storage.from('site-civeni').getPublicUrl(s).data.publicUrl;
  }

  return s;
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';

  // Normalize potential Supabase URLs/paths first
  const supaUrl = normalizeSupabasePublicUrl(url);
  if (supaUrl.includes('://') || supaUrl.startsWith('data:') || supaUrl.startsWith('blob:')) {
    return supaUrl;
  }
  
  // If already absolute URL (non-Supabase)
  if (url.includes('://')) return url;

  // Normalize path separators and strip common prefixes that shouldn't be in the URL
  let cleanUrl = supaUrl.replace(/\\/g, '/').replace(/^\.\//, '');
  cleanUrl = cleanUrl.replace(/^\/??public\//, ''); // remove leading public/

  // For cPanel compatibility, try different paths
  const baseDomain = window.location.origin;
  const currentPath = window.location.pathname;
  
  // If we're in a subdirectory on cPanel, adjust the path
  if (currentPath !== '/' && !currentPath.endsWith('/')) {
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // Remove the last segment if it's a file
      pathSegments.pop();
      const basePath = pathSegments.length > 0 ? '/' + pathSegments.join('/') : '';
      return `${baseDomain}${basePath}/${cleanUrl.replace(/^\/+/, '')}`;
    }
  }
  
  // Default: ensure leading slash and return absolute URL
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }
  
  return baseDomain + cleanUrl;
}

// Nova função para tentar múltiplos caminhos de imagens
export function generateImageFallbackUrls(originalUrl: string): string[] {
  if (!originalUrl) return [];
  
  const urls: string[] = [];
  
  // 1. URL original normalizada
  try {
    const normalized = normalizeSupabasePublicUrl(originalUrl);
    if (normalized && normalized !== originalUrl) {
      urls.push(normalized);
    }
  } catch (error) {
    console.warn('Error normalizing Supabase URL:', error);
  }
  
  // 2. URL original
  urls.push(originalUrl);
  
  // 3. URL resolvida pelo resolveAssetUrl
  try {
    const resolved = resolveAssetUrl(originalUrl);
    if (resolved && resolved !== originalUrl) {
      urls.push(resolved);
    }
  } catch (error) {
    console.warn('Error resolving asset URL:', error);
  }
  
  // 4. Se for uma URL do Supabase, tentar versão pública diretamente
  if (originalUrl.includes('supabase') && originalUrl.includes('storage')) {
    try {
      // Extrair o caminho do arquivo
      const pathMatch = originalUrl.match(/\/site-civeni\/(.+?)(?:\?|$)/);
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        const publicUrl = supabase.storage.from('site-civeni').getPublicUrl(filePath).data.publicUrl;
        urls.push(publicUrl);
      }
      
      // Tentar conversão simples de signed para public
      const publicUrl = originalUrl.replace('/object/sign/', '/object/public/').split('?')[0];
      urls.push(publicUrl);
    } catch (error) {
      console.warn('Error creating public Supabase URL:', error);
    }
  }
  
  // 5. Se for um caminho de palestrante, tentar diferentes combinações
  if (originalUrl.includes('speakers/') && !originalUrl.startsWith('data:')) {
    try {
      const filename = originalUrl.split('/').pop() || '';
      const baseName = filename.split('.')[0];
      const extension = filename.split('.').pop() || 'jpg';
      
      // Tentar com diferentes extensões
      ['jpg', 'jpeg', 'png', 'webp'].forEach(ext => {
        if (ext !== extension) {
          const altFilename = `${baseName}.${ext}`;
          const altUrl = supabase.storage.from('site-civeni').getPublicUrl(`speakers/${altFilename}`).data.publicUrl;
          urls.push(altUrl);
        }
      });
    } catch (error) {
      console.warn('Error generating speaker image alternatives:', error);
    }
  }
  
  // 6. Tentar como caminho relativo no assets (fallback para desenvolvimento)
  if (!originalUrl.startsWith('http') && !originalUrl.startsWith('data:')) {
    const filename = originalUrl.split('/').pop() || '';
    urls.push(`/assets/images/${filename}`);
    urls.push(`/assets/speakers/${filename}`);
    urls.push(`/public/assets/${filename}`);
  }
  
  // Remover duplicatas e URLs inválidas
  const uniqueUrls = [...new Set(urls)].filter(url => url && url.length > 0);
  
  console.log('Generated fallback URLs for:', originalUrl, '-> ', uniqueUrls);
  return uniqueUrls;
}
