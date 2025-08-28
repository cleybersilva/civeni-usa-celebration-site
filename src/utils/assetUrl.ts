export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  // If already absolute (http, https, data, blob), return as-is
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Normalize backslashes just in case
  const clean = url.replace(/\\/g, '/');

  // If starts with "/" treat it as site-root and prefix with current origin
  if (clean.startsWith('/')) {
    return `${window.location.origin}${clean}`;
  }

  // Otherwise return unchanged (relative paths will resolve based on current document URL)
  return clean;
}
