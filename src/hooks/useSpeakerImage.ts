import { Speaker } from '@/contexts/CMSContext';
import { generateImageFallbackUrls } from '@/utils/assetUrl';
import { debugSupabaseImageUrl, testImageUrl } from '@/utils/debugSupabaseImages';
import { useEffect, useState } from 'react';

// Imagem padrão SVG para palestrantes
const DEFAULT_SPEAKER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZ0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjNmNGY2Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTVlN2ViIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYmdHcmFkaWVudCkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNDAiIHI9IjUwIiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0ibTEwMCAzMjBjMC00NCA0MC04MCA5MC04MGgxMjBjNTAgMCA5MCAzNiA5MCA4MHYyMGgtMzAweiIgZmlsbD0iIzljYTNhZiIvPjx0ZXh0IHg9IjIwMCIgeT0iMzYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiPkltYWdlbSBOw6NvIERpc3BvbsOtdmVsPC90ZXh0Pjwvc3ZnPg==';

interface UseSpeakerImageResult {
  imageSrc: string;
  isLoading: boolean;
  hasError: boolean;
  errorType: 'none' | 'no-image' | 'load-failed' | 'too-large' | 'invalid-format';
  retryLoad: () => void;
  usesFallback: boolean;
}

export const useSpeakerImage = (speaker: Speaker): UseSpeakerImageResult => {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_SPEAKER_IMAGE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'none' | 'no-image' | 'load-failed' | 'too-large' | 'invalid-format'>('none');
  const [usesFallback, setUsesFallback] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadImage = async (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  };

  const processImageUrl = async () => {
    if (!speaker.image) {
      console.info('No image provided for speaker:', speaker.name, '- using default');
      setImageSrc(DEFAULT_SPEAKER_IMAGE);
      setHasError(true);
      setErrorType('no-image');
      setUsesFallback(true);
      setIsLoading(false);
      return;
    }

    console.log('Processing image for speaker:', speaker.name, 'Image URL:', speaker.image);
    setIsLoading(true);
    setHasError(false);
    setErrorType('none');
    setUsesFallback(false);

    try {
      // Se for uma imagem base64, verificar se é válida e não muito grande
      if (speaker.image.startsWith('data:')) {
        // Verificar tamanho máximo (50KB)
        if (speaker.image.length > 50000) {
          console.warn('Speaker image too large (>50KB), using default for:', speaker.name);
          setImageSrc(DEFAULT_SPEAKER_IMAGE);
          setHasError(true);
          setErrorType('too-large');
          setUsesFallback(true);
          return;
        }

        // Tentar carregar a imagem base64
        const isValid = await loadImage(speaker.image);
        if (isValid) {
          setImageSrc(speaker.image);
          console.info('Successfully loaded base64 image for speaker:', speaker.name);
        } else {
          console.warn('Invalid base64 image for speaker:', speaker.name);
          setImageSrc(DEFAULT_SPEAKER_IMAGE);
          setHasError(true);
          setErrorType('invalid-format');
          setUsesFallback(true);
        }
        return;
      }

      // Para URLs normais, usar estratégias de fallback
      const fallbackUrls = generateImageFallbackUrls(speaker.image);
      
      // Adicionar URL debugada específica para Supabase
      const debuggedUrl = debugSupabaseImageUrl(speaker.image, speaker.name);
      if (debuggedUrl !== speaker.image) {
        fallbackUrls.unshift(debuggedUrl); // Adicionar no início da lista
      }
      
      // Adicionar URLs com versioning
      const imageUrls: string[] = [];
      
      // Estratégia 1: URLs com versioning
      const version = speaker.photoVersion || Date.now();
      fallbackUrls.forEach(url => {
        if (url.includes('://')) {
          imageUrls.push(`${url}?v=${version}`);
        }
      });
      
      // Estratégia 2: URLs sem versioning
      imageUrls.push(...fallbackUrls);

      // Tentar carregar cada URL em sequência
      let imageLoaded = false;
      console.log('Trying', imageUrls.length, 'URLs for speaker:', speaker.name);
      
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (imageLoaded) break;
        
        console.log(`Attempt ${i + 1}/${imageUrls.length} for ${speaker.name}:`, url);
        
        try {
          const isValid = await testImageUrl(url);
          if (isValid) {
            setImageSrc(url);
            imageLoaded = true;
            console.info('Successfully loaded image for speaker:', speaker.name, 'from URL:', url);
            break;
          } else {
            console.warn(`Failed to load image ${i + 1}/${imageUrls.length} for ${speaker.name}:`, url);
          }
        } catch (error) {
          console.warn(`Error loading image ${i + 1}/${imageUrls.length} for ${speaker.name}:`, url, error);
        }
      }

      // Se nenhuma URL funcionou, usar imagem padrão
      if (!imageLoaded) {
        console.warn('Failed to load any image URL for speaker:', speaker.name, '- using default');
        setImageSrc(DEFAULT_SPEAKER_IMAGE);
        setHasError(true);
        setErrorType('load-failed');
        setUsesFallback(true);
      }

    } catch (error) {
      console.error('Error processing image for speaker:', speaker.name, error);
      setImageSrc(DEFAULT_SPEAKER_IMAGE);
      setHasError(true);
      setErrorType('load-failed');
      setUsesFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    processImageUrl();
  }, [speaker.image, speaker.photoVersion, retryCount]);

  return {
    imageSrc,
    isLoading,
    hasError,
    errorType,
    retryLoad,
    usesFallback
  };
};

export const getDefaultSpeakerImage = (): string => {
  return DEFAULT_SPEAKER_IMAGE;
};