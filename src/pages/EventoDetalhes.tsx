import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Users, Share2, Download, ExternalLink, Youtube, Award } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEventBySlug } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventoDetalhes = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
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
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: ptBR });
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

  if (!event) {
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/eventos" className="w-full">
                  <Button variant="outline" className="w-full">
                    Voltar para Eventos
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

export default EventoDetalhes;