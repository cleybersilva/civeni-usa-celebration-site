import { supabase } from '@/integrations/supabase/client';

function normalizeSupabasePublicUrl(input?: string): string {
  if (!input) return '';
  const s = input.trim();

  // Already absolute non-supabase URL or data/blob
  if (s.startsWith('data:') || s.startsWith('blob:')) return s;
  try {
    const u = new URL(s);
    // If it's a Supabase signed URL, convert to public
    if (u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/')) {
      const publicPath = u.pathname.replace('/object/sign/', '/object/public/');
      return `${u.origin}${publicPath}`;
    }
    // Any other absolute URL: return as-is
    return s;
  } catch {
    // Not an absolute URL, continue
  }

  // If the value looks like a public storage path, rebuild using SDK to ensure correct origin
  const m = s.match(/storage\/v1\/object\/public\/site-civeni\/(.+)$/);
  if (m && m[1]) {
    return supabase.storage.from('site-civeni').getPublicUrl(m[1]).data.publicUrl;
  }

  // If it's a bare path inside the bucket (e.g., "site-civeni/home/hero.jpg" or "home/hero.jpg")
  if (s.startsWith('site-civeni/')) {
    const path = s.replace(/^site-civeni\//, '');
    return supabase.storage.from('site-civeni').getPublicUrl(path).data.publicUrl;
  }

  return s;
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';

  // Normalize potential Supabase URLs/paths first
  const supaUrl = normalizeSupabasePublicUrl(url);
  if (supaUrl.includes('://') || supaUrl.startsWith('data:') || supaUrl.startsWith('blob:')) {
    return supaUrl;
  }
  
  // If already absolute URL (non-Supabase)
  if (url.includes('://')) return url;

  // Normalize path separators and strip common prefixes that shouldn't be in the URL
  let cleanUrl = supaUrl.replace(/\\/g, '/').replace(/^\.\//, '');
  cleanUrl = cleanUrl.replace(/^\/??public\//, ''); // remove leading public/

  // For cPanel compatibility, try different paths
  const baseDomain = window.location.origin;
  const currentPath = window.location.pathname;
  
  // If we're in a subdirectory on cPanel, adjust the path
  if (currentPath !== '/' && !currentPath.endsWith('/')) {
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // Remove the last segment if it's a file
      pathSegments.pop();
      const basePath = pathSegments.length > 0 ? '/' + pathSegments.join('/') : '';
      return `${baseDomain}${basePath}/${cleanUrl.replace(/^\/+/, '')}`;
    }
  }
  
  // Default: ensure leading slash and return absolute URL
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }
  
  return baseDomain + cleanUrl;
}
