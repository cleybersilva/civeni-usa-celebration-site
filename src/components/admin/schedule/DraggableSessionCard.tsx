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
      className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary/50 hover:border-l-primary animate-fade-in"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          <button
            className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm">
                {formatTime(session.start_at)}
                {session.end_at && ` - ${formatTime(session.end_at)}`}
              </span>
              <Badge className={getSessionTypeColor(session.session_type)}>
                {session.session_type}
              </Badge>
              {session.is_parallel && (
                <Badge variant="outline">Simultânea</Badge>
              )}
              {session.is_featured && (
                <Badge variant="secondary">Destaque</Badge>
              )}
              <Badge variant={session.is_published ? "default" : "secondary"}>
                {session.is_published ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
            <h5 className="font-medium mb-1">{session.title}</h5>
            {session.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {session.description}
              </p>
            )}
            {session.room && (
              <p className="text-xs text-muted-foreground">
                📍 {session.room}
              </p>
            )}
            {session.livestream_url && (
              <p className="text-xs text-blue-600 mt-1">
                🔗 Link de transmissão configurado
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTogglePublish(session.id, session.is_published)}
          >
            {session.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(session)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(session.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
