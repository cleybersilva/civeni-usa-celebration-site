
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { Speaker } from '@/contexts/CMSContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SpeakerCardProps {
  speaker: Speaker;
  onEdit: (speaker: Speaker) => void;
  onDelete: (speakerId: string) => void;
}

const SpeakerCard = ({ speaker, onEdit, onDelete }: SpeakerCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: speaker.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'shadow-lg ring-2 ring-civeni-blue' : ''}
    >
      <CardHeader className="pb-2 relative">
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing z-10 bg-white/80 rounded p-1 hover:bg-white"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
        <img
          src={speaker.name.includes('Maria Rodriguez') ? 
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' : 
            speaker.image
          }
          alt={speaker.name}
          className="w-full h-32 object-cover rounded-lg"
        />
      </CardHeader>
      <CardContent className="space-y-2">
        <CardTitle className="text-sm font-semibold">{speaker.name}</CardTitle>
        <p className="text-xs text-civeni-red font-semibold">{speaker.title}</p>
        <p className="text-xs text-gray-600">{speaker.institution}</p>
        <p className="text-xs text-gray-700 line-clamp-2">{speaker.bio}</p>
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(speaker)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(speaker.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerCard;
