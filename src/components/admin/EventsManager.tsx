import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star,
  StarOff,
  Copy,
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAdminEvents } from '@/hooks/useAdminEvents';
import { EventFormDialog } from './EventFormDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkeletonList } from '@/components/SkeletonList';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventsManager = () => {
  const { t } = useTranslation();
  
  const { events, loading, error, createEvent, updateEvent, deleteEvent, refetch } = useAdminEvents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalidadeFilter, setModalidadeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const getEventStatus = (event: any) => {
    try {
      const now = new Date();
      const startDate = new Date(event.inicio_at);
      const endDate = event.fim_at ? new Date(event.fim_at) : startDate;

      // Validate dates
      if (isNaN(startDate.getTime()) || (event.fim_at && isNaN(endDate.getTime()))) {
        return 'unknown';
      }

      if (now < startDate) return 'upcoming';
      if (now >= startDate && now <= endDate) return 'live';
      return 'past';
    } catch (err) {
      return 'unknown';
    }
  };

  let filteredEvents: any[] = [];
  try {
    filteredEvents = events?.filter((event: any) => {
      const title = typeof event.titulo === 'string' ? event.titulo : '';
      const slug = typeof event.slug === 'string' ? event.slug : '';

      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           slug.toLowerCase().includes(searchTerm.toLowerCase());
      
      const eventStatus = getEventStatus(event);
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'draft' && event.status_publicacao === 'draft') ||
                           (statusFilter === 'published' && event.status_publicacao === 'published') ||
                           (statusFilter === 'archived' && event.status_publicacao === 'archived') ||
                           (statusFilter === 'upcoming' && eventStatus === 'upcoming') ||
                           (statusFilter === 'live' && eventStatus === 'live') ||
                           (statusFilter === 'past' && eventStatus === 'past');
      
      const matchesModalidade = modalidadeFilter === 'all' || event.modalidade === modalidadeFilter;
      
      return matchesSearch && matchesStatus && matchesModalidade;
    }) || [];
  } catch (err) {
    filteredEvents = events || [];
  }

  const handleCreateEvent = async (eventData: any) => {
    const success = await createEvent(eventData);
    if (success) {
      setShowCreateDialog(false);
    }
  };

  const handleUpdateEvent = async (eventData: any) => {
    const success = await updateEvent(editingEvent.id, eventData);
    if (success) {
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este evento?')) {
      await deleteEvent(eventId);
    }
  };

  const handleTogglePublish = async (event: any) => {
    const newStatus = event.status_publicacao === 'published' ? 'draft' : 'published';
    await updateEvent(event.id, { status_publicacao: newStatus });
  };

  const handleToggleFeatured = async (event: any) => {
    await updateEvent(event.id, { featured: !event.featured });
  };

  const handleDuplicateEvent = async (event: any) => {
    const duplicatedEvent = {
      ...event,
      titulo: `${event.titulo} (Cópia)`,
      slug: `${event.slug}-copy-${Date.now()}`,
      status_publicacao: 'draft',
      featured: false
    };
    delete duplicatedEvent.id;
    delete duplicatedEvent.created_at;
    delete duplicatedEvent.updated_at;
    
    await createEvent(duplicatedEvent);
  };

  const formatEventDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      // Check if year is unreasonable (before 1900 or after 2200)
      const year = date.getFullYear();
      if (year < 1900 || year > 2200) {
        return 'Data inválida';
      }
      
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (err) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (event: any) => {
    const status = event.status_publicacao;
    const eventStatus = getEventStatus(event);
    
    if (status === 'draft') {
      return <Badge variant="secondary">Rascunho</Badge>;
    } else if (status === 'archived') {
      return <Badge variant="outline">Arquivado</Badge>;
    } else if (eventStatus === 'live') {
      return <Badge variant="destructive">Ao Vivo</Badge>;
    } else if (eventStatus === 'past') {
      return <Badge variant="outline">Encerrado</Badge>;
    } else if (eventStatus === 'unknown') {
      return <Badge variant="secondary">Data Inválida</Badge>;
    } else {
      return <Badge variant="default">Publicado</Badge>;
    }
  };

  return (
    <ErrorBoundary 
      onReset={refetch}
      fallbackTitle="Erro ao carregar Eventos"
    >
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {t('admin.events.title', 'Gerenciar Eventos')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              {t('admin.events.description', 'Crie e gerencie eventos, palestras e atividades')}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
            <div>
              <Input
                placeholder="Buscar por título ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
                <SelectItem value="live">Ao Vivo</SelectItem>
                <SelectItem value="past">Encerrados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {filteredEvents.length} de {events?.length || 0} eventos
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid gap-4">
        {loading ? (
          <SkeletonList count={3} />
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <p className="font-medium">Erro ao carregar eventos</p>
                  <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                </div>
                <Button onClick={refetch} variant="outline">
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || modalidadeFilter !== 'all' 
                    ? 'Nenhum evento encontrado com os filtros selecionados'
                    : 'Nenhum evento criado ainda'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event: any) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold line-clamp-1">
                        {event.titulo || event.slug}
                      </h3>
                      {event.featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current shrink-0" />
                      )}
                      {getStatusBadge(event)}
                      <Badge variant="outline" className="capitalize text-xs">
                        {event.modalidade}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="break-all">Início: {formatEventDate(event.inicio_at)}</span>
                        {event.fim_at && (
                          <span className="break-all">• Fim: {formatEventDate(event.fim_at)}</span>
                        )}
                      </div>
                      
                      {event.endereco && (
                        <div className="line-clamp-1 break-all">
                          📍 {event.endereco}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                        <span className="break-all">Slug: {event.slug}</span>
                        <span className="break-all">Criado: {formatEventDate(event.created_at)}</span>
                        {event.updated_at !== event.created_at && (
                          <span className="break-all">Atualizado: {formatEventDate(event.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    
                    {event.subtitulo && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                        {event.subtitulo}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(event)}
                      title={event.featured ? 'Remover destaque' : 'Destacar evento'}
                      className="flex-1 lg:flex-none text-xs"
                    >
                      {event.featured ? (
                        <StarOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(event)}
                      title={event.status_publicacao === 'published' ? 'Despublicar' : 'Publicar'}
                      className="flex-1 lg:flex-none text-xs"
                    >
                      {event.status_publicacao === 'published' ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateEvent(event)}
                      title="Duplicar evento"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingEvent(event)}
                      title="Editar evento"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {event.status_publicacao === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        title="Ver no site"
                      >
                        <a href={`/eventos/${event.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      title="Deletar evento"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <EventFormDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateEvent}
        title="Criar Novo Evento"
      />

      {/* Edit Dialog */}
      {editingEvent && (
        <EventFormDialog
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onSubmit={handleUpdateEvent}
          initialData={editingEvent}
          title="Editar Evento"
        />
      )}
      </div>
    </ErrorBoundary>
  );
};

export default EventsManager;