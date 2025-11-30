import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';

interface DraggableSessionCardProps {
  session: any;
  formatTime: (time: string) => string;
  getSessionTypeColor: (type: string) => string;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onEdit: (session: any) => void;
  onDelete: (id: string) => void;
}

export const DraggableSessionCard: React.FC<DraggableSessionCardProps> = ({
  session,
  formatTime,
  getSessionTypeColor,
  onTogglePublish,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 sm:p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary/50 hover:border-l-primary animate-fade-in"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="font-mono text-xs sm:text-sm">
                {formatTime(session.start_at)}
                {session.end_at && ` - ${formatTime(session.end_at)}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 mb-2">
              <Badge className={`text-[10px] sm:text-xs ${getSessionTypeColor(session.session_type)}`}>
                {session.session_type}
              </Badge>
              {session.is_parallel && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">Simultânea</Badge>
              )}
              {session.is_featured && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">Destaque</Badge>
              )}
              <Badge variant={session.is_published ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                {session.is_published ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
            <h5 className="font-medium text-sm sm:text-base mb-1">{session.title}</h5>
            {session.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {session.description}
              </p>
            )}
            {session.room && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                📍 {session.room}
              </p>
            )}
            {session.livestream_url && (
              <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                🔗 Link de transmissão configurado
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onTogglePublish(session.id, session.is_published)}
          >
            {session.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(session)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onDelete(session.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
