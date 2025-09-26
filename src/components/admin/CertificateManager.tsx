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
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface CertificateConfig {
  id: string;
  event_id: string;
  is_enabled: boolean;
  required_correct: number;
  keywords: string[];
  issuer_name: string;
  issuer_role: string;
  hours: string;
  city: string;
  country: string;
  certificate_template_url?: string;
  background_image_url?: string;
  logo_url?: string;
  signature_image_url?: string;
}

interface IssuedCertificate {
  id: string;
  email: string;
  full_name: string;
  code: string;
  keywords_matched: number;
  issued_at: string;
  is_valid?: boolean | null;
  event_id: string;
  registration_id?: string;
  pdf_url?: string;
  keywords_provided?: string[];
  created_at: string;
  verified_at?: string | null;
}

const CertificateManager = () => {
  const { user, sessionToken } = useAdminAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [config, setConfig] = useState<Partial<CertificateConfig>>({
    is_enabled: true,
    required_correct: 4,
    keywords: ['', '', '', '', ''],
    issuer_name: 'Coordenador Acadêmico',
    issuer_role: 'Coordenador',
    hours: '40h',
    city: 'Fortaleza',
    country: 'Brasil'
  });
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'config' | 'certificates'>('config');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadCertificateConfig();
      loadIssuedCertificates();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, slug')
      .eq('status_publicacao', 'published')
      .order('created_at', { ascending: false });
    
    if (data) {
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
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
        required_correct: 4,
        keywords: ['', '', '', '', ''],
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
      .from('issued_certificates')
      .select('*')
      .eq('event_id', selectedEvent)
      .order('issued_at', { ascending: false });

    if (data) {
      setIssuedCertificates(data.map(cert => ({
        ...cert,
        is_valid: (cert as any).is_valid ?? true, // Default to true if null
        verified_at: (cert as any).verified_at
      } as IssuedCertificate)));
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
    const newKeywords = [...(config.keywords || ['', '', '', '', ''])];
    newKeywords[index] = value;
    setConfig(prev => ({ ...prev, keywords: newKeywords }));
  };

  const toggleCertificateValidity = async (certId: string, isValid: boolean) => {
    const { error } = await supabase
      .from('issued_certificates')
      .update({ is_valid: !isValid } as any)
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

  if (!user) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento de Certificados</h2>
        <div className="flex items-center space-x-2">
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
                      max={5}
                      value={config.required_correct || 4}
                      onChange={(e) => setConfig(prev => ({ ...prev, required_correct: parseInt(e.target.value) }))}
                    />
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
                    Configure as 5 palavras-chave que serão solicitadas durante a emissão do certificado.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {(config.keywords || ['', '', '', '', '']).map((keyword, index) => (
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
                          <div className="font-medium">{cert.full_name}</div>
                          <div className="text-sm text-muted-foreground">{cert.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Código: {cert.code} | 
                            Acertos: {cert.keywords_matched}/5 | 
                            Emitido: {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={cert.is_valid ? 'default' : 'destructive'}>
                            {cert.is_valid ? 'Válido' : 'Inválido'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCertificateValidity(cert.id, cert.is_valid)}
                          >
                            {cert.is_valid ? 'Invalidar' : 'Revalidar'}
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