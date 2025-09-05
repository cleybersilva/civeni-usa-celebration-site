import { supabase } from '@/integrations/supabase/client';

// Função para debugar e corrigir URLs do Supabase Storage
export function debugSupabaseImageUrl(originalUrl: string, speakerName?: string): string {
  const prefix = speakerName ? `[${speakerName}]` : '[Image]';
  
  console.group(`${prefix} Debugging Supabase URL: ${originalUrl}`);
  
  if (!originalUrl) {
    console.warn('Empty URL provided');
    console.groupEnd();
    return '';
  }

  // Se for data URL, retornar diretamente
  if (originalUrl.startsWith('data:')) {
    console.info('Data URL detected, returning as-is');
    console.groupEnd();
    return originalUrl;
  }

  try {
    // Se for uma URL absoluta
    if (originalUrl.startsWith('http')) {
      const url = new URL(originalUrl);
      console.info('Absolute URL detected:', url.href);
      
      // Se for do Supabase
      if (url.hostname.endsWith('.supabase.co')) {
        console.info('Supabase URL detected');
        
        // Extrair informações da URL
        const pathSegments = url.pathname.split('/');
        console.info('Path segments:', pathSegments);
        
        // Procurar pelo bucket e arquivo
        const bucketIndex = pathSegments.findIndex(segment => segment === 'site-civeni');
        if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
          const filePath = pathSegments.slice(bucketIndex + 1).join('/');
          console.info('Extracted file path:', filePath);
          
          // Gerar URL pública limpa
          const cleanPublicUrl = supabase.storage.from('site-civeni').getPublicUrl(filePath).data.publicUrl;
          console.info('Generated clean public URL:', cleanPublicUrl);
          console.groupEnd();
          return cleanPublicUrl;
        } else {
          console.warn('Could not extract file path from Supabase URL');
        }
      } else {
        console.info('Non-Supabase URL, returning as-is');
        console.groupEnd();
        return originalUrl;
      }
    } else {
      // Se não for URL absoluta, assumir que é um caminho
      console.info('Relative path detected:', originalUrl);
      
      // Se contém 'speakers/', assumir que é um caminho do storage
      if (originalUrl.includes('speakers/')) {
        const cleanPath = originalUrl.replace(/^.*?(speakers\/.+)$/, '$1');
        console.info('Extracted speaker path:', cleanPath);
        
        const publicUrl = supabase.storage.from('site-civeni').getPublicUrl(cleanPath).data.publicUrl;
        console.info('Generated public URL:', publicUrl);
        console.groupEnd();
        return publicUrl;
      }
    }
  } catch (error) {
    console.error('Error processing URL:', error);
  }
  
  console.warn('Could not process URL, returning original');
  console.groupEnd();
  return originalUrl;
}

// Função para testar se uma URL de imagem carrega corretamente
export function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      console.info('✅ Image loaded successfully:', url);
      resolve(true);
    };
    img.onerror = (error) => {
      console.warn('❌ Image failed to load:', url, error);
      resolve(false);
    };
    
    // Timeout após 10 segundos
    setTimeout(() => {
      console.warn('⏰ Image load timeout:', url);
      resolve(false);
    }, 10000);
    
    img.src = url;
  });
}

// Função para listar URLs de teste para speakers conhecidos
export function generateTestUrls(originalUrl: string): string[] {
  const urls: string[] = [];
  
  // URL original
  urls.push(originalUrl);
  
  // URL debugada
  const debuggedUrl = debugSupabaseImageUrl(originalUrl);
  if (debuggedUrl !== originalUrl) {
    urls.push(debuggedUrl);
  }
  
  // URLs de exemplo conhecidas do Unsplash (fallback para teste)
  const fallbackUrls = [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', // Dr. Maria Rodriguez
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', // Prof. James Chen
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', // Dr. Elena Kowalski
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80', // Dr. Ahmed Hassan
  ];
  
  // Se a URL original está quebrada, incluir as de fallback para teste
  if (originalUrl.includes('supabase') && !originalUrl.includes('unsplash')) {
    urls.push(...fallbackUrls);
  }
  
  return [...new Set(urls)];
}