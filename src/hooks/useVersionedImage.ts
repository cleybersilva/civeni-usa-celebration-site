import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VersionedImageResult {
  versionedUrl: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

interface MediaAsset {
  id: string;
  storage_path: string;
  content_hash: string;
  cdn_url: string;
  versioned_url: string;
  is_published: boolean;
}

export const useVersionedImage = (originalUrl: string): VersionedImageResult => {
  const [versionedUrl, setVersionedUrl] = useState<string>(originalUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCacheBusterUrl = useCallback((url: string): string => {
    if (!url) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    
    return `${url}${separator}v=${timestamp}&cb=${randomId}`;
  }, []);

  const extractStoragePath = useCallback((url: string): string | null => {
    try {
      // Extrair path do storage a partir da URL do Supabase
      const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/(.+?)(?:\?|$)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }, []);

  const fetchVersionedUrl = useCallback(async () => {
    if (!originalUrl) {
      setVersionedUrl('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const storagePath = extractStoragePath(originalUrl);
      
      if (storagePath) {
        // Tentar buscar URL versionada da tabela media_assets
        const { data: asset, error: fetchError } = await supabase
          .from('media_assets')
          .select('versioned_url, content_hash, cdn_url')
          .eq('storage_path', storagePath)
          .eq('is_published', true)
          .single();

        if (asset && asset.versioned_url && !fetchError) {
          setVersionedUrl(asset.versioned_url);
        } else {
          // Fallback: gerar URL com cache busting manual
          setVersionedUrl(generateCacheBusterUrl(originalUrl));
        }
      } else {
        // URL externa ou não reconhecida - usar cache busting simples
        setVersionedUrl(generateCacheBusterUrl(originalUrl));
      }
    } catch (err) {
      console.warn('Error fetching versioned URL:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setVersionedUrl(generateCacheBusterUrl(originalUrl));
    } finally {
      setIsLoading(false);
    }
  }, [originalUrl, extractStoragePath, generateCacheBusterUrl]);

  const refresh = useCallback(() => {
    fetchVersionedUrl();
  }, [fetchVersionedUrl]);

  useEffect(() => {
    fetchVersionedUrl();
  }, [fetchVersionedUrl]);

  // Listen for real-time updates to media_assets
  useEffect(() => {
    const storagePath = extractStoragePath(originalUrl);
    if (!storagePath) return;

    const channel = supabase
      .channel('media-assets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_assets',
          filter: `storage_path=eq.${storagePath}`
        },
        (payload) => {
          console.log('Media asset updated:', payload);
          if (payload.new && (payload.new as MediaAsset).versioned_url) {
            setVersionedUrl((payload.new as MediaAsset).versioned_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [originalUrl, extractStoragePath]);

  return {
    versionedUrl,
    isLoading,
    error,
    refresh
  };
};