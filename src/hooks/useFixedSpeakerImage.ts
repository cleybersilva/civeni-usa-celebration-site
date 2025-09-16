import { Speaker } from '@/contexts/CMSContext';
import { supabase } from '@/integrations/supabase/client';
import {
    fixSupabaseUrlForProduction,
    isProduction,
    testImageUrlForProduction
} from '@/utils/productionImageUtils';
import { useEffect, useState } from 'react';

// Imagem padrão SVG para palestrantes
const DEFAULT_SPEAKER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZ0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjNmNGY2Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTVlN2ViIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYmdHcmFkaWVudCkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNDAiIHI9IjUwIiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0ibTEwMCAzMjBjMC00NCA0MC04MCA5MC04MGgxMjBjNTAgMCA5MCAzNiA5MCA4MHYyMGgtMzAweiIgZmlsbD0iIzljYTNhZiIvPjx0ZXh0IHg9IjIwMCIgeT0iMzYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiPkltYWdlbSBOw6NvIERpc3BvbsOtdmVsPC90ZXh0Pjwvc3ZnPg==';

interface FixedSpeakerImageResult {
  imageSrc: string;
  isLoading: boolean;
  hasError: boolean;
  retryLoad: () => void;
}

export const useFixedSpeakerImage = (speaker: Speaker): FixedSpeakerImageResult => {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_SPEAKER_IMAGE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const testImageUrl = (url: string): Promise<boolean> => {
    return testImageUrlForProduction(url);
  };

  const fixSupabaseUrl = (originalUrl: string): string[] => {
    // Usar a função de produção que inclui cache busting
    const productionUrls = fixSupabaseUrlForProduction(originalUrl);
    
    if (productionUrls.length > 0) {
      return productionUrls;
    }
    
    // Fallback para método original se a função de produção falhar
    const urls: string[] = [];
    
    if (!originalUrl) return urls;
    
    // URL original primeiro
    urls.push(originalUrl);
    
    // Se for do Supabase, tentar corrigir
    if (originalUrl.includes('supabase.co')) {
      try {
        // Método 1: Converter signed para public
        const publicUrl = originalUrl.replace('/object/sign/', '/object/public/').split('?')[0];
        urls.push(publicUrl);
        
        // Método 2: Extrair caminho e usar SDK
        const pathMatch = originalUrl.match(/\/site-civeni\/(.+?)(?:\?|$)/);
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1];
          const sdkUrl = supabase.storage.from('site-civeni').getPublicUrl(filePath).data.publicUrl;
          urls.push(sdkUrl);
        }
        
        // Método 3: Se for um path de speakers, tentar variações
        if (originalUrl.includes('speakers/')) {
          const filename = originalUrl.split('/').pop()?.split('?')[0];
          if (filename) {
            const directUrl = supabase.storage.from('site-civeni').getPublicUrl(`speakers/${filename}`).data.publicUrl;
            urls.push(directUrl);
          }
        }
      } catch (error) {
        console.warn('Error fixing Supabase URL:', error);
      }
    }
    
    // URLs de fallback conhecidas (das migrações)
    const fallbacks = [
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
    ];
    
    // Só adicionar fallbacks se a URL original não for deles
    if (!originalUrl.includes('unsplash.com')) {
      urls.push(...fallbacks);
    }
    
    // Remover duplicatas
    return [...new Set(urls)];
  };

  const processImage = async () => {
    if (!speaker.image) {
      console.info(`[${speaker.name}] No image provided, using default`);
      setImageSrc(DEFAULT_SPEAKER_IMAGE);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    console.log(`[${speaker.name}] Processing image (${isProduction() ? 'PRODUCTION' : 'DEVELOPMENT'}):`, speaker.image);
    setIsLoading(true);
    setHasError(false);

    try {
      // Se for base64, usar diretamente
      if (speaker.image.startsWith('data:')) {
        setImageSrc(speaker.image);
        setIsLoading(false);
        return;
      }

      // Gerar URLs para testar
      const urlsToTry = fixSupabaseUrl(speaker.image);
      console.log(`[${speaker.name}] Testing ${urlsToTry.length} URLs (${isProduction() ? 'prod' : 'dev'} mode):`, urlsToTry);

      let foundWorkingUrl = false;
      
      for (let i = 0; i < urlsToTry.length; i++) {
        const url = urlsToTry[i];
        console.log(`[${speaker.name}] Testing URL ${i + 1}/${urlsToTry.length}:`, url);
        
        const works = await testImageUrl(url);
        
        if (works) {
          console.log(`[${speaker.name}] ✅ SUCCESS with URL:`, url);
          setImageSrc(url);
          foundWorkingUrl = true;
          break;
        } else {
          console.log(`[${speaker.name}] ❌ Failed URL:`, url);
        }
      }

      if (!foundWorkingUrl) {
        console.warn(`[${speaker.name}] 😞 No working URL found, using default`);
        setImageSrc(DEFAULT_SPEAKER_IMAGE);
        setHasError(true);
      }

    } catch (error) {
      console.error(`[${speaker.name}] Error processing image:`, error);
      setImageSrc(DEFAULT_SPEAKER_IMAGE);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    processImage();
  }, [speaker.image, speaker.photoVersion, retryCount]);

  return {
    imageSrc,
    isLoading,
    hasError,
    retryLoad
  };
};

export const getDefaultSpeakerImage = (): string => {
  return DEFAULT_SPEAKER_IMAGE;
};