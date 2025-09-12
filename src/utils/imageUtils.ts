
export interface ImageDimensions {
  width: number;
  height: number;
  description: string;
}

export const IMAGE_CONFIGS = {
  speaker: {
    width: 400,
    height: 400,
    description: "Foto do palestrante (quadrada)"
  },
  banner: {
    width: 2000,
    height: 800,
    description: "Imagem de fundo do banner principal"
  },
  venue: {
    width: 1200,
    height: 600,
    description: "Imagem do local do evento"
  },
  hybrid_activity: {
    width: 600,
    height: 400,
    description: "Imagem da atividade do formato híbrido"
  },
  video: {
    width: 1280,
    height: 720,
    description: "Thumbnail do vídeo (16:9)"
  },
  event: {
    width: 1920,
    height: 1080,
    description: "Banner do evento (16:9)"
  }
} as const;

export const createTemplateImage = (config: ImageDimensions): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = config.width;
    canvas.height = config.height;
    
    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, config.width, config.height);
    gradient.addColorStop(0, '#1e40af'); // civeni-blue
    gradient.addColorStop(1, '#dc2626'); // civeni-red
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Texto com dimensões
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = config.width / 2;
    const centerY = config.height / 2;
    
    ctx.fillText(`${config.width} x ${config.height}px`, centerX, centerY - 20);
    ctx.font = '18px Arial';
    ctx.fillText(config.description, centerX, centerY + 20);
    
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
};

export const downloadTemplateImage = async (type: keyof typeof IMAGE_CONFIGS, filename: string) => {
  const config = IMAGE_CONFIGS[type];
  const blob = await createTemplateImage(config);
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${config.width}x${config.height}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
