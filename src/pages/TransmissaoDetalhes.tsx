import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Play, Calendar, Clock, MapPin, ExternalLink, Users, Video, ChevronRight } from 'lucide-react';
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
import CountdownTimer from '@/components/transmission/CountdownTimer';

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
          <Button 
            onClick={() => navigate('/transmissao-ao-vivo')}
            className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white"
          >
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
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-16 md:py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/20 border border-white/30"
            onClick={() => navigate('/transmissao-ao-vivo')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('transmission.backToTransmissions', 'Voltar para Transmissões')}
          </Button>

          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li><a href="/" className="hover:text-blue-200 transition-colors">{t('header.home', 'Home')}</a></li>
              <li className="text-blue-200">›</li>
              <li><a href="/transmissao-ao-vivo" className="hover:text-blue-200 transition-colors">{t('transmission.liveTransmission', 'Transmissão ao Vivo')}</a></li>
              <li className="text-blue-200">›</li>
              <li>{title}</li>
            </ol>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
            {subtitle && (
              <p className="text-base md:text-lg mb-3 text-blue-100">{subtitle}</p>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-poppins">
              {title}
            </h1>
            
            {/* Status Info */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {transmission.status === 'live' && (
                <Badge className="bg-red-600 text-white animate-pulse text-sm md:text-base px-4 py-2">
                  🔴 {t('transmission.live', 'AO VIVO')}
                </Badge>
              )}
              {transmission.status === 'ended' && badgeLabel && (
                <Badge variant="secondary" className="text-sm md:text-base px-4 py-2">
                  {badgeLabel}
                </Badge>
              )}
              {startAt && (
                <div className="flex items-center gap-2 text-xs md:text-sm bg-white/10 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <span>{startAt.toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
                </div>
              )}
              {startAt && (
                <div className="flex items-center gap-2 text-xs md:text-sm bg-white/10 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{startAt.toLocaleTimeString(locale, { timeStyle: 'short' })}</span>
                </div>
              )}
            </div>

            {/* Countdown Timer */}
            {transmission.status === 'scheduled' && startAt && startAt > now && (
              <div className="mb-8 flex justify-center">
                <CountdownTimer targetDate={startAt} className="w-full max-w-lg" />
              </div>
            )}

            {description && (
              <p className="text-base md:text-lg mb-8 text-blue-50 leading-relaxed max-w-2xl mx-auto">
                {description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
              {transmission.status === 'live' && (
                <Button
                  size="lg"
                  className="bg-white text-civeni-blue hover:bg-white/90 w-full sm:w-auto font-semibold"
                  onClick={() => document.querySelector('#player')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {t('transmission.watchNow', 'Assistir agora')}
                </Button>
              )}
              {transmission.status === 'scheduled' && (
                <Button
                  size="lg"
                  className="bg-white text-civeni-blue hover:bg-white/90 w-full sm:w-auto font-semibold"
                  asChild
                >
                  <a href="https://www.youtube.com/@veniuniversity" target="_blank" rel="noopener noreferrer">
                    <Calendar className="w-5 h-5 mr-2" />
                    {t('transmission.setReminder', 'Definir lembrete')}
                  </a>
                </Button>
              )}
              <Button
                size="lg"
                className="bg-civeni-red hover:bg-civeni-red/90 text-white w-full sm:w-auto font-semibold"
                asChild
              >
                <a href="https://civeni.com/inscricoes" target="_blank" rel="noopener noreferrer">
                  <Users className="w-5 h-5 mr-2" />
                  {t('transmission.register', 'Fazer Inscrição')}
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
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-gray-200">
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
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white group"
                    asChild
                  >
                    <a
                      href="https://www.youtube.com/@veniuniversity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no YouTube
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{t('transmission.noVideoTitle')}</h3>
                <p className="text-muted-foreground mb-6">
                  {transmission.status === 'scheduled' 
                    ? t('transmission.noVideoDescription')
                    : t('transmission.noReplayAvailable')}
                </p>
                {transmission.channel_handle && (
                  <Button 
                    className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white group"
                    asChild
                  >
                    <a
                      href="https://www.youtube.com/@veniuniversity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('transmission.visitChannel')}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
                    <Card key={room.id} className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all">
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
                      <Button 
                        className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white" 
                        asChild
                      >
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
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md">
              <h3 className="font-semibold text-lg mb-6 text-center">
                {t('transmission.info', 'Informações')}
              </h3>
              <div className="space-y-6">
                {startAt && (
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 bg-civeni-blue/10 rounded-full">
                        <Calendar className="w-5 h-5 text-civeni-blue" />
                      </div>
                    </div>
                    <p className="font-semibold text-base mb-1">
                      {t('transmission.date', 'Data')}
                    </p>
                    <p className="text-sm text-civeni-blue leading-relaxed">
                      {startAt.toLocaleDateString(locale, { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {startAt && (
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 bg-civeni-blue/10 rounded-full">
                        <Clock className="w-5 h-5 text-civeni-blue" />
                      </div>
                    </div>
                    <p className="font-semibold text-base mb-1">
                      {t('transmission.time', 'Horário')}
                    </p>
                    <p className="text-sm text-civeni-blue mb-1">
                      {startAt.toLocaleTimeString(locale, { timeStyle: 'short' })}
                      {endAt && ` - ${endAt.toLocaleTimeString(locale, { timeStyle: 'short' })}`}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed px-2">
                      {timezoneText}
                    </p>
                  </div>
                )}
                <Separator />
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-civeni-blue/10 rounded-full">
                      <MapPin className="w-5 h-5 text-civeni-blue" />
                    </div>
                  </div>
                  <p className="font-semibold text-base mb-1">
                    {t('transmission.location', 'Local')}
                  </p>
                  <p className="text-sm text-civeni-blue">
                    {t('transmission.onlineTransmission', 'Transmissão Online')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md">
              <h3 className="font-semibold text-lg mb-6 text-center">
                {t('transmission.usefulLinks', 'Links úteis')}
              </h3>
              <div className="space-y-3">
                {transmission.schedule_url && (
                  <Button 
                    className="w-full justify-center gap-2 bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white" 
                    asChild
                  >
                    <a href={transmission.schedule_url}>
                      <Calendar className="w-4 h-4" />
                      {t('transmission.viewSchedule', 'Ver programação')}
                    </a>
                  </Button>
                )}
                {transmission.faq_url && (
                  <Button 
                    className="w-full justify-center gap-2 bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white" 
                    asChild
                  >
                    <a href={transmission.faq_url}>
                      <ExternalLink className="w-4 h-4" />
                      FAQ
                    </a>
                  </Button>
                )}
                <Button 
                  className="w-full justify-center gap-2 bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white" 
                  asChild
                >
                  <a href="https://www.youtube.com/@veniuniversity" target="_blank" rel="noopener noreferrer">
                    <Video className="w-4 h-4" />
                    {t('transmission.youtubeChannel', 'Canal do YouTube')}
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
