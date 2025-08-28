import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MediaAsset } from '@/utils/imageAssetManager';

/**
 * Hook para sincronização em tempo real de media assets
 * Permite edição pelo SaaS e reflexão imediata no site
 */
export function useMediaAssets(section?: string) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
    
    // Configurar subscription para mudanças em tempo real
    const subscription = supabase
      .channel(`media_assets_${section || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_assets',
          filter: section ? `section=eq.${section}` : undefined
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [section]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAssets(data || []);
    } catch (err) {
      console.error('Failed to fetch media assets:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        setAssets(prev => [newRecord, ...prev]);
        break;
      
      case 'UPDATE':
        setAssets(prev => prev.map(asset => 
          asset.id === newRecord.id ? newRecord : asset
        ));
        break;
      
      case 'DELETE':
        setAssets(prev => prev.filter(asset => asset.id !== oldRecord.id));
        break;
    }
  };

  /**
   * Obter asset específico por seção e critério
   */
  const getAsset = (criteria: { section?: string; path?: string }) => {
    return assets.find(asset => {
      if (criteria.section && asset.section !== criteria.section) return false;
      if (criteria.path && asset.path !== criteria.path) return false;
      return true;
    });
  };

  /**
   * Obter assets por seção específica
   */
  const getAssetsBySection = (sectionName: string) => {
    return assets.filter(asset => asset.section === sectionName);
  };

  /**
   * Obter URL de asset com fallback
   */
  const getAssetUrl = (sectionName: string, fallbackUrl?: string) => {
    const asset = assets.find(a => a.section === sectionName);
    if (asset?.path) {
      return `https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/site-civeni/${asset.path}`;
    }
    return fallbackUrl || '';
  };

  /**
   * Obter alt text localizado
   */
  const getAssetAltText = (sectionName: string, lang: 'pt' | 'en' | 'es' = 'pt', fallback?: string) => {
    const asset = assets.find(a => a.section === sectionName);
    if (!asset) return fallback || '';
    
    const altKey = `alt_text_${lang}` as keyof MediaAsset;
    return asset[altKey] as string || asset.alt_text_pt || fallback || '';
  };

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets,
    getAsset,
    getAssetsBySection,
    getAssetUrl,
    getAssetAltText
  };
}