import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Calendar, BookOpen, Users, Video, Mail, Link as LinkIcon } from 'lucide-react';
import { createSafeHtml } from '@/utils/sanitizeHtml';
import { useToast } from '@/hooks/use-toast';
import { useParticipantTypes } from '@/hooks/useParticipantTypes';

interface WorkContent {
  id: string;
  content_type: string;
  title_pt?: string;
  title_en?: string;
  title_es?: string;
  content_pt?: string;
  content_en?: string;
  content_es?: string;
  file_url?: string;
  file_name?: string;
  link_url?: string;
  order_index: number;
}

interface VideoSubmissionData {
  fullName: string;
  email: string;
  participantType: string;
  submissionType: 'video_link' | 'video_email';
  videoLink?: string;
  message?: string;
}

const EnvioVideos = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { participantTypes } = useParticipantTypes();
  const [content, setContent] = useState<WorkContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<VideoSubmissionData>({
    fullName: '',
    email: '',
    participantType: '',
    submissionType: 'video_link',
    videoLink: '',
    message: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('work_content')
        .select('*')
        .eq('work_type', 'envio_videos')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('video_submissions')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          participant_type: formData.participantType,
          submission_type: formData.submissionType,
          video_link: formData.submissionType === 'video_link' ? formData.videoLink : null,
          message: formData.message || null
        });

      if (error) throw error;

      toast({
        title: "Envio realizado com sucesso!",
        description: "Seu vídeo foi enviado e será analisado pela nossa equipe.",
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        participantType: '',
        submissionType: 'video_link',
        videoLink: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting video:', error);
      toast({
        title: "Erro ao enviar vídeo",
        description: "Tente novamente em alguns momentos.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getLocalizedContent = (item: WorkContent, field: 'title' | 'content') => {
    const lang = i18n.language;
    if (lang === 'en') return item[`${field}_en`] || item[`${field}_pt`];
    if (lang === 'es') return item[`${field}_es`] || item[`${field}_pt`];
    return item[`${field}_pt`];
  };

  const renderContentItem = (item: WorkContent) => {
    const title = getLocalizedContent(item, 'title');
    const content = getLocalizedContent(item, 'content');

    switch (item.content_type) {
      case 'text':
        return (
          <Card key={item.id} className="mb-6">
            {title && (
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {title}
                </CardTitle>
              </CardHeader>
            )}
            {content && (
              <CardContent>
                <div dangerouslySetInnerHTML={createSafeHtml(content)} />
              </CardContent>
            )}
          </Card>
        );

      case 'file':
        return (
          <Card key={item.id} className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Download className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">{title || item.file_name}</h3>
                  {content && <p className="text-sm text-muted-foreground">{content}</p>}
                </div>
                {item.file_url && (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {t('common.download', 'Download')}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'link':
        return (
          <Card key={item.id} className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ExternalLink className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">{title}</h3>
                  {content && <p className="text-sm text-muted-foreground">{content}</p>}
                </div>
                {item.link_url && (
                  <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {t('common.access', 'Acessar')}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'image':
        return (
          <Card key={item.id} className="mb-6">
            {title && (
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
            )}
            <CardContent>
              {item.file_url && (
                <img
                  src={item.file_url}
                  alt={title || ''}
                  className="w-full h-auto rounded-lg"
                />
              )}
              {content && (
                <div className="mt-4" dangerouslySetInnerHTML={createSafeHtml(content)} />
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/submissao-trabalhos" className="hover:text-blue-200 transition-colors">Trabalhos</Link></li>
              <li className="text-blue-200">›</li>
              <li>Envio de Vídeos</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Envio de Vídeos
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Modalidade de envio de vídeos para o III CIVENI 2025 - 
              Compartilhe suas apresentações e trabalhos em formato audiovisual
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#envio-videos">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Enviar Vídeo
                </button>
              </a>
              
              <Link to="/inscricoes">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins flex items-center justify-center gap-3">
                <Video className="w-8 h-8 text-civeni-blue" />
                Envio de Vídeos
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Envie suas apresentações e trabalhos em formato audiovisual
              </p>
            </div>

            <Tabs defaultValue="video-link" className="w-full" id="envio-videos">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="video-link" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Link de Vídeos
                </TabsTrigger>
                <TabsTrigger value="video-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Vídeo via E-mail
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video-link" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Envio via Link de Vídeo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Nome Completo *</Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="participantType">Tipo de Participante *</Label>
                        <Select 
                          value={formData.participantType} 
                          onValueChange={(value) => setFormData({...formData, participantType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de participante" />
                          </SelectTrigger>
                          <SelectContent>
                            {participantTypes.map((type) => (
                              <SelectItem key={type.id} value={type.type_name}>
                                {type.type_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="videoLink">Link do Vídeo *</Label>
                        <Input
                          id="videoLink"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={formData.videoLink}
                          onChange={(e) => setFormData({...formData, videoLink: e.target.value, submissionType: 'video_link'})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Mensagem (Opcional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Adicione informações adicionais sobre seu vídeo..."
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                      </div>

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? "Enviando..." : "Enviar Vídeo"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="video-email" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Envio via E-mail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold text-blue-900 mb-2">Instruções para Envio por E-mail</h4>
                      <p className="text-blue-800 text-sm">
                        Envie seu vídeo diretamente para: <strong>academic_paper@civeni.com</strong>
                      </p>
                      <p className="text-blue-700 text-sm mt-2">
                        Preencha o formulário abaixo para registrar seu envio no sistema.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Nome Completo *</Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="participantType">Tipo de Participante *</Label>
                        <Select 
                          value={formData.participantType} 
                          onValueChange={(value) => setFormData({...formData, participantType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de participante" />
                          </SelectTrigger>
                          <SelectContent>
                            {participantTypes.map((type) => (
                              <SelectItem key={type.id} value={type.type_name}>
                                {type.type_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="message">Mensagem *</Label>
                        <Textarea
                          id="message"
                          placeholder="Descreva seu vídeo e confirme o envio para academic_paper@civeni.com..."
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value, submissionType: 'video_email'})}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? "Registrando..." : "Registrar Envio por E-mail"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando informações...</p>
              </div>
            )}

            {content.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">Informações Adicionais</h3>
                {content.map(renderContentItem)}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EnvioVideos;