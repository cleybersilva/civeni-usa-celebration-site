import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { useOptimizedImageUpload } from '@/hooks/useOptimizedImageUpload';
import { Progress } from '@/components/ui/progress';

interface OptimizedImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  bucket?: string;
  folder?: string;
  showDimensions?: boolean;
}

const OptimizedImageUpload: React.FC<OptimizedImageUploadProps> = ({
  value,
  onChange,
  label,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 85,
  bucket = 'images',
  folder = 'optimized',
  showDimensions = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadOptimizedImage, isUploading, progress } = useOptimizedImageUpload();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      const result = await uploadOptimizedImage(file, {
        maxWidth,
        maxHeight,
        quality,
        bucket,
        folder
      });

      onChange(result.versionedUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {showDimensions && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          <strong>Otimização automática:</strong> Máximo {maxWidth}x{maxHeight}px, Qualidade {quality}%<br/>
          <span className="text-xs">A imagem será automaticamente redimensionada, convertida para WebP e otimizada.</span>
        </div>
      )}

      {value ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeImage}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Otimizando e enviando... {progress}%
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-primary'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  {progress < 50 ? 'Otimizando imagem...' : 'Fazendo upload...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Arraste uma imagem aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  A imagem será automaticamente otimizada para melhor performance
                </p>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="optimized-image-upload"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('optimized-image-upload')?.click()}
                disabled={isUploading}
              >
                Selecionar Arquivo
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span>Conversão automática para WebP com compressão inteligente</span>
      </div>
    </div>
  );
};

export default OptimizedImageUpload;
