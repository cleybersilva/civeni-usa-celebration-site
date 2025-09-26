/**
 * Utilities for managing image cache and ensuring fresh image loads
 */

export interface CacheManager {
  clearImageCache: (imageUrl?: string) => Promise<void>;
  clearAllImageCaches: () => Promise<void>;
  generateCacheBustingUrl: (url: string) => string;
}

export const imageCacheManager: CacheManager = {
  /**
   * Clear cache for a specific image URL
   */
  async clearImageCache(imageUrl?: string) {
    if (typeof window === 'undefined') return;

    try {
      const cacheNames = await caches.keys();
      const imageCacheNames = cacheNames.filter(name => 
        name.includes('image') || name.includes('banner') || name.includes('assets')
      );

      for (const cacheName of imageCacheNames) {
        const cache = await caches.open(cacheName);
        
        if (imageUrl) {
          // Clear specific image
          await cache.delete(imageUrl);
          await cache.delete(imageUrl.split('?')[0]); // Clear without query params too
        } else {
          // Clear all images in this cache
          const keys = await cache.keys();
          await Promise.all(keys.map(key => cache.delete(key)));
        }
      }

      console.log(`🧹 Image cache cleared${imageUrl ? ` for: ${imageUrl}` : ' (all images)'}`);
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  },

  /**
   * Clear all image-related caches
   */
  async clearAllImageCaches() {
    if (typeof window === 'undefined') return;

    try {
      const cacheNames = await caches.keys();
      const imageCacheNames = cacheNames.filter(name => 
        name.includes('image') || 
        name.includes('banner') || 
        name.includes('assets') ||
        name.includes('photo') ||
        name.includes('media')
      );

      await Promise.all(imageCacheNames.map(name => caches.delete(name)));
      
      // Also clear browser's memory cache by forcing a reload of critical images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        const src = img.src;
        if (src) {
          img.src = '';
          setTimeout(() => {
            img.src = src.includes('?') ? src + '&refresh=' + Date.now() : src + '?refresh=' + Date.now();
          }, 100);
        }
      });

      console.log('🧹 All image caches cleared and images refreshed');
    } catch (error) {
      console.warn('Failed to clear all image caches:', error);
    }
  },

  /**
   * Generate a cache-busting URL with timestamp and random string
   */
  generateCacheBustingUrl(url: string): string {
    if (!url) return url;

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const separator = url.includes('?') ? '&' : '?';
    
    return `${url}${separator}cb=${timestamp}&r=${random}`;
  }
};

/**
 * Clear image cache on page load to ensure fresh images
 */
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    // Only clear cache if we detect we're on a page with images
    const hasImages = document.querySelectorAll('img').length > 0;
    if (hasImages) {
      setTimeout(() => {
        imageCacheManager.clearAllImageCaches();
      }, 2000); // Wait 2 seconds after page load
    }
  });

  // Expose cache manager globally for debugging
  (window as any).imageCacheManager = imageCacheManager;
}