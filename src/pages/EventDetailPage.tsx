import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Share2, ExternalLink, Youtube, Award, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEventDetails } from '@/hooks/useEventDetails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventDetailPage = () => {
  console.log('=== EventDetailPage RENDERING ===');
  const { slug } = useParams();
  console.log('=== SLUG FROM PARAMS:', slug);
  const { event, loading, error } = useEventDetails(slug || '');
  console.log('=== HOOK RESULT - Event:', event, 'Loading:', loading, 'Error:', error);

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
        {modalidade.charAt(0).toUpperCase() + modalidade.slice(1)}
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
          title: event?.titulo,
          text: event?.subtitulo,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!slug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">URL inválida</h1>
            <p className="text-gray-600 mb-8">Não foi possível identificar o evento.</p>
            <Link to="/eventos">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Eventos
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civeni-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando evento...</p>
            <p className="mt-2 text-sm text-gray-500">Slug: {slug}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Erro ao carregar evento</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link to="/eventos">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Eventos
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
            <p className="text-gray-600 mb-8">O evento que você procura não existe ou foi removido.</p>
            <p className="text-sm text-gray-500 mb-4">Slug procurado: {slug}</p>
            <Link to="/eventos">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Eventos
              </Button>
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
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue via-blue-700 to-purple-800 text-white py-12">
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
          
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-3 mb-6">
              {getStatusBadge(event)}
              {getModalidadeBadge(event.modalidade)}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {event.titulo}
            </h1>
            
            {event.subtitulo && (
              <p className="text-xl text-blue-100 mb-6 leading-relaxed">
                {event.subtitulo}
              </p>
            )}
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleShare} variant="secondary" size="lg">
                <Share2 className="h-5 w-5 mr-2" />
                Compartilhar
              </Button>
              
              {event.youtube_url && (
                <Button variant="secondary" size="lg" asChild>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-civeni-blue" />
                  Detalhes do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Data</p>
                      <p className="text-gray-600">{formatEventDate(event.inicio_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-gray-600">
                        {formatEventTime(event.inicio_at)}
                        {event.fim_at && ` - ${formatEventTime(event.fim_at)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Modalidade</p>
                      <p className="text-gray-600 capitalize">{event.modalidade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Fuso Horário</p>
                      <p className="text-gray-600">{event.timezone || 'America/Sao_Paulo'}</p>
                    </div>
                  </div>
                  
                  {event.endereco && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Local</p>
                        <p className="text-gray-600">{event.endereco}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {event.descricao_richtext && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Descrição</h3>
                    <div 
                      className="prose prose-gray max-w-none"
                      dangerouslySetInnerHTML={{ __html: event.descricao_richtext }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media & Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-6 w-6 text-civeni-blue" />
                  Mídia e Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.banner_url && (
                  <div>
                    <h4 className="font-medium mb-2">Banner do Evento</h4>
                    <img 
                      src={event.banner_url} 
                      alt={`Banner - ${event.titulo}`}
                      className="w-full max-w-md rounded-lg border"
                    />
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {event.youtube_url && (
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">YouTube</h5>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={event.youtube_url} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4 mr-2" />
                          {isPastEvent ? 'Ver Gravação' : 'Transmissão Ao Vivo'}
                        </a>
                      </Button>
                    </div>
                  )}

                  {event.playlist_url && (
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Playlist</h5>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={event.playlist_url} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4 mr-2" />
                          Ver Playlist
                        </a>
                      </Button>
                    </div>
                  )}

                  {event.tem_inscricao && event.inscricao_url && (
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Inscrições</h5>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={event.inscricao_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Fazer Inscrição
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {!event.youtube_url && !event.playlist_url && !event.inscricao_url && (
                  <div className="text-center py-4 text-gray-500">
                    <p>Nenhuma mídia ou link adicional disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Status do Evento</p>
                  {getStatusBadge(event)}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data:</span>
                    <span className="text-sm font-medium">{formatEventDate(event.inicio_at)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Modalidade:</span>
                    <span className="text-sm font-medium capitalize">{event.modalidade}</span>
                  </div>
                  
                  {event.endereco && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Local:</span>
                      <span className="text-sm font-medium text-right">{event.endereco}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/eventos" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Eventos
                  </Button>
                </Link>
                
                {isPastEvent && (
                  <Link to={`/eventos/${event.slug}/certificado`} className="w-full">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Award className="h-4 w-4 mr-2" />
                      Baixar Certificado
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EventDetailPage;