import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: () => void;
  fallbackSrc?: string;
  enableCacheBusting?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onError,
  fallbackSrc = '/img/placeholder.png',
  enableCacheBusting = true
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Gerar URL com cache busting
  const generateVersionedUrl = (url: string): string => {
    if (!enableCacheBusting || !url) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    
    return `${url}${separator}cb=${timestamp}_${randomId}`;
  };

  useEffect(() => {
    setImageSrc(generateVersionedUrl(src));
  }, [src, retryCount, enableCacheBusting]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (onError) {
      onError();
    }
    
    // Tentar fallback se disponível
    if (fallbackSrc && fallbackSrc !== imageSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  const imageProps = {
    src: imageSrc,
    alt,
    className: `${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    ...(width && { width }),
    ...(height && { height }),
    ...(priority && { loading: 'eager' as const }),
    ...(!priority && { loading: 'lazy' as const })
  };

  return (
    <div className="relative inline-block">
      <img {...imageProps} />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      
      {/* Error state with retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/90 backdrop-blur-sm">
          <div className="text-center p-4">
            <div className="text-gray-600 text-sm mb-2">Erro ao carregar imagem</div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};