import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save } from 'lucide-react';
import CertificatePreview from './CertificatePreview';

interface CertificateTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: any) => Promise<void>;
  initialConfig?: any;
  eventId: string;
}

const defaultConfig = {
  background: {
    type: 'solid',
    color: '#F9FAFB'
  },
  border: {
    enabled: true,
    style: 'double',
    thickness: 4,
    gradient: {
      from: '#1e40af',
      to: '#dc2626'
    }
  },
  header: {
    showLogo: true,
    title: 'CERTIFICADO',
    titleColor: '#1e40af',
    subtitle: 'III CIVENI 2025 – Celebration, Florida/EUA',
    subtitleColor: '#4B5563'
  },
  body: {
    participantNamePlaceholder: '{{nome_participante}}',
    participantNameStyle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#111827'
    },
    mainText: 'Certificamos que {{nome_participante}} participou do(a) {{tipo_participacao}} no {{nome_evento}}, realizado no período de {{data_evento}}, com carga horária de {{carga_horaria}} horas.',
    mainTextColor: '#374151',
    alignment: 'center'
  },
  footer: {
    locationDateText: 'Celebration/Florida – EUA, {{data_emissao}}',
    locationDateColor: '#4B5563',
    signatures: [
      {
        label: 'Reitor(a) – Veni Creator Christian University',
        name: '{{nome_reitor}}',
        signatureImageUrl: ''
      },
      {
        label: 'Coordenação Geral – III CIVENI 2025',
        name: '{{nome_coordenador}}',
        signatureImageUrl: ''
      }
    ]
  },
  badge: {
    enabled: true,
    position: 'bottom-right',
    text: 'III CIVENI 2025',
    backgroundGradient: {
      from: '#1e40af',
      to: '#dc2626'
    },
    textColor: '#FFFFFF'
  }
};

const sampleData = {
  nome_participante: 'Nome do Participante',
  tipo_participacao: 'Participante',
  nome_evento: 'III CIVENI 2025 – Celebration/Florida/EUA',
  data_evento: '11 a 13 de dezembro de 2025',
  carga_horaria: '20',
  data_emissao: '13 de dezembro de 2025',
  nome_reitor: 'Dr. João Silva',
  nome_coordenador: 'Dra. Maria Santos'
};

