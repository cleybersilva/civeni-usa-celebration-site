export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  
  // If already absolute (http, https, data, blob), return as-is
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  // Normalize backslashes just in case
  const clean = url.replace(/\\/g, '/');

  // Handle production URLs that might be stored as relative paths
  if (clean.startsWith('./') || clean.startsWith('../')) {
    // Convert relative paths to absolute paths from root
    const basePath = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
    return new URL(clean, basePath).href;
  }

  // If starts with "/" treat it as site-root and prefix with current origin
  if (clean.startsWith('/')) {
    return `${window.location.origin}${clean}`;
  }

  // For paths that don't start with / or ./, treat as relative to site root
  // This handles cases where images are stored without leading slash
  if (!clean.includes('://')) {
    return `${window.location.origin}/${clean.replace(/^\/+/, '')}`;
  }

  // Otherwise return unchanged
  return clean;
}
