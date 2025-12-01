import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import civeniLogo from '@/assets/civeni-2025-logo.png';

interface CertificateRendererProps {
  eventId: string;
  participantData?: {
    nome_participante: string;
    tipo_participacao?: string;
    nome_evento?: string;
    data_evento?: string;
    carga_horaria?: string;
    data_emissao?: string;
    nome_reitor?: string;
    nome_coordenador?: string;
  };
  scale?: number;
}

const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  eventId,
  participantData,
  scale = 0.8
}) => {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('certificate_templates')
          .select('*')
          .eq('is_active', true)
          .single();

        if (error) throw error;
        
        // Assumir que base_colors contém a configuração do layout
        if (data?.base_colors && typeof data.base_colors === 'object') {
          setTemplate(data.base_colors);
        }
      } catch (error) {
        console.error('Error fetching certificate template:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [eventId]);

  const replacePlaceholders = (text: string): string => {
    if (!participantData) return text;
    
    return text
      .replace(/\{\{nome_participante\}\}/g, participantData.nome_participante || '[Nome do Participante]')
      .replace(/\{\{tipo_participacao\}\}/g, participantData.tipo_participacao || 'Participante')
      .replace(/\{\{nome_evento\}\}/g, participantData.nome_evento || 'III CIVENI 2025')
      .replace(/\{\{data_evento\}\}/g, participantData.data_evento || '11 a 13 de dezembro de 2025')
      .replace(/\{\{carga_horaria\}\}/g, participantData.carga_horaria || '20')
      .replace(/\{\{data_emissao\}\}/g, participantData.data_emissao || new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{nome_reitor\}\}/g, participantData.nome_reitor || 'Dra. Maria Emilia Camargo')
      .replace(/\{\{nome_coordenador\}\}/g, participantData.nome_coordenador || 'Dra. Marcela Tarciana Martins');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-civeni-blue" />
      </div>
    );
  }

  if (!template) {
    // Fallback para certificado padrão se template não for encontrado
    return (
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-auto transform -rotate-2 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <img 
            src={civeniLogo} 
            alt="CIVENI 2025" 
            className="w-16 h-auto mx-auto mb-2"
          />
          <div className="text-civeni-blue font-bold text-lg mb-2">CIVENI 2025</div>
          <div className="text-sm text-gray-600 mb-4">CERTIFICADO DE PARTICIPAÇÃO</div>
          <div className="text-xs text-gray-500 mb-6">VCCU/Civeni</div>
          
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="text-xs text-gray-600 mb-1">Certificamos que</div>
            <div className="font-bold text-gray-800">
              {participantData?.nome_participante || '[SEU NOME AQUI]'}
            </div>
            <div className="text-xs text-gray-600 mt-1">participou do evento</div>
          </div>
          
          <div className="flex justify-between items-end text-xs">
            <div>
              <div className="w-16 h-8 bg-civeni-blue/10 rounded mb-1"></div>
              <div className="text-gray-500">Assinatura</div>
            </div>
            <div className="w-12 h-12 bg-civeni-blue/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar template do SaaS
  const backgroundStyle = template.background.type === 'gradient' 
    ? { background: `linear-gradient(135deg, ${template.background.gradientFrom}, ${template.background.gradientTo})` }
    : { backgroundColor: template.background.color };

  const borderStyle = template.border.enabled
    ? {
        border: `${template.border.thickness}px ${template.border.style} transparent`,
        backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${template.border.gradient.from}, ${template.border.gradient.to})`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box'
      }
    : {};

  const badgePosition = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }[template.badge.position];

  return (
    <div 
      className="overflow-hidden shadow-2xl rounded-lg"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      <div 
        className="relative p-16 min-h-[800px] flex flex-col justify-between"
        style={{
          ...backgroundStyle,
          ...borderStyle
        }}
      >
        {/* Badge */}
        {template.badge.enabled && (
          <div 
            className={`absolute ${badgePosition} px-6 py-2 rounded-full shadow-lg z-10`}
            style={{
              background: `linear-gradient(135deg, ${template.badge.backgroundGradient.from}, ${template.badge.backgroundGradient.to})`,
              color: template.badge.textColor
            }}
          >
            <span className="font-bold text-sm">{template.badge.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          {template.header.showLogo && (
            <img 
              src={template.header.logoUrl || civeniLogo}
              alt="Logo" 
              className="w-24 h-auto mx-auto"
            />
          )}
          <h1 
            className="text-5xl font-bold tracking-wider"
            style={{ color: template.header.titleColor }}
          >
            {template.header.title}
          </h1>
          <p 
            className="text-xl"
            style={{ color: template.header.subtitleColor }}
          >
            {template.header.subtitle}
          </p>
        </div>

        {/* Body */}
        <div 
          className="space-y-8 my-12"
          style={{ textAlign: template.body.alignment }}
        >
          <div className="space-y-2">
            <p 
              className="text-sm"
              style={{ color: template.body.certifyLabelColor }}
            >
              {template.body.certifyLabel}
            </p>
            <h2 
              className="font-bold"
              style={{
                fontSize: `${template.body.participantNameStyle.fontSize}px`,
                fontWeight: template.body.participantNameStyle.fontWeight,
                color: template.body.participantNameStyle.color
              }}
            >
              {replacePlaceholders(template.body.participantNamePlaceholder)}
            </h2>
          </div>
          
          <p 
            className="text-lg leading-relaxed max-w-3xl mx-auto"
            style={{ color: template.body.mainTextColor }}
          >
            {replacePlaceholders(template.body.mainText)}
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-8">
          <p 
            className="text-center text-sm"
            style={{ color: template.footer.locationDateColor }}
          >
            {replacePlaceholders(template.footer.locationDateText)}
          </p>
          
          <div className={`flex ${template.footer.signatures.length === 1 ? 'justify-center' : 'justify-around'} items-end gap-8`}>
            {template.footer.signatures.map((signature: any, index: number) => (
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
    </div>
  );
};

export default CertificateRenderer;