const CertificateTemplateDialog: React.FC<CertificateTemplateDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  initialConfig,
  eventId
}) => {
  const [config, setConfig] = useState(initialConfig || defaultConfig);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(config);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    setConfig((prev: any) => {
      const newConfig = { ...prev };
      let current = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl">
            Configurar Modelo de Certificado
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6 px-6 pb-6">
          {/* Formulário - Esquerda */}
          <ScrollArea className="h-[calc(95vh-120px)]">
            <div className="pr-4">
              <Tabs defaultValue="header" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="header">Cabeçalho</TabsTrigger>
                  <TabsTrigger value="body">Conteúdo</TabsTrigger>
                  <TabsTrigger value="footer">Rodapé</TabsTrigger>
                  <TabsTrigger value="style">Estilo</TabsTrigger>
                </TabsList>

                <TabsContent value="header" className="space-y-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.header.showLogo}
                      onCheckedChange={(checked) => updateConfig(['header', 'showLogo'], checked)}
                    />
                    <Label>Exibir logo</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={config.header.title}
                      onChange={(e) => updateConfig(['header', 'title'], e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor do título</Label>
                    <Input
                      type="color"
                      value={config.header.titleColor}
                      onChange={(e) => updateConfig(['header', 'titleColor'], e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      value={config.header.subtitle}
                      onChange={(e) => updateConfig(['header', 'subtitle'], e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor do subtítulo</Label>
                    <Input
                      type="color"
                      value={config.header.subtitleColor}
                      onChange={(e) => updateConfig(['header', 'subtitleColor'], e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="body" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Texto principal</Label>
                    <Textarea
                      value={config.body.mainText}
                      onChange={(e) => updateConfig(['body', 'mainText'], e.target.value)}
                      rows={6}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use: {'{'}nome_participante{'}'}, {'{'}tipo_participacao{'}'}, {'{'}nome_evento{'}'}, {'{'}data_evento{'}'}, {'{'}carga_horaria{'}'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor do texto</Label>
                    <Input
                      type="color"
                      value={config.body.mainTextColor}
                      onChange={(e) => updateConfig(['body', 'mainTextColor'], e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho do nome (px)</Label>
                    <Input
                      type="number"
                      value={config.body.participantNameStyle.fontSize}
                      onChange={(e) => updateConfig(['body', 'participantNameStyle', 'fontSize'], parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor do nome</Label>
                    <Input
                      type="color"
                      value={config.body.participantNameStyle.color}
                      onChange={(e) => updateConfig(['body', 'participantNameStyle', 'color'], e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="footer" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Texto de local e data</Label>
                    <Input
                      value={config.footer.locationDateText}
                      onChange={(e) => updateConfig(['footer', 'locationDateText'], e.target.value)}
                    />
                  </div>

                  {config.footer.signatures.map((sig: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium">Assinatura {index + 1}</h4>
                      
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={sig.name}
                          onChange={(e) => {
                            const newSigs = [...config.footer.signatures];
                            newSigs[index].name = e.target.value;
                            updateConfig(['footer', 'signatures'], newSigs);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cargo</Label>
                        <Input
                          value={sig.label}
                          onChange={(e) => {
                            const newSigs = [...config.footer.signatures];
                            newSigs[index].label = e.target.value;
                            updateConfig(['footer', 'signatures'], newSigs);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL da assinatura (opcional)</Label>
                        <Input
                          value={sig.signatureImageUrl || ''}
                          onChange={(e) => {
                            const newSigs = [...config.footer.signatures];
                            newSigs[index].signatureImageUrl = e.target.value;
                            updateConfig(['footer', 'signatures'], newSigs);
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="style" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Cor de fundo</Label>
                    <Input
                      type="color"
                      value={config.background.color}
                      onChange={(e) => updateConfig(['background', 'color'], e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.border.enabled}
                      onCheckedChange={(checked) => updateConfig(['border', 'enabled'], checked)}
                    />
                    <Label>Borda com gradiente</Label>
                  </div>

                  {config.border.enabled && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label>Cor inicial do gradiente</Label>
                        <Input
                          type="color"
                          value={config.border.gradient.from}
                          onChange={(e) => updateConfig(['border', 'gradient', 'from'], e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cor final do gradiente</Label>
                        <Input
                          type="color"
                          value={config.border.gradient.to}
                          onChange={(e) => updateConfig(['border', 'gradient', 'to'], e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Espessura (px)</Label>
                        <Input
                          type="number"
                          value={config.border.thickness}
                          onChange={(e) => updateConfig(['border', 'thickness'], parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.badge.enabled}
                      onCheckedChange={(checked) => updateConfig(['badge', 'enabled'], checked)}
                    />
                    <Label>Selo/Badge</Label>
                  </div>

                  {config.badge.enabled && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label>Texto do badge</Label>
                        <Input
                          value={config.badge.text}
                          onChange={(e) => updateConfig(['badge', 'text'], e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cor inicial do gradiente</Label>
                        <Input
                          type="color"
                          value={config.badge.backgroundGradient.from}
                          onChange={(e) => updateConfig(['badge', 'backgroundGradient', 'from'], e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cor final do gradiente</Label>
                        <Input
                          type="color"
                          value={config.badge.backgroundGradient.to}
                          onChange={(e) => updateConfig(['badge', 'backgroundGradient', 'to'], e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Modelo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </ScrollArea>

          {/* Preview - Direita */}
          <div className="border-l pl-6">
            <ScrollArea className="h-[calc(95vh-120px)]">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Preview em Tempo Real</h3>
                <CertificatePreview
                  layoutConfig={config}
                  sampleData={sampleData}
                  scale={0.5}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateTemplateDialog;
