import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Share2, ExternalLink, Youtube, ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEventBySlug } from '@/hooks/useEvents';

const EventoDetalhesSimples = () => {
  const { slug } = useParams();
  const { event, loading } = useEventBySlug(slug || '');

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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.titulo,
          text: event.subtitulo,
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

  const eventStatus = getEventStatus(event);
  const isPastEvent = eventStatus === 'past';

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

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
            <p className="text-gray-600 mb-8">O evento que você procura não existe ou foi removido.</p>
            <Link to="/eventos">
              <Button>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar para Eventos
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-12">
        <div className="absolute inset-0 bg-black/20"></div>
        
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
              {event.featured && (
                <Badge variant="secondary" className="text-base px-3 py-1 bg-yellow-100 text-yellow-800">
                  Em Destaque
                </Badge>
              )}
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
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Informações do Evento
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
                        <span className="text-sm text-gray-500 ml-2">({event.timezone})</span>
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
                
                {event.descricao_richtext && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-3">Sobre o Evento</h3>
                    <div 
                      className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: event.descricao_richtext }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.tem_inscricao && event.inscricao_url && (
                  <div>
                    {!isPastEvent ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                        <a href={event.inscricao_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Inscrever-se
                        </a>
                      </Button>
                    ) : (
                      <div className="text-center p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Inscrições encerradas</p>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={handleShare} variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </CardContent>
            </Card>

            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-700">Status</p>
                  <div className="mt-1">{getStatusBadge(event)}</div>
                </div>
                
                <div className="text-sm">
                  <p className="font-medium text-gray-700">Modalidade</p>
                  <div className="mt-1">{getModalidadeBadge(event.modalidade)}</div>
                </div>

                {event.featured && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Destaque</p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Evento em Destaque
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Back to Events */}
            <Card>
              <CardContent className="pt-6">
                <Link to="/eventos">
                  <Button variant="outline" className="w-full">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Ver Todos os Eventos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventoDetalhesSimples;