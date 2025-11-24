
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Speaker } from '@/contexts/CMSContext';
import SpeakerForm from './SpeakerForm';
import ImageGuide from './ImageGuide';

interface SpeakerFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSpeaker: Speaker | null;
  formData: {
    name: string;
    title: string;
    institution: string;
    image: string;
    bio: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

const SpeakerFormDialog = ({
  isOpen,
  onOpenChange,
  editingSpeaker,
  formData,
  setFormData,
  onSubmit,
  isLoading = false
}: SpeakerFormDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSpeaker ? 'Editar Palestrante' : 'Adicionar Palestrante'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpeakerForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={onSubmit}
              onCancel={() => onOpenChange(false)}
              editingSpeaker={editingSpeaker}
              isLoading={isLoading}
            />
          </div>
          
          <div>
            <ImageGuide type="speaker" title="Palestrante" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpeakerFormDialog;
