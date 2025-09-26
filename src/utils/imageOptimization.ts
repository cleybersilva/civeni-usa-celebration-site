/**
 * Utilities for optimizing image loading, especially large base64 images
 */

export interface ImageLoadResult {
  success: boolean;
  src: string;
  error?: string;
  isBase64: boolean;
  size?: number;
}

/**
 * Check if a URL is a base64 data URL
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * Get the approximate size of a base64 image in KB
 */
export function getBase64Size(base64: string): number {
  // Base64 encoding increases size by ~33%
  return Math.round(base64.length * 0.75 / 1024);
}

/**
 * Optimize base64 image loading with progress tracking
 */
export function loadBase64Image(
  base64: string,
  onProgress?: (progress: number) => void
): Promise<ImageLoadResult> {
  return new Promise((resolve) => {
    const size = getBase64Size(base64);
    
    // For very large images, simulate progress
    if (size > 500) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 90) {
          clearInterval(interval);
          progress = 90;
        }
        onProgress?.(progress);
      }, 100);
      
      // Add a delay proportional to the image size
      const delay = Math.min(size / 100, 1000); // Max 1 second delay
      
      setTimeout(() => {
        clearInterval(interval);
        onProgress?.(100);
        resolve({
          success: true,
          src: base64,
          isBase64: true,
          size
        });
      }, delay);
    } else {
      // Small base64 images load immediately
      onProgress?.(100);
      resolve({
        success: true,
        src: base64,
        isBase64: true,
        size
      });
    }
  });
}

/**
 * Load regular image URL with timeout
 */
export function loadImageUrl(
  url: string,
  timeout: number = 10000
): Promise<ImageLoadResult> {
  return new Promise((resolve) => {
    const img = new Image();
    let timeoutId: NodeJS.Timeout;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = () => {
      cleanup();
      resolve({
        success: true,
        src: url,
        isBase64: false
      });
    };
    
    img.onerror = () => {
      cleanup();
      resolve({
        success: false,
        src: url,
        isBase64: false,
        error: 'Failed to load image'
      });
    };
    
    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        src: url,
        isBase64: false,
        error: 'Image load timeout'
      });
    }, timeout);
    
    img.src = url;
  });
}

/**
 * Comprehensive image loader that handles both base64 and URLs
 */
export async function loadOptimizedImage(
  imageUrl: string,
  options?: {
    timeout?: number;
    onProgress?: (progress: number) => void;
  }
): Promise<ImageLoadResult> {
  if (!imageUrl) {
    return {
      success: false,
      src: '',
      isBase64: false,
      error: 'No image URL provided'
    };
  }
  
  if (isBase64Image(imageUrl)) {
    console.log(`Loading base64 image (${getBase64Size(imageUrl)}KB)`);
    return loadBase64Image(imageUrl, options?.onProgress);
  } else {
    console.log(`Loading image URL: ${imageUrl}`);
    return loadImageUrl(imageUrl, options?.timeout);
  }
}

/**
 * Create initials from a name
 */
export function createInitials(name: string, maxChars: number = 2): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, maxChars);
}