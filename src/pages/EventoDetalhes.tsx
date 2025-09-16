import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Share2, ExternalLink, Youtube, Award, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventoDetalhes = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar evento
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('status_publicacao', 'published')
          .single();

        if (eventError || !eventData) {
          setError('Evento não encontrado');
          setEvent(null);
          return;
        }

        // Buscar tradução
        const { data: translationData } = await supabase
          .from('event_translations')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('idioma', 'pt-BR')
          .maybeSingle();

        // Combinar dados
        const fullEvent = {
          ...eventData,
          titulo: translationData?.titulo || slug?.replace(/-/g, ' ').toUpperCase() || 'Evento',
          subtitulo: translationData?.subtitulo || '',
          descricao_richtext: translationData?.descricao_richtext || '',
        };

        setEvent(fullEvent);
      } catch (err: any) {
        setError('Erro ao carregar evento');
        console.error('Erro ao carregar evento:', err);
        console.log('Slug usado na query:', slug);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [slug]);

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.inicio_at);
    const endDate = event.fim_at ? new Date(event.fim_at) : startDate;

    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'live';
    return 'past';
  };

  const getStatusBadge = (event: any) => {
    const status = getEventStatus(event);
    const variants = {
      upcoming: 'default',
      live: 'destructive',
      past: 'secondary'
    };
    const labels = {
      upcoming: 'Próximo',
      live: 'Ao Vivo',
      past: 'Encerrado'
    };
    
    return (
      <Badge variant={variants[status] as any} className="text-base px-3 py-1">
        {labels[status]}
      </Badge>
    );
  };

  const getModalidadeBadge = (modalidade: string) => {
    const colors = {
      online: 'bg-blue-100 text-blue-800',
      presencial: 'bg-green-100 text-green-800',
      hibrido: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge variant="outline" className={`text-base px-3 py-1 ${colors[modalidade as keyof typeof colors] || ''}`}>
        {modalidade?.charAt(0).toUpperCase() + modalidade?.slice(1)}
      </Badge>
    );
  };

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: ptBR });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.titulo || 'Evento CIVENI',
          text: event?.subtitulo || '',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civeni-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando evento...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
            <p className="text-gray-600 mb-8">O evento que você procura não existe ou foi removido.</p>
            <Link to="/eventos">
              <Button>Voltar para Eventos</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const eventStatus = getEventStatus(event);
  const isPastEvent = eventStatus === 'past';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section - Same style as Eventos page */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        {event.banner_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${event.banner_url})` }}
          ></div>
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/eventos" className="hover:text-blue-200 transition-colors">Eventos</Link></li>
              <li className="text-blue-200">›</li>
              <li className="line-clamp-1">{event.titulo}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              {getStatusBadge(event)}
              {getModalidadeBadge(event.modalidade)}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              {event.titulo}
            </h1>
            
            {event.subtitulo && (
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
                {event.subtitulo}
              </p>
            )}
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/eventos">
                <Button variant="secondary" size="lg" className="bg-white text-civeni-blue hover:bg-white/90">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar para Eventos
                </Button>
              </Link>
              
              <Button onClick={handleShare} variant="secondary" size="lg" className="border-white text-white hover:bg-white/20 border-2">
                <Share2 className="h-5 w-5 mr-2" />
                Compartilhar
              </Button>
              
              {event.youtube_url && (
                <Button size="lg" className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90" asChild>
                  <a href={event.youtube_url} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-5 w-5 mr-2" />
                    {isPastEvent ? 'Ver Gravação' : 'Assistir Ao Vivo'}
                  </a>
                </Button>
              )}
              
              {event.tem_inscricao && event.inscricao_url && !isPastEvent && (
                <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                  <a href={event.inscricao_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Inscrever-se
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="bg-gradient-to-r from-civeni-blue/5 to-civeni-red/5">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Calendar className="h-6 w-6 text-civeni-blue" />
                  Detalhes do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-civeni-blue/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-civeni-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Data</p>
                      <p className="text-gray-700">{formatEventDate(event.inicio_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-civeni-red/10 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-civeni-red" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Horário</p>
                      <p className="text-gray-700">
                        {formatEventTime(event.inicio_at)}
                        {event.fim_at && ` - ${formatEventTime(event.fim_at)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Modalidade</p>
                      <p className="text-gray-700 capitalize">{event.modalidade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Fuso Horário</p>
                      <p className="text-gray-700">{event.timezone || 'America/Sao_Paulo'}</p>
                    </div>
                  </div>
                  
                  {event.endereco && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg md:col-span-2">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Local</p>
                        <p className="text-gray-700">{event.endereco}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator className="my-6" />
                
                {event.descricao_richtext ? (
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-civeni-blue to-civeni-red rounded-full"></div>
                      Descrição do Evento
                    </h3>
                    <div 
                      className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-civeni-blue"
                      dangerouslySetInnerHTML={{ __html: event.descricao_richtext }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Descrição detalhada em breve</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card className="overflow-hidden border-2 border-civeni-blue/20">
              <CardHeader className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white">
                <CardTitle className="text-white">Ações Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <Link to="/eventos">
                  <Button variant="outline" size="sm" className="w-full border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Eventos
                  </Button>
                </Link>
                
                <Button onClick={handleShare} variant="outline" size="sm" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar Evento
                </Button>
                
                {event.youtube_url && (
                  <Button size="sm" className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90" asChild>
                    <a href={event.youtube_url} target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-4 w-4 mr-2" />
                      {isPastEvent ? 'Ver Gravação' : 'Transmissão Ao Vivo'}
                    </a>
                  </Button>
                )}

                {event.tem_inscricao && event.inscricao_url && !isPastEvent && (
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <a href={event.inscricao_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Inscrever-se Agora
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-civeni-blue" />
                  Resumo do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                    <span className="font-semibold text-gray-900">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                    <span className="font-semibold text-gray-900">Modalidade:</span>
                    {getModalidadeBadge(event.modalidade)}
                  </div>

                  {event.tem_inscricao && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                      <span className="font-semibold text-gray-900">Inscrições:</span>
                      <Badge className="bg-green-100 text-green-800">Abertas</Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                    <span className="font-semibold text-gray-900">Evento:</span>
                    <Badge variant="outline" className="border-civeni-blue text-civeni-blue">CIVENI 2025</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventoDetalhes;