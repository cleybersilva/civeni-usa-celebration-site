import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Video, Lock } from 'lucide-react';

interface MeetRoom {
  id: string;
  name: string;
  status: 'idle' | 'live' | 'ended';
  moderators: string[];
  capacity: number;
  visibility: string;
  notes: string | null;
}

interface MeetRoomCardProps {
  room: MeetRoom;
}

const MeetRoomCard = ({ room }: MeetRoomCardProps) => {
  const { t } = useTranslation();

  const getStatusBadge = () => {
    switch (room.status) {
      case 'live':
        return (
          <Badge className="bg-green-600 text-white">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {t('transmission.badges.live')}
            </span>
          </Badge>
        );
      case 'ended':
        return <Badge variant="secondary">{t('transmission.badges.ended')}</Badge>;
      default:
        return <Badge variant="outline">{t('transmission.badges.scheduled')}</Badge>;
    }
  };

  const isLocked = room.visibility === 'enrolled_only' || room.visibility === 'staff_only';

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{room.name}</h3>
          {room.notes && (
            <p className="text-sm text-muted-foreground">{room.notes}</p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {t('transmission.capacity')}: {room.capacity}
          </span>
        </div>
        
        {room.moderators && room.moderators.length > 0 && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Users className="w-4 h-4 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{t('transmission.moderators')}:</span>
              {room.moderators.map((mod, idx) => (
                <span key={idx} className="text-xs">{mod}</span>
              ))}
            </div>
          </div>
        )}

        {isLocked && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <Lock className="w-4 h-4" />
            <span className="text-xs">
              {room.visibility === 'staff_only' 
                ? t('transmission.staffOnly')
                : t('transmission.enrolledOnly')}
            </span>
          </div>
        )}
      </div>

      {/* Action */}
      <Button 
        size="sm"
        className={`inline-flex items-center justify-center px-4 py-1.5 text-xs sm:text-sm md:text-sm md:min-w-[180px] md:max-w-[220px] rounded-full bg-gradient-to-r from-civeni-blue to-civeni-red text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mx-auto md:mx-0 ${room.status === 'live' ? 'pulse' : ''}`}
        variant={room.status === 'live' ? 'default' : 'outline'}
        disabled={room.status === 'ended'}
      >
        <Video className="w-4 h-4 mr-2" />
        {room.status === 'live' ? t('transmission.joinRoom') : t('transmission.waitingToStart')}
      </Button>
    </Card>
  );
};

export default MeetRoomCard;
