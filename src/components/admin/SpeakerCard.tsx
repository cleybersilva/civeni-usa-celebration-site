
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { Speaker } from '@/contexts/CMSContext';

interface SpeakerCardProps {
  speaker: Speaker;
  onEdit: (speaker: Speaker) => void;
  onDelete: (speakerId: string) => void;
}

const SpeakerCard = ({ speaker, onEdit, onDelete }: SpeakerCardProps) => {
  return (
    <Card key={speaker.id}>
      <CardHeader className="pb-2">
        <img
          src={speaker.name.includes('Maria Rodriguez') ? 
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' : 
            speaker.image
          }
          alt={speaker.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-2">{speaker.name}</CardTitle>
        <p className="text-sm text-civeni-red font-semibold mb-1">{speaker.title}</p>
        <p className="text-sm text-gray-600 mb-2">{speaker.institution}</p>
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{speaker.bio}</p>
        <div className="flex justify-end space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(speaker)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(speaker.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerCard;
