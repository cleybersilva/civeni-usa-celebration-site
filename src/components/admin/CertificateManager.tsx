import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Save, 
  Settings, 
  Award,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface CertificateConfig {
  event_id: string;
  is_enabled: boolean;
  required_correct: number;
  keywords: string[];
  issuer_name: string;
  issuer_role: string;
  issuer_signature_url?: string;
  hours: string;
  city: string;
  country: string;
  timezone?: string;
  template_id?: string;
}

interface IssuedCertificate {
  id: string;
  user_email: string;
  hash: string;
  status: string;
  emitido_at: string;
  arquivo_url?: string;
  event_id: string;
  created_at: string;
}

const CertificateManager = () => {
  const { user, sessionToken } = useAdminAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [config, setConfig] = useState<Partial<CertificateConfig>>({
    is_enabled: true,
    required_correct: 2,
    keywords: ['', '', ''],
    issuer_name: 'Coordenador Acadêmico',
    issuer_role: 'Coordenador',
    hours: '40h',
    city: 'Fortaleza',
    country: 'Brasil'
  });
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [tab, setTab] = useState<'config' | 'certificates'>('config');

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      loadCertificateConfig();
      loadIssuedCertificates();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('id, slug')
        .eq('status_publicacao', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar eventos:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar eventos"
        });
        return;
      }
      
      if (data) {
        setEvents(data);
        if (data.length > 0 && !selectedEvent) {
          setSelectedEvent(data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadCertificateConfig = async () => {
    if (!selectedEvent) return;

    const { data } = await supabase
      .from('event_certificates')
      .select('*')
      .eq('event_id', selectedEvent)
      .single();

    if (data) {
      setConfig(data);
    } else {
      // Reset to default if no config exists
      setConfig({
        is_enabled: true,
        required_correct: 2,
        keywords: ['', '', ''],
        issuer_name: 'Coordenador Acadêmico',
        issuer_role: 'Coordenador',
        hours: '40h',
        city: 'Fortaleza',
        country: 'Brasil'
      });
    }
  };

  const loadIssuedCertificates = async () => {
    if (!selectedEvent) return;

    const { data } = await supabase
      .from('event_cert_issuances')
      .select('*')
      .eq('event_id', selectedEvent)
      .order('emitido_at', { ascending: false });

    if (data) {
      setIssuedCertificates(data as IssuedCertificate[]);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedEvent || !user || !sessionToken) return;

    setLoading(true);
    try {
      const configData = {
        event_id: selectedEvent,
        ...config,
        keywords: config.keywords?.filter(k => k.trim()) || []
      };

      // Check if config exists
      const { data: existing } = await supabase
        .from('event_certificates')
        .select('id')
        .eq('event_id', selectedEvent)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('event_certificates')
          .update(configData)
          .eq('event_id', selectedEvent);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('event_certificates')
          .insert(configData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configuração de certificados salva com sucesso!"
      });

      loadCertificateConfig();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...(config.keywords || ['', '', ''])];
    newKeywords[index] = value;
    setConfig(prev => ({ ...prev, keywords: newKeywords }));
  };

  const toggleCertificateStatus = async (certId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'issued' ? 'revoked' : 'issued';
    const { error } = await supabase
      .from('event_cert_issuances')
      .update({ status: newStatus })
      .eq('id', certId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar certificado"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Status do certificado atualizado"
      });
      loadIssuedCertificates();
    }
  };

  const handleExportConfig = () => {
    if (!selectedEvent || !config) return;
    
    const exportData = {
      config: {
        title: `Certificado de Participação`,
        keywords: config.keywords,
        required_correct: config.required_correct,
        issuer_name: config.issuer_name,
        issuer_role: config.issuer_role,
        hours: config.hours,
        city: config.city,
        country: config.country
      },
      template: {
        name: "Modelo Padrão Civeni",
        description: "Template padrão para certificados"
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado-config-${selectedEvent}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Sucesso",
      description: "Configuração exportada com sucesso!"
    });
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        if (importData.config) {
          setConfig(prev => ({
            ...prev,
            ...importData.config
          }));

          toast({
            title: "Sucesso",
            description: "Configuração importada com sucesso! Lembre-se de salvar."
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao importar arquivo. Verifique o formato."
        });
      }
    };
    input.click();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento de Certificados</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportConfig}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            disabled={!selectedEvent}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant={tab === 'config' ? 'default' : 'outline'}
            onClick={() => setTab('config')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button
            variant={tab === 'certificates' ? 'default' : 'outline'}
            onClick={() => setTab('certificates')}
          >
            <Award className="h-4 w-4 mr-2" />
            Certificados Emitidos
          </Button>
        </div>
      </div>

      {/* Seletor de Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Evento</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhum evento publicado encontrado. Publique um evento primeiro.
              </p>
            </div>
          ) : (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione um evento...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.slug}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {tab === 'config' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuração de Certificados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={config.is_enabled || false}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_enabled: checked }))}
                  />
                  <Label>Certificados habilitados para este evento</Label>
                </div>

                {/* Configurações básicas */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Palavras-chave corretas necessárias</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3}
                      value={config.required_correct || 2}
                      onChange={(e) => setConfig(prev => ({ ...prev, required_correct: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de acertos para emitir o certificado (de 3 palavras-chave)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Carga horária</Label>
                    <Input
                      value={config.hours || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, hours: e.target.value }))}
                      placeholder="40h"
                    />
                  </div>
                </div>

                {/* Informações do emissor */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do emissor</Label>
                    <Input
                      value={config.issuer_name || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, issuer_name: e.target.value }))}
                      placeholder="Dr. Coordenador Acadêmico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo do emissor</Label>
                    <Input
                      value={config.issuer_role || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, issuer_role: e.target.value }))}
                      placeholder="Coordenador do Evento"
                    />
                  </div>
                </div>

                {/* Local */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={config.city || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Fortaleza"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>País</Label>
                    <Input
                      value={config.country || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Brasil"
                    />
                  </div>
                </div>

                {/* Palavras-chave */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Palavras-chave do evento</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure as 3 palavras-chave que serão solicitadas durante a emissão do certificado.
                  </p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {(config.keywords || ['', '', '']).map((keyword, index) => (
                      <div key={index} className="space-y-2">
                        <Label>Palavra-chave {index + 1}</Label>
                        <Input
                          value={keyword}
                          onChange={(e) => updateKeyword(index, e.target.value)}
                          placeholder={`Digite a ${index + 1}ª palavra-chave`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleSaveConfig} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          )}

          {tab === 'certificates' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Certificados Emitidos
                  </div>
                  <Badge variant="secondary">
                    {issuedCertificates.length} certificados
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issuedCertificates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum certificado emitido ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {issuedCertificates.map(cert => (
                      <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{cert.user_email}</div>
                          <div className="text-xs text-muted-foreground">
                            Código: {cert.hash} | 
                            Emitido: {cert.emitido_at ? new Date(cert.emitido_at).toLocaleDateString('pt-BR') : 'N/A'}
                          </div>
                          {cert.arquivo_url && (
                            <a 
                              href={cert.arquivo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Ver PDF
                            </a>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={cert.status === 'issued' ? 'default' : 'destructive'}>
                            {cert.status === 'issued' ? 'Válido' : 'Revogado'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCertificateStatus(cert.id, cert.status)}
                          >
                            {cert.status === 'issued' ? 'Revogar' : 'Revalidar'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CertificateManager;