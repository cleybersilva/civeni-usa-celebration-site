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
    const urls: string[] = [];
    
    if (!originalUrl) return urls;
    
    // Sempre usar as URLs de produção com cache busting
    const productionUrls = fixSupabaseUrlForProduction(originalUrl);
    urls.push(...productionUrls);
    
    // Se não for do Supabase, adicionar URL original
    if (!originalUrl.includes('supabase.co')) {
      urls.push(originalUrl);
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

    setIsLoading(true);
    setHasError(false);

    try {
      // Se for base64, usar diretamente
      if (speaker.image.startsWith('data:')) {
        setImageSrc(speaker.image);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      // Gerar URLs para testar
      const urlsToTry = fixSupabaseUrl(speaker.image);
      console.log(`[${speaker.name}] Testing ${urlsToTry.length} URLs (${isProduction() ? 'prod' : 'dev'} mode):`, urlsToTry);

      let foundWorkingUrl = false;
      
      for (let i = 0; i < urlsToTry.length; i++) {
        const url = urlsToTry[i];
        
        const works = await testImageUrl(url);
        
        if (works) {
          setImageSrc(url);
          setHasError(false);
          foundWorkingUrl = true;
          break;
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