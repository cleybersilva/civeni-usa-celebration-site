import React from 'react';
import { Card } from '@/components/ui/card';

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
      via?: string;
      to: string;
    };
  };
  header: {
    logoUrl?: string;
    logoPosition?: 'left' | 'center' | 'right';
    showLogo: boolean;
    title: string;
    titleColor: string;
    subtitle: string;
    subtitleColor: string;
  };
  body: {
    certifyLabel: string;
    certifyLabelColor: string;
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
    signatureCount?: number;
    signatureLayout?: 'sides' | 'center' | 'left' | 'right';
    showCenterLogo?: boolean;
    centerLogoUrl?: string;
    signatures: Array<{
      label: string;
      name: string;
      signatureImageUrl?: string;
    }>;
  };
  badge: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
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
      .replace(/\{\{nome_participante\}\}/g, sampleData.nome_participante)
      .replace(/\{\{tipo_participacao\}\}/g, sampleData.tipo_participacao)
      .replace(/\{\{nome_evento\}\}/g, sampleData.nome_evento)
      .replace(/\{\{data_evento\}\}/g, sampleData.data_evento)
      .replace(/\{\{carga_horaria\}\}/g, sampleData.carga_horaria)
      .replace(/\{\{data_emissao\}\}/g, sampleData.data_emissao)
      .replace(/\{\{nome_reitor\}\}/g, sampleData.nome_reitor || 'Nome do Reitor')
      .replace(/\{\{nome_coordenador\}\}/g, sampleData.nome_coordenador || 'Nome do Coordenador');
  };

  const backgroundStyle = layoutConfig.background.type === 'gradient' 
    ? { background: `linear-gradient(135deg, ${layoutConfig.background.gradientFrom}, ${layoutConfig.background.gradientTo})` }
    : { backgroundColor: layoutConfig.background.color };

  // Borda com gradiente Civeni (azul -> roxo -> vermelho)
  const borderGradient = `linear-gradient(135deg, ${layoutConfig.border.gradient.from}, ${layoutConfig.border.gradient.via || '#731B4C'}, ${layoutConfig.border.gradient.to})`;
  
  const borderStyle = layoutConfig.border.enabled
    ? {
        border: `${layoutConfig.border.thickness}px solid transparent`,
        backgroundImage: `linear-gradient(white, white), ${borderGradient}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box'
      }
    : {};

  const badgePosition = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }[layoutConfig.badge.position];

  const signatureCount = layoutConfig.footer.signatureCount || 2;
  const signatureLayout = layoutConfig.footer.signatureLayout || 'sides';
  const showCenterLogo = layoutConfig.footer.showCenterLogo ?? true;

  // Determinar classes de alinhamento para assinaturas
  const getSignatureContainerClass = () => {
    if (signatureCount === 1) {
      switch (signatureLayout) {
        case 'left': return 'justify-start';
        case 'right': return 'justify-end';
        case 'center': 
        default: return 'justify-center';
      }
    }
    return 'justify-between';
  };

  // Determinar posição do logo do header
  const getHeaderLogoClass = () => {
    switch (layoutConfig.header.logoPosition) {
      case 'left': return 'mr-4';
      case 'right': return 'ml-4 order-last';
      case 'center':
      default: return 'mx-auto mb-4';
    }
  };

  const getHeaderContainerClass = () => {
    if (layoutConfig.header.logoPosition === 'center') {
      return 'flex flex-col items-center';
    }
    return 'flex items-center justify-center';
  };

  return (
    <Card className="overflow-hidden shadow-2xl" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      <div 
        className="relative p-12 min-h-[700px] flex flex-col justify-between"
        style={{
          ...backgroundStyle,
          ...borderStyle
        }}
      >
        {/* Badge */}
        {layoutConfig.badge.enabled && (
          <div 
            className={`absolute ${badgePosition} px-5 py-2 rounded-full shadow-lg z-10`}
            style={{
              background: `linear-gradient(135deg, ${layoutConfig.badge.backgroundGradient.from}, ${layoutConfig.badge.backgroundGradient.to})`,
              color: layoutConfig.badge.textColor
            }}
          >
            <span className="font-bold text-xs">{layoutConfig.badge.text}</span>
          </div>
        )}

        {/* Header */}
        <div className={`text-center space-y-2 ${getHeaderContainerClass()}`}>
          {layoutConfig.header.showLogo && layoutConfig.header.logoUrl && (
            <img 
              src={layoutConfig.header.logoUrl}
              alt="Logo" 
              className={`w-16 h-auto ${getHeaderLogoClass()}`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className={layoutConfig.header.logoPosition !== 'center' ? 'flex-1' : ''}>
            <h1 
              className="text-3xl font-bold tracking-wider"
              style={{ color: layoutConfig.header.titleColor }}
            >
              {layoutConfig.header.title}
            </h1>
            <p 
              className="text-sm mt-1"
              style={{ color: layoutConfig.header.subtitleColor }}
            >
              {layoutConfig.header.subtitle}
            </p>
          </div>
        </div>

        {/* Body */}
        <div 
          className="space-y-6 my-8"
          style={{ textAlign: layoutConfig.body.alignment }}
        >
          <div className="space-y-1">
            <p 
              className="text-xs"
              style={{ color: layoutConfig.body.certifyLabelColor }}
            >
              {layoutConfig.body.certifyLabel}
            </p>
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
            className="text-sm leading-relaxed max-w-2xl mx-auto px-4"
            style={{ color: layoutConfig.body.mainTextColor }}
          >
            {replacePlaceholders(layoutConfig.body.mainText)}
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-6">
          <p 
            className="text-center text-xs"
            style={{ color: layoutConfig.footer.locationDateColor }}
          >
            {replacePlaceholders(layoutConfig.footer.locationDateText)}
          </p>
          
          {/* Container de assinaturas */}
          <div className={`flex ${getSignatureContainerClass()} items-end gap-4 px-8`}>
            {/* Primeira assinatura */}
            {layoutConfig.footer.signatures[0] && (
              <div className="text-center space-y-1 flex-shrink-0" style={{ minWidth: '150px' }}>
                {layoutConfig.footer.signatures[0].signatureImageUrl ? (
                  <img 
                    src={layoutConfig.footer.signatures[0].signatureImageUrl} 
                    alt="Assinatura"
                    className="w-24 h-12 object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-12 border-b-2 border-gray-400 mx-auto"></div>
                )}
                <div>
                  <p className="font-bold text-xs">{replacePlaceholders(layoutConfig.footer.signatures[0].name)}</p>
                  <p className="text-[10px] text-gray-600">{layoutConfig.footer.signatures[0].label}</p>
                </div>
              </div>
            )}

            {/* Logo central (entre assinaturas) - apenas quando tem 2 assinaturas */}
            {signatureCount === 2 && showCenterLogo && layoutConfig.footer.centerLogoUrl && (
              <div className="flex-shrink-0 flex items-center justify-center">
                <img 
                  src={layoutConfig.footer.centerLogoUrl}
                  alt="Logo CIVENI"
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback para texto
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="text-xs font-bold text-purple-700">III CIVENI 2025</span>';
                    }
                  }}
                />
              </div>
            )}

            {/* Segunda assinatura (apenas se signatureCount === 2) */}
            {signatureCount === 2 && layoutConfig.footer.signatures[1] && (
              <div className="text-center space-y-1 flex-shrink-0" style={{ minWidth: '150px' }}>
                {layoutConfig.footer.signatures[1].signatureImageUrl ? (
                  <img 
                    src={layoutConfig.footer.signatures[1].signatureImageUrl} 
                    alt="Assinatura"
                    className="w-24 h-12 object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-12 border-b-2 border-gray-400 mx-auto"></div>
                )}
                <div>
                  <p className="font-bold text-xs">{replacePlaceholders(layoutConfig.footer.signatures[1].name)}</p>
                  <p className="text-[10px] text-gray-600">{layoutConfig.footer.signatures[1].label}</p>
                </div>
              </div>
            )}
          </div>

          {/* Logo central para 1 assinatura (abaixo da assinatura) */}
          {signatureCount === 1 && showCenterLogo && layoutConfig.footer.centerLogoUrl && (
            <div className="flex justify-center mt-4">
              <img 
                src={layoutConfig.footer.centerLogoUrl}
                alt="Logo CIVENI"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-xs font-bold text-purple-700">III CIVENI 2025</span>';
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CertificatePreview;
