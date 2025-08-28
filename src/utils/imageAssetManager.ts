import { supabase } from '@/integrations/supabase/client';

/**
 * Gerenciamento estável de assets de imagem para produção
 * Corrige problemas de URL em produção vs desenvolvimento
 */

export interface MediaAsset {
  id: string;
  section: string;
  path: string;
  alt_text_pt?: string;
  alt_text_en?: string;
  alt_text_es?: string;
  width?: number;
  height?: number;
}

/**
 * Gera URL estável do Supabase Storage para produção
 */
export function getStableAssetUrl(bucketName: string, filePath: string): string {
  // URL direta e estável - não usa signed URLs que expiram
  return `https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`;
}

/**
 * Normaliza URLs do Supabase para formato público estável
 */
export function normalizeSupabaseUrl(input?: string): string {
  if (!input) return '';
  
  const url = input.trim();
  
  // Já é uma data URL ou blob URL
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // Se é URL do Supabase, normalizar para formato público
    if (parsedUrl.hostname.endsWith('.supabase.co')) {
      // Converter signed URL para public URL
      if (parsedUrl.pathname.includes('/storage/v1/object/sign/')) {
        const publicPath = parsedUrl.pathname.replace('/object/sign/', '/object/public/');
        return `${parsedUrl.origin}${publicPath}`;
      }
      
      // Se já é public URL, retornar como está
      if (parsedUrl.pathname.includes('/storage/v1/object/public/')) {
        return url;
      }
    }
    
    // URL absoluta válida
    return url;
  } catch {
    // Não é URL absoluta, tratar como caminho relativo
  }
  
  // Verificar se é caminho do bucket site-civeni
  const bucketMatch = url.match(/^(?:site-civeni\/)?(.+)$/);
  if (bucketMatch) {
    return getStableAssetUrl('site-civeni', bucketMatch[1]);
  }
  
  return url;
}

/**
 * Resolve URLs de assets para uso em produção
 * Garante URLs absolutas e estáveis
 */
export function resolveProductionAssetUrl(url?: string): string {
  if (!url) return '';
  
  // Primeiro, normalizar URLs do Supabase
  const normalizedUrl = normalizeSupabaseUrl(url);
  
  // Se é URL absoluta, retornar
  if (normalizedUrl.includes('://') || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return normalizedUrl;
  }
  
  // Para assets locais, construir URL absoluta
  const cleanPath = normalizedUrl.replace(/^\.?\/+/, '');
  return `${window.location.origin}/${cleanPath}`;
}

/**
 * Upload de imagem para o bucket site-civeni
 */
export async function uploadImageToStorage(
  file: File, 
  folder: string = 'uploads'
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('site-civeni')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const publicUrl = getStableAssetUrl('site-civeni', filePath);
    
    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    return null;
  }
}

/**
 * Salvar metadados de asset na tabela media_assets
 */
export async function saveAssetMetadata(asset: Omit<MediaAsset, 'id'>): Promise<MediaAsset | null> {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .insert([asset])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to save asset metadata:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Asset metadata save failed:', error);
    return null;
  }
}

/**
 * Obter assets por seção
 */
export async function getAssetsBySection(section: string): Promise<MediaAsset[]> {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('section', section)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch assets:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Asset fetch failed:', error);
    return [];
  }
}

/**
 * Atualizar asset
 */
export async function updateAsset(id: string, updates: Partial<MediaAsset>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('media_assets')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Failed to update asset:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Asset update failed:', error);
    return false;
  }
}