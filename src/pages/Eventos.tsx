import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Filter, Search, ExternalLink, Award } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Eventos = () => {
  const { t } = useTranslation();
  const { events, loading } = useEvents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalidadeFilter, setModalidadeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('upcoming');

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.inicio_at);
    const endDate = event.fim_at ? new Date(event.fim_at) : startDate;

    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'live';
    return 'past';
  };

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event: any) => {
      const matchesSearch = event.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.descricao_richtext?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const eventStatus = getEventStatus(event);
      const matchesStatus = statusFilter === 'all' || eventStatus === statusFilter;
      const matchesModalidade = modalidadeFilter === 'all' || event.modalidade === modalidadeFilter;
      
      // Filter by active tab
      if (activeTab === 'upcoming') {
        return matchesSearch && matchesStatus && matchesModalidade && eventStatus !== 'past';
      } else {
        return matchesSearch && matchesStatus && matchesModalidade && eventStatus === 'past';
      }
    });
  }, [events, searchTerm, statusFilter, modalidadeFilter, activeTab]);

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
      <Badge variant={variants[status] as any} className="mb-2">
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
      <Badge variant="outline" className={colors[modalidade as keyof typeof colors] || ''}>
        {modalidade.charAt(0).toUpperCase() + modalidade.slice(1)}
      </Badge>
    );
  };

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-blue/80 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li>Eventos</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Eventos
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Congresso Internacional Multidisciplinar - Acompanhe todos os eventos, palestras e atividades do III CIVENI 2025 -
              Uma experiência única de aprendizado e networking mundial
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/inscricoes">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
              
              <Link to="/certificado-emissao">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Emitir Certificado
                </button>
              </Link>
              
              <Link to="/programacao-presencial">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Ver Programação
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section - Sticky */}
      <section className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
                <SelectItem value="live">Em Andamento</SelectItem>
                <SelectItem value="past">Encerrados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Modalidades</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos Eventos
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Eventos Passados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-8">
            {/* Featured Events */}
            {events?.filter((event: any) => event.featured && getEventStatus(event) !== 'past').length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="h-6 w-6 text-civeni-blue" />
                  Eventos em Destaque
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events?.filter((event: any) => event.featured && getEventStatus(event) !== 'past').map((event: any) => (
                    <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-2 border-civeni-blue/20">
                      <div className="relative">
                        {event.banner_url && (
                          <img 
                            src={event.banner_url} 
                            alt={event.titulo}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="absolute top-4 left-4">
                          {getStatusBadge(event)}
                        </div>
                        <div className="absolute top-4 right-4">
                          {getModalidadeBadge(event.modalidade)}
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-2">{event.titulo}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatEventDate(event.inicio_at)}
                        </div>
                        
                        {event.endereco && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{event.endereco}</span>
                          </div>
                        )}
                        
                        <p className="text-gray-700 text-sm line-clamp-3">{event.subtitulo}</p>
                        
                        <div className="flex gap-2 pt-3">
                          <Link to={`/eventos/${event.slug}`} className="flex-1">
                            <Button className="w-full">
                              Ver Detalhes
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* All Upcoming Events */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Todos os Eventos
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event: any) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="relative">
                      {event.banner_url && (
                        <img 
                          src={event.banner_url} 
                          alt={event.titulo}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute top-4 left-4">
                        {getStatusBadge(event)}
                      </div>
                      <div className="absolute top-4 right-4">
                        {getModalidadeBadge(event.modalidade)}
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{event.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatEventDate(event.inicio_at)}
                      </div>
                      
                      {event.endereco && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.endereco}</span>
                        </div>
                      )}
                      
                      <p className="text-gray-700 text-sm line-clamp-3">{event.subtitulo}</p>
                      
                      <div className="flex gap-2 pt-3">
                        <Link to={`/eventos/${event.slug}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            Ver Detalhes
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredEvents.length === 0 && !loading && (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">
                    {events && events.length > 0 
                      ? "Nenhum evento encontrado com os filtros selecionados."
                      : "Nenhum evento disponível no momento."
                    }
                  </p>
                  {/* Debug info */}
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Debug: Total events loaded: {events?.length || 0}</p>
                    <p>Filtered events: {filteredEvents.length}</p>
                    <p>Loading: {loading ? 'true' : 'false'}</p>
                  </div>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="past" className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Eventos Realizados
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event: any) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 opacity-90">
                    <div className="relative">
                      {event.banner_url && (
                        <img 
                          src={event.banner_url} 
                          alt={event.titulo}
                          className="w-full h-48 object-cover grayscale"
                        />
                      )}
                      <div className="absolute top-4 left-4">
                        {getStatusBadge(event)}
                      </div>
                      <div className="absolute top-4 right-4">
                        {getModalidadeBadge(event.modalidade)}
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{event.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatEventDate(event.inicio_at)}
                      </div>
                      
                      {event.endereco && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.endereco}</span>
                        </div>
                      )}
                      
                      <p className="text-gray-700 text-sm line-clamp-3">{event.subtitulo}</p>
                      
                       <div className="flex gap-2 pt-3">
                         <Link to={`/eventos/${event.slug}`} className="flex-1">
                           <Button variant="outline" size="sm" className="w-full">
                             Ver Detalhes
                           </Button>
                         </Link>
                         
                         {event.youtube_url && (
                           <Button variant="default" size="sm" asChild>
                             <a href={event.youtube_url} target="_blank" rel="noopener noreferrer">
                               Gravação
                             </a>
                           </Button>
                         )}
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredEvents.length === 0 && !loading && (
                <div className="text-center py-16">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">
                    Nenhum evento passado encontrado.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Eventos;