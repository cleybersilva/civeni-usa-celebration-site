export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  
  // If already absolute URL, return as-is
  if (url.includes('://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  // Normalize path separators
  let cleanUrl = url.replace(/\\/g, '/').replace(/^\.\//, '');
  
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

export function createImageWithFallback(src: string, alt: string, onError?: () => void): HTMLImageElement {
  const img = new Image();
  
  // Try multiple possible paths for cPanel
  const tryPaths = [
    resolveAssetUrl(src),
    resolveAssetUrl(`./public/${src.replace(/^\/+/, '')}`),
    resolveAssetUrl(`public/${src.replace(/^\/+/, '')}`),
    src // Original as last resort
  ];
  
  let currentIndex = 0;
  
  const tryNextPath = () => {
    if (currentIndex < tryPaths.length) {
      img.src = tryPaths[currentIndex];
      currentIndex++;
    } else if (onError) {
      onError();
    }
  };
  
  img.onerror = tryNextPath;
  img.alt = alt;
  
  // Start with first path
  tryNextPath();
  
  return img;
}
