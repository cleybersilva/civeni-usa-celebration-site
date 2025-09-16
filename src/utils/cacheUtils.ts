import { supabase } from '@/integrations/supabase/client';

export interface CachePurgeResult {
  success: boolean;
  message: string;
  affectedUrls: string[];
}

/**
 * Força atualização de cache para todas as imagens ou uma específica
 */
export async function forceCacheUpdate(storagePath?: string): Promise<CachePurgeResult> {
  try {
    // Se não especificar path, limpar tudo
    let query = supabase.from('image_cache_assets').select('*');
    
    if (storagePath) {
      query = query.eq('storage_path', storagePath);
    }
    
    const { data: assets, error } = await query;
    
    if (error) {
      console.error('Error fetching assets for cache update:', error);
      return {
        success: false,
        message: `Erro ao buscar assets: ${error.message}`,
        affectedUrls: []
      };
    }
    
    const affectedUrls: string[] = [];
    
    // Atualizar timestamp de cada asset para forçar nova versioned_url
    for (const asset of assets || []) {
      const newTimestamp = Date.now();
      const newVersionedUrl = `${asset.cdn_url}?v=${asset.content_hash}&t=${newTimestamp}`;
      
      const { error: updateError } = await supabase
        .from('image_cache_assets')
        .update({
          versioned_url: newVersionedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', asset.id);
      
      if (!updateError) {
        affectedUrls.push(newVersionedUrl);
      }
    }
    
    // Chamar edge function para purge do CDN se configurado
    try {
      await supabase.functions.invoke('image-postprocess', {
        body: {
          action: 'force_purge',
          urls: affectedUrls
        }
      });
    } catch (edgeFunctionError) {
      console.warn('Edge function not available for CDN purge:', edgeFunctionError);
    }
    
    return {
      success: true,
      message: `Cache atualizado para ${affectedUrls.length} imagens`,
      affectedUrls
    };
    
  } catch (error) {
    console.error('Error in forceCacheUpdate:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      affectedUrls: []
    };
  }
}

/**
 * Verifica o status do cache para uma imagem
 */
export async function getCacheStatus(storagePath: string) {
  try {
    const { data: asset, error } = await supabase
      .from('image_cache_assets')
      .select('*')
      .eq('storage_path', storagePath)
      .single();
    
    if (error || !asset) {
      return {
        exists: false,
        lastUpdated: null,
        versionedUrl: null,
        contentHash: null
      };
    }
    
    return {
      exists: true,
      lastUpdated: asset.updated_at,
      versionedUrl: asset.versioned_url,
      contentHash: asset.content_hash
    };
  } catch (error) {
    console.error('Error checking cache status:', error);
    return {
      exists: false,
      lastUpdated: null,
      versionedUrl: null,
      contentHash: null
    };
  }
}

/**
 * Limpar cache de imagem específica
 */
export async function clearImageCache(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_cache_assets')
      .delete()
      .eq('storage_path', storagePath);
    
    return !error;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
}

/**
 * Gerar URL com cache busting manual (fallback)
 */
export function generateCacheBusterUrl(url: string): string {
  if (!url) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  
  return `${url}${separator}cb=${timestamp}_${randomId}`;
}

/**
 * Extrair storage path de uma URL do Supabase
 */
export function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}