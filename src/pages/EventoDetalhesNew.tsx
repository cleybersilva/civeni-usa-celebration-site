import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Share2, 
  Download, 
  ExternalLink, 
  Youtube, 
  Award,
  Globe,
  FileText,
  Image,
  Video,
  Link2,
  Phone,
  ChevronLeft,
  PlayCircle
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEventBySlugNew, getEventStatus, canRegister } from '@/hooks/useEventsNew';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventoDetalhesNew = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { event, loading } = useEventBySlugNew(slug || '');

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

  const getModalidadeBadge = (mode: string) => {
    const colors = {
      online: 'bg-blue-100 text-blue-800',
      presencial: 'bg-green-100 text-green-800',
      hibrido: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge variant="outline" className={`text-base px-3 py-1 ${colors[mode as keyof typeof colors] || ''}`}>
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
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
          title: event.title,
          text: event.subtitle,
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
    
    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
    
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
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.short_description || event.subtitle || ''}`,
      event.address ? `LOCATION:${event.address}` : '',
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

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
      case 'banner':
      case 'galeria':
        return Image;
      case 'video_youtube':
      case 'playlist_youtube':
        return Youtube;
      case 'pdf':
        return FileText;
      case 'audio':
        return PlayCircle;
      case 'link_externo':
        return Link2;
      default:
        return FileText;
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

  const eventStatus = getEventStatus(event);
  const isPastEvent = eventStatus === 'past';
  const canUserRegister = canRegister(event);

  // Group media by type
  const mediaByType = event.media?.reduce((acc: any, media: any) => {
    if (!acc[media.type]) acc[media.type] = [];
    acc[media.type].push(media);
    return acc;
  }, {});

  const primaryBanner = event.media?.find(m => m.is_primary && (m.type === 'banner' || m.type === 'image'));
  const youtubeVideos = mediaByType?.video_youtube || [];
  const youtubePlaylists = mediaByType?.playlist_youtube || [];
  const images = [...(mediaByType?.image || []), ...(mediaByType?.galeria || [])];
  const pdfs = mediaByType?.pdf || [];
  const externalLinks = mediaByType?.link_externo || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue via-blue-700 to-purple-800 text-white py-12">
        <div className="absolute inset-0 bg-black/20"></div>
        {(event.cover_image_url || primaryBanner) && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${event.cover_image_url || primaryBanner?.url})` }}
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
              <li className="line-clamp-1">{event.title}</li>
            </ol>
          </nav>
          
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-3 mb-6">
              {getStatusBadge(event)}
              {getModalidadeBadge(event.mode)}
              {event.is_featured && (
                <Badge variant="secondary" className="text-base px-3 py-1 bg-yellow-100 text-yellow-800">
                  <Award className="h-4 w-4 mr-1" />
                  Em Destaque
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {event.title}
            </h1>
            
            {event.subtitle && (
              <p className="text-xl text-blue-100 mb-4 leading-relaxed">
                {event.subtitle}
              </p>
            )}

            {event.short_description && (
              <p className="text-lg text-blue-200 mb-6 leading-relaxed">
                {event.short_description}
              </p>
            )}
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {event.flags?.show_share_buttons && (
                <>
                  <Button onClick={generateCalendarFile} variant="secondary" size="lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Adicionar ao Calendário
                  </Button>
                  
                  <Button onClick={handleShare} variant="secondary" size="lg">
                    <Share2 className="h-5 w-5 mr-2" />
                    Compartilhar
                  </Button>
                </>
              )}
              
              {youtubePlaylists.length > 0 && (
                <Button variant="secondary" size="lg" asChild>
                  <a href={youtubePlaylists[0].url} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-5 w-5 mr-2" />
                    Ver Playlist
                  </a>
                </Button>
              )}

              {youtubeVideos.length > 0 && (
                <Button variant="secondary" size="lg" asChild>
                  <a href={youtubeVideos[0].url} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-5 w-5 mr-2" />
                    {isPastEvent ? 'Ver Gravação' : 'Assistir Ao Vivo'}
                  </a>
                </Button>
              )}
              
              {canUserRegister && (
                <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                  <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    {event.registration_cta_label || 'Inscrever-se'}
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
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Data</p>
                      <p className="text-gray-600">{formatEventDate(event.start_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-gray-600">
                        {formatEventTime(event.start_at)}
                        {event.end_at && ` - ${formatEventTime(event.end_at)}`}
                        <span className="text-sm text-gray-500 ml-2">({event.timezone})</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Modalidade</p>
                      <p className="text-gray-600 capitalize">{event.mode}</p>
                    </div>
                  </div>

                  {(event.venue_name || event.address) && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Local</p>
                        <p className="text-gray-600">
                          {event.venue_name && <span className="font-medium">{event.venue_name}</span>}
                          {event.venue_name && event.address && <br />}
                          {event.address}
                          {event.city && `, ${event.city}`}
                          {event.state && `, ${event.state}`}
                        </p>
                        {event.map_url && (
                          <a 
                            href={event.map_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-civeni-blue hover:underline text-sm mt-1 inline-block"
                          >
                            Ver no mapa
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {event.full_description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Sobre o Evento</h3>
                      <div 
                        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: event.full_description }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Media Gallery */}
            {images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-6 w-6 text-civeni-blue" />
                    Galeria de Imagens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {images.map((media: any) => (
                      <div key={media.id} className="group cursor-pointer">
                        <img 
                          src={media.url} 
                          alt={media.title || 'Imagem do evento'}
                          className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
                        />
                        {media.title && (
                          <p className="mt-2 text-sm text-gray-600 text-center">{media.title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* YouTube Content */}
            {(youtubeVideos.length > 0 || youtubePlaylists.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-6 w-6 text-civeni-blue" />
                    Conteúdo em Vídeo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {youtubePlaylists.map((media: any) => (
                    <div key={media.id} className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">{media.title || 'Playlist do YouTube'}</h5>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={media.url} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4 mr-2" />
                          Ver Playlist Completa
                        </a>
                      </Button>
                    </div>
                  ))}
                  
                  {youtubeVideos.map((media: any) => (
                    <div key={media.id} className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">{media.title || 'Vídeo do YouTube'}</h5>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={media.url} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4 mr-2" />
                          {isPastEvent ? 'Ver Gravação' : 'Assistir Ao Vivo'}
                        </a>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Documents and Links */}
            {(pdfs.length > 0 || externalLinks.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-civeni-blue" />
                    Documentos e Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pdfs.map((media: any) => {
                    const MediaIcon = getMediaIcon(media.type);
                    return (
                      <div key={media.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MediaIcon className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium">{media.title}</p>
                            {media.description && <p className="text-sm text-gray-600">{media.description}</p>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={media.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                  
                  {externalLinks.map((media: any) => {
                    const MediaIcon = getMediaIcon(media.type);
                    return (
                      <div key={media.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MediaIcon className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{media.title}</p>
                            {media.description && <p className="text-sm text-gray-600">{media.description}</p>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={media.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-700">Status</p>
                  <div className="mt-1">{getStatusBadge(event)}</div>
                </div>
                
                {event.has_registration && event.registration_url && (
                  <div className="pt-2">
                    {canUserRegister ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                        <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {event.registration_cta_label}
                        </a>
                      </Button>
                    ) : (
                      <div className="text-center p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">
                          {isPastEvent ? 'Inscrições encerradas' : 'Inscrições não disponíveis'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {event.official_site_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={event.official_site_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Site Oficial
                    </a>
                  </Button>
                )}

                {event.whatsapp_group_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={event.whatsapp_group_url} target="_blank" rel="noopener noreferrer">
                      <Phone className="h-4 w-4 mr-2" />
                      Grupo WhatsApp
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* SEO Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compartilhamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="font-medium text-sm text-gray-700">URL do Evento</label>
                  <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                    {window.location.href}
                  </p>
                </div>

                {event.flags?.show_share_buttons && (
                  <div className="flex gap-2">
                    <Button onClick={handleShare} variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button onClick={generateCalendarFile} variant="outline" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendário
                    </Button>
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

export default EventoDetalhesNew;