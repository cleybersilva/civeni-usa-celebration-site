import { supabase } from '@/integrations/supabase/client';

// Detectar ambiente
export const isProduction = (): boolean => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.includes('lovableproject.com');
};

// Gerar timestamp único para cache busting em produção
export const generateCacheBuster = (): string => {
  if (isProduction()) {
    // Em produção, usar timestamp atual + random para evitar cache
    return `cb=${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
  // Em desenvolvimento, usar timestamp do dia para permitir cache durante desenvolvimento
  const today = new Date().toISOString().split('T')[0];
  return `dev=${today}`;
};

// Configurar headers específicos para produção
export const getImageFetchOptions = (): RequestInit => {
  if (isProduction()) {
    return {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };
  }
  return {
    cache: 'default'
  };
};

// Limpar cache do service worker para imagens em produção
export const clearImageCaches = async (): Promise<void> => {
  if (!isProduction() || !('caches' in window)) return;
  
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(async (cacheName) => {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      const deleteImagePromises = requests
        .filter(request => 
          request.url.includes('supabase.co') && 
          request.url.includes('/storage/v1/object/')
        )
        .map(request => cache.delete(request));
      
      return Promise.all(deleteImagePromises);
    });
    
    await Promise.all(deletePromises);
    console.log('🗑️ Cache de imagens limpo para produção');
  } catch (error) {
    console.warn('Erro ao limpar cache de imagens:', error);
  }
};

// Função aprimorada para corrigir URLs do Supabase
export const fixSupabaseUrlForProduction = (originalUrl: string): string[] => {
  const urls: string[] = [];
  
  if (!originalUrl) return urls;
  
  const cacheBuster = generateCacheBuster();
  
  // URL original com cache busting
  if (originalUrl.includes('?')) {
    urls.push(`${originalUrl}&${cacheBuster}`);
  } else {
    urls.push(`${originalUrl}?${cacheBuster}`);
  }
  
  // Se for do Supabase, tentar múltiplas estratégias
  if (originalUrl.includes('supabase.co')) {
    try {
      // Método 1: Converter signed para public com cache busting
      const publicUrl = originalUrl.replace('/object/sign/', '/object/public/').split('?')[0];
      urls.push(`${publicUrl}?${cacheBuster}`);
      
      // Método 2: Extrair caminho e usar SDK
      const pathMatch = originalUrl.match(/\/site-civeni\/(.+?)(?:\?|$)/);
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        const sdkUrl = supabase.storage.from('site-civeni').getPublicUrl(filePath).data.publicUrl;
        urls.push(`${sdkUrl}?${cacheBuster}`);
      }
      
      // Método 3: Se for um path de speakers, tentar variações
      if (originalUrl.includes('speakers/')) {
        const filename = originalUrl.split('/').pop()?.split('?')[0];
        if (filename) {
          const directUrl = supabase.storage.from('site-civeni').getPublicUrl(`speakers/${filename}`).data.publicUrl;
          urls.push(`${directUrl}?${cacheBuster}`);
        }
      }
    } catch (error) {
      console.warn('Error fixing Supabase URL for production:', error);
    }
  }
  
  // Remover duplicatas
  return [...new Set(urls)];
};

// Teste avançado de imagem com fetch customizado
export const testImageUrlForProduction = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    // Em produção, usar fetch com headers específicos
    if (isProduction()) {
      fetch(url, getImageFetchOptions())
        .then(response => {
          if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(() => resolve(false));
    } else {
      // Em desenvolvimento, usar método padrão
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      // Timeout mais longo em produção
      setTimeout(() => resolve(false), isProduction() ? 15000 : 8000);
      
      img.src = url;
    }
  });
};

// Executar limpeza de cache quando necessário
if (isProduction() && typeof window !== 'undefined') {
  // Limpar cache de imagens ao carregar a página
  window.addEventListener('load', () => {
    setTimeout(clearImageCaches, 2000);
  });
}