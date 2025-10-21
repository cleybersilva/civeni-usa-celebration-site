import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Play, Calendar, Clock, MapPin, ExternalLink, Users, Video } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { pickLang, formatTimezone } from '@/hooks/useTransmission';

const TransmissaoDetalhes = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;

  // Fetch transmission by slug
  const { data: transmission, isLoading } = useQuery({
    queryKey: ['transmission-details', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['transmission-rooms', transmission?.id],
    queryFn: async () => {
      if (!transmission?.id) return [];
      const { data, error } = await supabase
        .from('transmission_rooms')
        .select('*')
        .eq('transmission_id', transmission.id)
        .order('ord');

      if (error) throw error;
      return data || [];
    },
    enabled: !!transmission?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!transmission) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Transmissão não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            A transmissão que você está procurando não existe ou não está disponível.
          </p>
          <Button onClick={() => navigate('/transmissao-ao-vivo')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Transmissões
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const title = pickLang(transmission.title as Record<string, string>, locale);
  const subtitle = pickLang(transmission.subtitle as Record<string, string>, locale);
  const description = pickLang(transmission.description as Record<string, string>, locale);
  const badgeLabel = pickLang(transmission.badge_label as Record<string, string>, locale);

  const now = new Date();
  const startAt = transmission.start_at ? new Date(transmission.start_at) : null;
  const endAt = transmission.end_at ? new Date(transmission.end_at) : null;

  // Status badge
  let statusBadge = null;
  if (transmission.status === 'live') {
    statusBadge = <Badge className="bg-red-600 text-white animate-pulse">🔴 AO VIVO</Badge>;
  } else if (transmission.status === 'scheduled' && startAt && startAt > now) {
    const diff = startAt.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    statusBadge = <Badge variant="outline">Começa em {days > 0 ? `${days}d ` : ''}{hours}h</Badge>;
  } else if (transmission.status === 'ended' && badgeLabel) {
    statusBadge = <Badge variant="secondary">{badgeLabel}</Badge>;
  }

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const eventTZ = transmission.timezone || 'America/New_York';
  const timezoneText = `Horários em ${formatTimezone(userTZ)} • Local: ${formatTimezone(eventTZ)}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} — Detalhes da Transmissão — III CIVENI 2025</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} — III CIVENI 2025`} />
        <meta property="og:description" content={description} />
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-16">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/20"
            onClick={() => navigate('/transmissao-ao-vivo')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Transmissões
          </Button>

          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li><a href="/" className="hover:text-blue-200 transition-colors">Home</a></li>
              <li className="text-blue-200">›</li>
              <li><a href="/transmissao-ao-vivo" className="hover:text-blue-200 transition-colors">Transmissão ao Vivo</a></li>
              <li className="text-blue-200">›</li>
              <li>{title}</li>
            </ol>
          </nav>

          <div className="max-w-4xl">
            {subtitle && (
              <p className="text-lg mb-3 text-blue-100">{subtitle}</p>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-poppins">
              {title}
            </h1>
            
            <div className="flex flex-wrap gap-3 mb-6">
              {statusBadge}
              {startAt && (
                <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <span>{startAt.toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
                </div>
              )}
              {startAt && (
                <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{startAt.toLocaleTimeString(locale, { timeStyle: 'short' })}</span>
                </div>
              )}
            </div>

            {description && (
              <p className="text-lg mb-8 text-blue-50 leading-relaxed">
                {description}
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {transmission.status === 'live' && (
                <Button
                  size="lg"
                  className="bg-white text-civeni-blue hover:bg-white/90"
                  onClick={() => document.querySelector('#player')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Assistir agora
                </Button>
              )}
              {transmission.status === 'scheduled' && transmission.channel_handle && (
                <Button
                  size="lg"
                  className="bg-white text-civeni-blue hover:bg-white/90"
                  asChild
                >
                  <a href={`https://www.youtube.com/${transmission.channel_handle}/live`} target="_blank" rel="noopener noreferrer">
                    <Calendar className="w-5 h-5 mr-2" />
                    Definir lembrete
                  </a>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20"
                asChild
              >
                <a href="/inscricoes">
                  <Users className="w-5 h-5 mr-2" />
                  Fazer Inscrição
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* YouTube Player */}
            {transmission.youtube_video_id ? (
              <div id="player" className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Player</h2>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${transmission.youtube_video_id}?autoplay=0&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="w-full h-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Canal: {transmission.channel_handle}
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href="https://www.youtube.com/@veniuniversity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no YouTube
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Vídeo não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  {transmission.status === 'scheduled' 
                    ? 'A transmissão ainda não começou.'
                    : 'Não há replay disponível no momento.'}
                </p>
                {transmission.channel_handle && (
                  <Button variant="outline" asChild>
                    <a
                      href="https://www.youtube.com/@veniuniversity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visite o canal
                    </a>
                  </Button>
                )}
              </Card>
            )}

            {/* Rooms */}
            {rooms.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Salas disponíveis</h2>
                <div className="grid gap-4">
                  {rooms.map((room) => (
                    <Card key={room.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {pickLang(room.name as Record<string, string>, locale)}
                          </h3>
                          {room.is_live && (
                            <Badge className="bg-red-600 text-white">Ao vivo</Badge>
                          )}
                        </div>
                      </div>
                      <Button className="w-full" asChild>
                        <a href={room.meet_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Entrar na sala
                        </a>
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Informações</h3>
              <div className="space-y-4">
                {startAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Data</p>
                      <p className="text-sm text-muted-foreground">
                        {startAt.toLocaleDateString(locale, { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {startAt && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-sm text-muted-foreground">
                        {startAt.toLocaleTimeString(locale, { timeStyle: 'short' })}
                        {endAt && ` - ${endAt.toLocaleTimeString(locale, { timeStyle: 'short' })}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timezoneText}
                      </p>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Local</p>
                    <p className="text-sm text-muted-foreground">
                      Transmissão Online
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Links úteis</h3>
              <div className="space-y-2">
                {transmission.schedule_url && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={transmission.schedule_url}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Ver programação
                    </a>
                  </Button>
                )}
                {transmission.faq_url && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={transmission.faq_url}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      FAQ
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://www.youtube.com/@veniuniversity" target="_blank" rel="noopener noreferrer">
                    <Video className="w-4 h-4 mr-2" />
                    Canal do YouTube
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TransmissaoDetalhes;
