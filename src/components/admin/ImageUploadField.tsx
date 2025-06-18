
import React, { useState } from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { IMAGE_CONFIGS } from '@/utils/imageUtils';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  type: keyof typeof IMAGE_CONFIGS;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label,
  type
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const config = IMAGE_CONFIGS[type];

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="space-y-4">
          {/* Guia de dimensões */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Dimensões recomendadas:</strong> {config.width} x {config.height}px<br/>
            <span className="text-xs">{config.description}</span>
          </div>

          {/* Área de upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {value ? (
              <div className="space-y-4">
                <img 
                  src={value} 
                  alt="Preview" 
                  className="max-w-full max-h-32 mx-auto rounded"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Remover Imagem
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Arraste uma imagem aqui</p>
                  <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id={`file-input-${type}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-input-${type}`)?.click()}
                >
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default ImageUploadField;
