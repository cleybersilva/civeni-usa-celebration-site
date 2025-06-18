
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Info } from 'lucide-react';
import { IMAGE_CONFIGS, downloadTemplateImage } from '@/utils/imageUtils';

interface ImageGuideProps {
  type: keyof typeof IMAGE_CONFIGS;
  title: string;
}

const ImageGuide = ({ type, title }: ImageGuideProps) => {
  const config = IMAGE_CONFIGS[type];

  const handleDownloadTemplate = () => {
    downloadTemplateImage(type, title.toLowerCase().replace(/\s+/g, '_'));
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-blue-700">
          <Info className="w-4 h-4" />
          Dimensões da Imagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="font-semibold text-blue-900">
            Tamanho necessário: {config.width} x {config.height} pixels
          </p>
          <p className="text-blue-700">{config.description}</p>
        </div>
        
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          size="sm"
          className="w-full bg-white hover:bg-blue-100 text-blue-700 border-blue-300"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar Template {config.width}x{config.height}
        </Button>
        
        <div className="text-xs text-blue-600">
          <p><strong>Dica:</strong> Use o template baixado como guia para criar suas imagens com o tamanho correto.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageGuide;
