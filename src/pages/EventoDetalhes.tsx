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

  const generateCalendarFile = () => {
    if (!event) return;
    
    const startDate = new Date(event.inicio_at);
    const endDate = event.fim_at ? new Date(event.fim_at) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CIVENI//Event Calendar//PT',
      'BEGIN:VEVENT',
      `UID:${event.id}@civeni.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${event.titulo}`,
      `DESCRIPTION:${event.subtitulo || ''}`,
      event.endereco ? `LOCATION:${event.endereco}` : '',
      `URL:${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.slug}.ics`;
    link.click();
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
              <Button onClick={generateCalendarFile} variant="secondary" size="lg">
                <Calendar className="h-5 w-5 mr-2" />
                Adicionar ao Calendário
              </Button>
              
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

            {/* Speakers Section */}
            {event.speakers && event.speakers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-civeni-blue" />
                    Palestrantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {event.speakers.map((speaker: any) => (
                      <div key={speaker.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        {speaker.image_url && (
                          <img
                            src={speaker.image_url}
                            alt={speaker.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold">{speaker.name}</h4>
                          <p className="text-sm text-gray-600">{speaker.title}</p>
                          <p className="text-sm text-gray-500">{speaker.institution}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule/Sessions */}
            {event.sessions && event.sessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-civeni-blue" />
                    Programação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.sessions.map((session: any) => (
                      <div key={session.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="text-sm font-medium text-civeni-blue min-w-20">
                          {formatEventTime(session.inicio_at)}
                          {session.fim_at && ` - ${formatEventTime(session.fim_at)}`}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{session.titulo}</h4>
                          {session.descricao && (
                            <p className="text-gray-600 text-sm">{session.descricao}</p>
                          )}
                          {session.speaker_name && (
                            <p className="text-civeni-blue text-sm mt-1">
                              Palestrante: {session.speaker_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Certificate Section - Only for past events */}
            {isPastEvent && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Award className="h-6 w-6" />
                    Certificado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-green-700 text-sm">
                    Este evento já foi realizado. Se você participou, pode baixar seu certificado.
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Certificado
                    </Button>
                    <p className="text-xs text-green-600">
                      * Não use e-mail profissional. Verifique sua caixa de SPAM.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={generateCalendarFile} variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar .ics
                </Button>
                
                <Button onClick={handleShare} variant="outline" size="sm" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                
                {event.youtube_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={event.youtube_url} target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-4 w-4 mr-2" />
                      YouTube
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Modalidade:</span>
                    <span className="capitalize text-gray-600">{event.modalidade}</span>
                  </div>

                  {event.tem_inscricao && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Aceita Inscrições:</span>
                      <Badge variant="default">Sim</Badge>
                    </div>
                  )}
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