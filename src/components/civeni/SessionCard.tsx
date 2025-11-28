import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Users, ExternalLink, Download, Globe } from 'lucide-react';
import TimezonesDisplay from './TimezonesDisplay';

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
  const { t, i18n } = useTranslation();
  const [showTimezones, setShowTimezones] = useState(false);
  
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const match = timeString.match(/T(\d{2}:\d{2})| (\d{2}:\d{2})/);
    if (match) {
      const time = match[1] || match[2];
      const [hours, minutes] = time.split(':').map(Number);
      
      // For English, use 12-hour format with AM/PM
      if (i18n.language === 'en') {
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      // For other languages (PT, ES, TR), use 24-hour format
      return time;
    }
    return timeString;
  };

  const parseBrazilDateTime = (value: string): Date | null => {
    if (!value) return null;
    try {
      const match = value.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
      if (match) {
        const [, datePart, timePart] = match;
        return new Date(`${datePart}T${timePart}:00-03:00`);
      }
      return new Date(value);
    } catch {
      return null;
    }
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

  const getTranslatedSessionType = (type: string) => {
    return t(`schedule.sessionTypes.${type}`) || type.replace('_', ' ').toUpperCase();
  };

  const getTranslatedModality = (modality: string) => {
    return t(`schedule.modality.${modality}`) || modality.toUpperCase();
  };

  const getTranslatedSessionTitle = (title: string) => {
    const sessionTitles = t('schedule.sessionTitles', { returnObjects: true }) as Record<string, string>;
    return sessionTitles?.[title] || title;
  };

  const getTranslatedSessionDescription = (description: string) => {
    if (!description) return description;
    
    const sessionDescriptions = t('schedule.sessionDescriptions', { returnObjects: true }) as Record<string, string>;
    if (!sessionDescriptions || Object.keys(sessionDescriptions).length === 0) return description;
    
    // First try exact match with cleaned description
    const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
    if (sessionDescriptions[cleanDesc]) {
      return description.replace(cleanDesc, sessionDescriptions[cleanDesc]);
    }
    
    // Try to translate parts of the description
    let translatedDesc = description;
    for (const [key, value] of Object.entries(sessionDescriptions)) {
      if (key && value && translatedDesc.includes(key)) {
        translatedDesc = translatedDesc.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      }
    }
    
    return translatedDesc;
  };

  const generateICS = () => {
    const startDate = parseBrazilDateTime(session.start_at) || new Date(session.start_at);
    const endDateBase = session.end_at
      ? parseBrazilDateTime(session.end_at) || new Date(session.end_at)
      : null;
    const endDate = endDateBase || new Date(startDate.getTime() + 60 * 60 * 1000);
    
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
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {formatTime(session.start_at)}
                  {session.end_at && ` - ${formatTime(session.end_at)}`}
                </span>
                
                {isLive && (
                  <Badge variant="destructive" className="ml-2">
                    {t('schedule.session.live')}
                  </Badge>
                )}
                
                {isNext && (
                  <Badge variant="secondary" className="ml-2">
                    {t('schedule.session.next')}
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimezones(!showTimezones)}
                  className="ml-auto text-xs bg-gradient-to-r from-civeni-blue to-civeni-red text-white hover:opacity-90 hover:text-white"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  {showTimezones ? t('schedule.session.hideTimezones') : t('schedule.session.showTimezones')}
                </Button>
              </div>
              
              {showTimezones && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <TimezonesDisplay 
                    startTime={session.start_at} 
                    endTime={session.end_at}
                  />
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {getTranslatedSessionTitle(session.title)}
            </h3>

            {session.description && (
              <div 
                className="text-muted-foreground text-sm mb-3 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getTranslatedSessionDescription(session.description) }}
              />
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getSessionTypeColor(session.session_type)}>
                {getTranslatedSessionType(session.session_type)}
              </Badge>
              
              <Badge className={getModalityColor(session.modality)}>
                {getTranslatedModality(session.modality)}
              </Badge>

              {session.is_parallel && (
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {t('schedule.session.parallel')}
                </Badge>
              )}

              {session.is_featured && (
                <Badge variant="secondary">
                  ⭐ {t('schedule.session.featured')}
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
              className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red text-white border-0 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('schedule.buttons.addToCalendar')}
            </Button>

            {session.livestream_url && (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => window.open(session.livestream_url, '_blank')}
                className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red text-white border-0 hover:opacity-90"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('schedule.buttons.watchOnline')}
              </Button>
            )}

            {session.materials_url && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => window.open(session.materials_url, '_blank')}
                className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red text-white border-0 hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('schedule.buttons.materials')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
