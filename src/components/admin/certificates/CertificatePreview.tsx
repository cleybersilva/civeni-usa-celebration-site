import React from 'react';
import { Card } from '@/components/ui/card';
import civeniLogo from '@/assets/civeni-2025-logo.png';

interface CertificateLayoutConfig {
  background: {
    type: 'solid' | 'gradient';
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  border: {
    enabled: boolean;
    style: 'single' | 'double';
    thickness: number;
    gradient: {
      from: string;
      to: string;
    };
  };
  header: {
    logoUrl?: string;
    showLogo: boolean;
    title: string;
    titleColor: string;
    subtitle: string;
    subtitleColor: string;
  };
  body: {
    participantNamePlaceholder: string;
    participantNameStyle: {
      fontSize: number;
      fontWeight: string;
      color: string;
    };
    mainText: string;
    mainTextColor: string;
    alignment: 'left' | 'center' | 'right';
  };
  footer: {
    locationDateText: string;
    locationDateColor: string;
    signatures: Array<{
      label: string;
      name: string;
      signatureImageUrl?: string;
    }>;
  };
  badge: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    text: string;
    backgroundGradient: {
      from: string;
      to: string;
    };
    textColor: string;
  };
}

interface SampleData {
  nome_participante: string;
  tipo_participacao: string;
  nome_evento: string;
  data_evento: string;
  carga_horaria: string;
  data_emissao: string;
  nome_reitor?: string;
  nome_coordenador?: string;
}

interface CertificatePreviewProps {
  layoutConfig: CertificateLayoutConfig;
  sampleData: SampleData;
  scale?: number;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ 
  layoutConfig, 
  sampleData,
  scale = 0.8
}) => {
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/{{nome_participante}}/g, sampleData.nome_participante)
      .replace(/{{tipo_participacao}}/g, sampleData.tipo_participacao)
      .replace(/{{nome_evento}}/g, sampleData.nome_evento)
      .replace(/{{data_evento}}/g, sampleData.data_evento)
      .replace(/{{carga_horaria}}/g, sampleData.carga_horaria)
      .replace(/{{data_emissao}}/g, sampleData.data_emissao)
      .replace(/{{nome_reitor}}/g, sampleData.nome_reitor || 'Nome do Reitor')
      .replace(/{{nome_coordenador}}/g, sampleData.nome_coordenador || 'Nome do Coordenador');
  };

  const backgroundStyle = layoutConfig.background.type === 'gradient' 
    ? { background: `linear-gradient(135deg, ${layoutConfig.background.gradientFrom}, ${layoutConfig.background.gradientTo})` }
    : { backgroundColor: layoutConfig.background.color };

  const borderStyle = layoutConfig.border.enabled
    ? {
        border: `${layoutConfig.border.thickness}px ${layoutConfig.border.style} transparent`,
        backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${layoutConfig.border.gradient.from}, ${layoutConfig.border.gradient.to})`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box'
      }
    : {};

  const badgePosition = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }[layoutConfig.badge.position];

  return (
    <Card className="overflow-hidden shadow-2xl" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      <div 
        className="relative p-16 min-h-[800px] flex flex-col justify-between"
        style={{
          ...backgroundStyle,
          ...borderStyle
        }}
      >
        {/* Badge */}
        {layoutConfig.badge.enabled && (
          <div 
            className={`absolute ${badgePosition} px-6 py-2 rounded-full shadow-lg z-10`}
            style={{
              background: `linear-gradient(135deg, ${layoutConfig.badge.backgroundGradient.from}, ${layoutConfig.badge.backgroundGradient.to})`,
              color: layoutConfig.badge.textColor
            }}
          >
            <span className="font-bold text-sm">{layoutConfig.badge.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          {layoutConfig.header.showLogo && (
            <img 
              src={layoutConfig.header.logoUrl || civeniLogo}
              alt="Logo" 
              className="w-24 h-auto mx-auto"
            />
          )}
          <h1 
            className="text-5xl font-bold tracking-wider"
            style={{ color: layoutConfig.header.titleColor }}
          >
            {layoutConfig.header.title}
          </h1>
          <p 
            className="text-xl"
            style={{ color: layoutConfig.header.subtitleColor }}
          >
            {layoutConfig.header.subtitle}
          </p>
        </div>

        {/* Body */}
        <div 
          className="space-y-8 my-12"
          style={{ textAlign: layoutConfig.body.alignment }}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Certificamos que</p>
            <h2 
              className="font-bold"
              style={{
                fontSize: `${layoutConfig.body.participantNameStyle.fontSize}px`,
                fontWeight: layoutConfig.body.participantNameStyle.fontWeight,
                color: layoutConfig.body.participantNameStyle.color
              }}
            >
              {replacePlaceholders(layoutConfig.body.participantNamePlaceholder)}
            </h2>
          </div>
          
          <p 
            className="text-lg leading-relaxed max-w-3xl mx-auto"
            style={{ color: layoutConfig.body.mainTextColor }}
          >
            {replacePlaceholders(layoutConfig.body.mainText)}
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-8">
          <p 
            className="text-center text-sm"
            style={{ color: layoutConfig.footer.locationDateColor }}
          >
            {replacePlaceholders(layoutConfig.footer.locationDateText)}
          </p>
          
          <div className={`flex ${layoutConfig.footer.signatures.length === 1 ? 'justify-center' : 'justify-around'} items-end gap-8`}>
            {layoutConfig.footer.signatures.map((signature, index) => (
              <div key={index} className="text-center space-y-2">
                {signature.signatureImageUrl ? (
                  <img 
                    src={signature.signatureImageUrl} 
                    alt="Assinatura"
                    className="w-32 h-16 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-32 h-16 border-t-2 border-gray-400 mx-auto"></div>
                )}
                <div>
                  <p className="font-bold text-sm">{replacePlaceholders(signature.name)}</p>
                  <p className="text-xs text-gray-600">{signature.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CertificatePreview;
