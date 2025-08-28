export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  
  // If already absolute URL, return as-is
  if (url.includes('://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  // Normalize path separators
  let cleanUrl = url.replace(/\\/g, '/');
  
  // Remove leading ./ if present
  if (cleanUrl.startsWith('./')) {
    cleanUrl = cleanUrl.substring(2);
  }
  
  // Ensure leading slash for absolute path from root
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }
  
  // Return absolute URL
  return window.location.origin + cleanUrl;
}
