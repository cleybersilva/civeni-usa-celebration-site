import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Save, 
  Settings, 
  Award,
  FileText,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import CertificatesList from './certificates/CertificatesList';
import CertificateTemplateDialog from './certificates/CertificateTemplateDialog';

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
  language?: string;
  layout_config?: any;
}

interface IssuedCertificate {
  id: string;
  event_id: string;
  registration_id: string;
  email: string;
  full_name: string;
  code: string;
  issued_at: string;
  pdf_url: string;
  keywords_matched: number;
  keywords_provided: string[];
  created_at: string;
}

const CertificateManager = () => {
  const { user, sessionToken } = useAdminAuth();
  const { toast } = useToast();
  
  console.log('[CertificateManager] Componente montado, user:', user?.email);
  
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
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateConfig, setTemplateConfig] = useState<any>(null);

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

  // Sincronizar templateConfig com layout_config quando config é carregado
  useEffect(() => {
    if (config.layout_config) {
      setTemplateConfig(config.layout_config);
    }
  }, [config.layout_config]);

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

    console.log('[CertificateManager] Carregando config para evento:', selectedEvent);

    const { data, error } = await supabase
      .from('event_certificates')
      .select('*')
      .eq('event_id', selectedEvent)
      .maybeSingle();

    if (error) {
      console.error('[CertificateManager] Erro ao carregar config:', error);
    }

    if (data) {
      console.log('[CertificateManager] Config carregada:', data);
      // Garante que keywords é array com 3 elementos
      const keywordsArray = Array.isArray(data.keywords) ? data.keywords : [];
      while (keywordsArray.length < 3) {
        keywordsArray.push('');
      }
      setConfig({
        ...data,
        keywords: keywordsArray.slice(0, 3)
      });
    } else {
      console.log('[CertificateManager] Nenhuma config encontrada, usando padrão');
      // Reset to default if no config exists
      setConfig({
        is_enabled: true,
        required_correct: 2,
        keywords: ['', '', ''],
        issuer_name: 'Coordenador Acadêmico',
        issuer_role: 'Coordenador',
        hours: '40h',
        city: 'Fortaleza',
        country: 'Brasil',
        timezone: 'America/Sao_Paulo'
      });
    }
  };

  const loadIssuedCertificates = async () => {
    if (!selectedEvent) return;

    const { data, error } = await supabase
      .from('issued_certificates')
      .select('*')
      .eq('event_id', selectedEvent)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('[CertificateManager] Erro ao carregar certificados emitidos:', error);
    }

    if (data) {
      setIssuedCertificates(data as IssuedCertificate[]);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    e?.preventDefault?.();

    if (!selectedEvent) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um evento antes de salvar as configurações."
      });
      return;
    }

    if (!user || !sessionToken) {
      toast({
        variant: "destructive",
        title: "Sessão inválida",
        description: "Sessão administrativa inválida. Faça login novamente."
      });
      return;
    }

    // Validação: required_correct deve estar entre 1 e 3
    const minKeywords = Number(config.required_correct ?? 2);
    if (minKeywords < 1 || minKeywords > 3) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O mínimo de acertos deve ser entre 1 e 3, pois existem 3 palavras-chave."
      });
      return;
    }

    // Filtrar e limpar palavras-chave (UI trabalha com 3, mas o banco exige 5)
    const cleanedKeywords = (config.keywords || ['', '', ''])
      .map(k => k?.trim() || '')
      .filter(k => k.length > 0);

    if (cleanedKeywords.length === 0) {
      toast({
        variant: "destructive",
        title: "Palavras-chave obrigatórias",
        description: "Você deve informar pelo menos uma palavra-chave."
      });
      return;
    }

    // Banco tem constraint CHECK (array_length(keywords, 1) = 5)
    // Então sempre enviamos exatamente 5 elementos, preenchendo com a última keyword informada
    const keywordsForDb = [...cleanedKeywords];
    while (keywordsForDb.length < 5) {
      keywordsForDb.push(cleanedKeywords[cleanedKeywords.length - 1]);
    }

    setLoading(true);
    try {
      const configData = {
        event_id: selectedEvent,
        is_enabled: !!config.is_enabled, // Garantir boolean
        required_correct: minKeywords, // Já validado acima
        keywords: keywordsForDb,
        issuer_name: (config.issuer_name || '').trim(),
        issuer_role: (config.issuer_role || '').trim(),
        issuer_signature_url: config.issuer_signature_url || null,
        hours: (config.hours || '').trim(),
        city: (config.city || '').trim(),
        country: (config.country || '').trim(),
        timezone: config.timezone || 'America/Sao_Paulo',
        template_id: config.template_id || null,
        // NÃO enviar layout_config aqui para preservar o template salvo em "Criar Certificado"
        // layout_config é gerenciado apenas pelo handleSaveTemplate
        language: config.language || 'pt-BR',
        admin_email: user.email,
        session_token: sessionToken
      };

      console.log('[CertificateManager] Salvando config via edge function:', configData);

      const { data, error } = await supabase.functions.invoke('save-certificate-config', {
        body: configData
      });

      if (error) {
        console.error('[CertificateManager] Erro ao salvar:', error);
        throw new Error(error.message || 'Erro ao comunicar com o servidor');
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Erro ao salvar configurações');
      }

      console.log('[CertificateManager] Config salva com sucesso:', data);

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!"
      });

      await loadCertificateConfig();
    } catch (error: any) {
      console.error('[CertificateManager] Erro ao salvar config:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error?.message || 'Não foi possível salvar as configurações de certificados.'
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
    // Not applicable for issued_certificates table - would need custom logic
    toast({
      variant: "destructive",
      title: "Não disponível",
      description: "Funcionalidade em desenvolvimento"
    });
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

  const handleSaveTemplate = async (layoutConfig: any, language?: string) => {
    if (!selectedEvent) return;

    try {
      // Preparar keywords no formato exigido pelo banco (sempre 5 posições)
      const cleanedKeywords = (config.keywords || ['', '', ''])
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      if (cleanedKeywords.length === 0) {
        toast({
          variant: "destructive",
          title: "Palavras-chave obrigatórias",
          description: "Defina ao menos uma palavra-chave nas configurações antes de salvar o modelo."
        });
        return;
      }

      const keywordsForDb = [...cleanedKeywords];
      while (keywordsForDb.length < 5) {
        keywordsForDb.push(cleanedKeywords[cleanedKeywords.length - 1]);
      }

      // Salvar layout_config, language e demais campos necessários para emissão
      const configData = {
        event_id: selectedEvent,
        is_enabled: !!config.is_enabled,
        required_correct: config.required_correct ?? 2,
        keywords: keywordsForDb,
        issuer_name: (config.issuer_name || '').trim(),
        issuer_role: (config.issuer_role || '').trim(),
        issuer_signature_url: config.issuer_signature_url || null,
        hours: (config.hours || '').trim(),
        city: (config.city || '').trim(),
        country: (config.country || '').trim(),
        timezone: config.timezone || 'America/Sao_Paulo',
        template_id: config.template_id || null,
        layout_config: layoutConfig,
        language: language || config.language || 'pt-BR'
      };

      const { data: existing } = await supabase
        .from('event_certificates')
        .select('id')
        .eq('event_id', selectedEvent)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('event_certificates')
          .update(configData)
          .eq('event_id', selectedEvent);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_certificates')
          .insert(configData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Modelo de certificado salvo com sucesso!"
      });

      loadCertificateConfig();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
      throw error;
    }
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
            onClick={() => setIsTemplateDialogOpen(true)}
            disabled={!selectedEvent}
            className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Certificado
          </Button>
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
                      value={config.required_correct ?? 2}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value >= 1 && value <= 3) {
                          setConfig(prev => ({
                            ...prev,
                            required_correct: value
                          }));
                        }
                      }}
                      className={
                        config.required_correct && (config.required_correct < 1 || config.required_correct > 3)
                          ? 'border-destructive'
                          : ''
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de acertos para emitir o certificado (de 3 palavras-chave)
                    </p>
                    {config.required_correct && (config.required_correct < 1 || config.required_correct > 3) && (
                      <p className="text-xs text-destructive">
                        O valor deve estar entre 1 e 3
                      </p>
                    )}
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
            <CertificatesList
              certificates={issuedCertificates}
              onToggleStatus={toggleCertificateStatus}
            />
          )}
        </>
      )}

      {/* Dialog de Criação/Edição de Template */}
      <CertificateTemplateDialog
        isOpen={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onSave={handleSaveTemplate}
        initialConfig={templateConfig}
        eventId={selectedEvent}
        currentLanguage={config.language || 'pt-BR'}
      />
    </div>
  );
};

export default CertificateManager;