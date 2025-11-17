import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  bucket?: string;
  folder?: string;
}

interface UploadResult {
  url: string;
  versionedUrl: string;
  fileName: string;
}

export const useOptimizedImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const optimizeAndResize = async (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = Math.round(width / aspectRatio);
            } else {
              height = maxHeight;
              width = Math.round(height * aspectRatio);
            }
          }
          
          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Use high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP with quality setting
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              // Convert blob to base64
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
            'image/webp',
            quality / 100
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadOptimizedImage = async (
    file: File,
    options: OptimizeOptions = {}
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 85,
        bucket = 'images',
        folder = 'optimized'
      } = options;

      toast.info('Otimizando imagem...', { duration: 2000 });
      setProgress(20);

      // Step 1: Client-side optimization (resize and convert to WebP)
      console.log(`📸 Optimizing image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      const optimizedBase64 = await optimizeAndResize(file, maxWidth, maxHeight, quality);
      
      setProgress(50);
      toast.info('Fazendo upload...', { duration: 2000 });

      // Step 2: Upload to server via edge function
      console.log('☁️ Uploading optimized image to server...');
      const { data, error } = await supabase.functions.invoke('optimize-image', {
        body: {
          imageData: optimizedBase64,
          fileName: file.name,
          maxWidth,
          maxHeight,
          quality,
          bucket,
          folder
        }
      });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      
      const originalSizeKB = (file.size / 1024).toFixed(2);
      const optimizedSizeKB = (data.originalSize / 1024).toFixed(2);
      const savedPercentage = (((file.size - data.originalSize) / file.size) * 100).toFixed(0);
      
      console.log(`✅ Upload complete! Original: ${originalSizeKB}KB → Optimized: ${optimizedSizeKB}KB (Saved ${savedPercentage}%)`);
      
      toast.success(`Imagem otimizada! Economia de ${savedPercentage}% no tamanho`, {
        duration: 3000
      });

      return {
        url: data.url,
        versionedUrl: data.versionedUrl,
        fileName: data.fileName
      };

    } catch (error) {
      console.error('Error uploading optimized image:', error);
      toast.error('Erro ao fazer upload da imagem');
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadOptimizedImage,
    isUploading,
    progress
  };
};
