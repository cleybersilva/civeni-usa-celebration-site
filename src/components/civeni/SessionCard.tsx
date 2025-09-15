import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Users, ExternalLink, Download } from 'lucide-react';

interface Session {
  id: string;
  start_at: string;
  end_at?: string;
  session_type: string;
  title: string;
  description?: string;
  room?: string;
  modality: string;
  is_parallel: boolean;
  is_featured: boolean;
  livestream_url?: string;
  materials_url?: string;
}

interface SessionCardProps {
  session: Session;
  isLive?: boolean;
  isNext?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isLive, isNext }) => {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Fortaleza'
    });
  };

  const getSessionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'conferencia': 'bg-blue-100 text-blue-800',
      'palestra': 'bg-green-100 text-green-800',
      'workshop': 'bg-purple-100 text-purple-800',
      'mesa_redonda': 'bg-orange-100 text-orange-800',
      'painel': 'bg-yellow-100 text-yellow-800',
      'sessoes_simultaneas': 'bg-pink-100 text-pink-800',
      'intervalo': 'bg-gray-100 text-gray-800',
      'abertura': 'bg-indigo-100 text-indigo-800',
      'encerramento': 'bg-red-100 text-red-800',
      'credenciamento': 'bg-teal-100 text-teal-800',
      'cerimonia': 'bg-purple-100 text-purple-800',
      'outro': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getModalityColor = (modality: string) => {
    const colors: Record<string, string> = {
      'presencial': 'bg-emerald-100 text-emerald-800',
      'online': 'bg-blue-100 text-blue-800',
      'hibrido': 'bg-amber-100 text-amber-800'
    };
    return colors[modality] || 'bg-gray-100 text-gray-800';
  };

  const generateICS = () => {
    const startDate = new Date(session.start_at);
    const endDate = session.end_at ? new Date(session.end_at) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CIVENI//Programacao//PT-BR',
      'BEGIN:VEVENT',
      `UID:${session.id}@civeni.com`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${session.title}`,
      session.description ? `DESCRIPTION:${session.description}` : '',
      session.room ? `LOCATION:${session.room}` : 'LOCATION:CIVENI — Fortaleza/CE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civeni-${session.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${
      isLive ? 'ring-2 ring-red-500 bg-red-50' : 
      isNext ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm">
                {formatTime(session.start_at)}
                {session.end_at && ` - ${formatTime(session.end_at)}`}
              </span>
              
              {isLive && (
                <Badge variant="destructive" className="ml-2">
                  AO VIVO
                </Badge>
              )}
              
              {isNext && (
                <Badge variant="secondary" className="ml-2">
                  PRÓXIMA
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {session.title}
            </h3>

            {session.description && (
              <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                {session.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getSessionTypeColor(session.session_type)}>
                {session.session_type.replace('_', ' ').toUpperCase()}
              </Badge>
              
              <Badge className={getModalityColor(session.modality)}>
                {session.modality.toUpperCase()}
              </Badge>

              {session.is_parallel && (
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  SIMULTÂNEA
                </Badge>
              )}

              {session.is_featured && (
                <Badge variant="secondary">
                  ⭐ DESTAQUE
                </Badge>
              )}
            </div>

            {session.room && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{session.room}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[140px]">
            <Button 
              size="sm" 
              variant="outline"
              onClick={generateICS}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Adicionar à agenda
            </Button>

            {session.livestream_url && (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => window.open(session.livestream_url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Assistir online
              </Button>
            )}

            {session.materials_url && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => window.open(session.materials_url, '_blank')}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Materiais
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;