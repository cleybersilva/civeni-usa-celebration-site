import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Play, Calendar, Video, HelpCircle, ExternalLink, Clock, Users, Youtube, MapPin, ChevronRight, Monitor, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTransmission,
  useTransmissionRooms,
  useUpcomingTransmissions,
  pickLang,
  formatTimezone,
} from '@/hooks/useTransmission';
import TransmissionAgenda from '@/components/transmission/TransmissionAgenda';

const TransmissaoAoVivo = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = i18n.language;

  // Parse active tab from hash
  const hash = location.hash.replace('#', '') || 'ao-vivo';
  const [activeTab, setActiveTab] = useState(hash);

  // Fetch data
  const { data: transmission, isLoading: txLoading } = useTransmission();
  const { data: rooms = [], isLoading: roomsLoading } = useTransmissionRooms(transmission?.id);
  const { data: upcoming = [], isLoading: upcomingLoading } = useUpcomingTransmissions();

  // Sync hash with active tab
  useEffect(() => {
    const hashValue = location.hash.replace('#', '') || 'ao-vivo';
    setActiveTab(hashValue);
  }, [location.hash]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`#${value}`, { replace: true });
  };

  // Extracted localized values
  const title = pickLang(transmission?.title, locale);
  const subtitle = pickLang(transmission?.subtitle, locale);
  const description = pickLang(transmission?.description, locale);
  const badgeLabel = pickLang(transmission?.badge_label, locale);

  // Status badge logic
  const statusBadge = useMemo(() => {
    if (!transmission) return null;
    const now = new Date();
    const startAt = transmission.start_at ? new Date(transmission.start_at) : null;

    if (transmission.status === 'live') {
      return <Badge className="bg-red-600 text-white animate-pulse">🔴 AO VIVO</Badge>;
    }

    if (transmission.status === 'scheduled' && startAt && startAt > now) {
      const diff = startAt.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return <Badge variant="outline">Começa em {hours}h {minutes}min</Badge>;
    }

    if (transmission.status === 'ended' && badgeLabel) {
      return <Badge variant="secondary">{badgeLabel}</Badge>;
    }

    return null;
  }, [transmission, badgeLabel]);

  // CTA buttons logic
  const primaryCTA = useMemo(() => {
    if (!transmission) return null;

    if (transmission.status === 'live') {
      return {
        label: 'Assistir agora',
        href: '#player',
        icon: <Play className="w-4 h-4" />,
      };
    }

    if (transmission.status === 'scheduled') {
      return {
        label: 'Definir lembrete',
        href: `https://www.youtube.com/${transmission.channel_handle}/live`,
        icon: <Calendar className="w-4 h-4" />,
        external: true,
      };
    }

    if (transmission.status === 'ended' && transmission.youtube_video_id) {
      return {
        label: 'Assistir replay',
        href: '#player',
        icon: <Video className="w-4 h-4" />,
      };
    }

    return null;
  }, [transmission]);

  // Timezone text
  const timezoneText = useMemo(() => {
    if (!transmission) return '';
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userLabel = formatTimezone(userTZ);
    const eventLabel = formatTimezone(transmission.timezone);
    return `Horários em ${userLabel} • Local: ${eventLabel}`;
  }, [transmission]);

  if (txLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
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
            Não há transmissão disponível no momento.
          </p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} — III CIVENI 2025</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} — III CIVENI 2025`} />
        <meta property="og:description" content={description} />
      </Helmet>

      <Header />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-civeni-blue via-civeni-blue/95 to-civeni-red text-white py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-civeni-red/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2 text-white/80">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li>›</li>
              <li><a href="/programacao-online" className="hover:text-white transition-colors">Programação</a></li>
              <li>›</li>
              <li className="text-white">Transmissão ao Vivo</li>
            </ol>
          </nav>
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Title Section */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Play className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{t('transmission.title')}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {title || t('transmission.title')}
              </h1>
              
              {subtitle && (
                <p className="text-xl md:text-2xl text-white/90 font-medium">
                  {subtitle}
                </p>
              )}
              
              {description && (
                <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {primaryCTA && (
                primaryCTA.external ? (
                  <a href={primaryCTA.href} target="_blank" rel="noopener noreferrer">
                    <button className="group bg-white text-civeni-blue hover:bg-white/90 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                      {primaryCTA.icon}
                      {primaryCTA.label}
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      document.querySelector(primaryCTA.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group bg-white text-civeni-blue hover:bg-white/90 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {primaryCTA.icon}
                    {primaryCTA.label}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )
              )}
              <a href="/inscricoes">
                <button className="group border-white/80 text-white hover:bg-white/10 border-2 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-3 backdrop-blur-sm">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </a>
            </div>

            {/* Status Info */}
            <div className="flex flex-wrap gap-4 items-center justify-center pt-4">
              {statusBadge}
              {timezoneText && (
                <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <Clock className="w-4 h-4" />
                  <span>{timezoneText}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="container mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-12 h-auto p-1 bg-gradient-to-r from-gray-100 to-gray-50 shadow-lg rounded-xl">
            <TabsTrigger 
              value="ao-vivo" 
              className="flex flex-col md:flex-row items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-blue/90 data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Play className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">Ao Vivo</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agenda" 
              className="flex flex-col md:flex-row items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-blue/90 data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">Agenda</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salas" 
              className="flex flex-col md:flex-row items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-blue/90 data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">Salas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="faq" 
              className="flex flex-col md:flex-row items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-blue/90 data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">FAQ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ao-vivo" className="space-y-10">
            {/* YouTube Player */}
            {transmission.youtube_video_id ? (
              <div id="player" className="space-y-6">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-gray-200 transform transition-all hover:scale-[1.01] duration-300">
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
                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Youtube className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Canal Oficial
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {transmission.channel_handle}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="bg-civeni-blue hover:bg-civeni-blue/90 group" 
                      asChild
                    >
                      <a
                        href={`https://www.youtube.com/${transmission.channel_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir no YouTube
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-16 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Video className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Nenhum vídeo disponível</h3>
                    <p className="text-gray-600 text-base">
                      A transmissão ainda não começou ou não há replay disponível.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white transition-all duration-300 group"
                    asChild
                  >
                    <a
                      href="https://www.youtube.com/@veniuniversity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="w-5 h-5 mr-2" />
                      Visite o canal
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </Card>
            )}

            {/* Upcoming Transmissions */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-900">Próximas Transmissões</h2>
              </div>
              {upcomingLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : upcoming.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((tx) => (
                    <Card 
                      key={tx.id} 
                      className="group p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="bg-civeni-blue/10 text-civeni-blue border-civeni-blue/20">
                            Agendado
                          </Badge>
                          <Calendar className="w-5 h-5 text-civeni-blue" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-civeni-blue transition-colors line-clamp-2">
                          {pickLang(tx.title, locale)}
                        </h3>
                        {tx.start_at && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(tx.start_at).toLocaleString(locale, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          className="w-full bg-civeni-blue hover:bg-civeni-blue/90 group-hover:shadow-md transition-all" 
                          asChild
                        >
                          <Link to={`/transmissao-ao-vivo/${tx.slug}`}>
                            Ver Detalhes
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">Sem próximas transmissões agendadas</h3>
                      <p className="text-gray-600">
                        Fique atento ao nosso canal no YouTube para futuras transmissões
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      size="lg"
                      className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white transition-all duration-300 group"
                      asChild
                    >
                      <a href="https://www.youtube.com/@veniuniversity" target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-5 h-5 mr-2" />
                        Veja o canal no YouTube
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="agenda">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                  <h2 className="text-3xl font-bold text-gray-900">Agenda Online</h2>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white"
                    asChild
                  >
                    <a href="/programacao-online">
                      Ver todas as sessões
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <TransmissionAgenda />
              
              <Card className="p-8 bg-gradient-to-br from-civeni-blue/5 to-civeni-red/5 border-civeni-blue/20">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <div className="w-16 h-16 bg-civeni-blue/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-civeni-blue" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Programação completa disponível
                    </h3>
                    <p className="text-gray-600">
                      Acesse a programação completa presencial e online com todos os detalhes das atividades
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <Button 
                      size="lg"
                      className="bg-civeni-blue hover:bg-civeni-blue/90"
                      asChild
                    >
                      <a href="/programacao-online">
                        <Monitor className="w-5 h-5 mr-2" />
                        Online
                      </a>
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white"
                      asChild
                    >
                      <a href="/programacao-presencial">
                        <MapPin className="w-5 h-5 mr-2" />
                        Presencial
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="salas">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-900">Salas de Reunião</h2>
              </div>
              <p className="text-gray-600 text-lg max-w-3xl">
                Acesse as salas virtuais exclusivas para participantes inscritos. Interaja diretamente com palestrantes e outros participantes.
              </p>
              {roomsLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : rooms.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className="group p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:-translate-y-1"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-civeni-blue transition-colors line-clamp-2">
                            {pickLang(room.name, locale)}
                          </h3>
                          {room.is_live && (
                            <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1 shrink-0">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Ao vivo
                            </Badge>
                          )}
                        </div>
                        <Button 
                          className="w-full bg-civeni-blue hover:bg-civeni-blue/90 group-hover:shadow-md transition-all" 
                          asChild
                        >
                          <a href={room.meet_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Entrar na sala
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Video className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">Nenhuma sala disponível no momento</h3>
                      <p className="text-gray-600">
                        As salas serão abertas durante o evento. Fique atento aos horários da programação.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-900">Perguntas Frequentes</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* FAQ Items */}
                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-5 h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900">{t('transmission.faq.tech.title')}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{t('transmission.faq.tech.answer')}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-5 h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900">{t('transmission.faq.access.title')}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{t('transmission.faq.access.answer')}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-5 h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900">{t('transmission.faq.recording.title')}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{t('transmission.faq.recording.answer')}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-5 h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900">{t('transmission.faq.support.title')}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{t('transmission.faq.support.answer')}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Additional help CTA */}
              <Card className="p-10 text-center bg-gradient-to-br from-civeni-blue/5 to-civeni-red/5 border-civeni-blue/20 shadow-md">
                <div className="max-w-2xl mx-auto space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Ainda tem dúvidas?</h3>
                  <p className="text-gray-600">
                    Nossa equipe está pronta para ajudar. Entre em contato conosco para mais informações.
                  </p>
                  <Button 
                    size="lg"
                    className="bg-civeni-blue hover:bg-civeni-blue/90 group shadow-lg"
                    asChild
                  >
                    <Link to="/contato">
                      Entre em Contato
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

export default TransmissaoAoVivo;
