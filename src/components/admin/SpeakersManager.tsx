
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCMS, Speaker } from '@/contexts/CMSContext';
import { Plus } from 'lucide-react';
import SpeakerCard from './SpeakerCard';
import SpeakerFormDialog from './SpeakerFormDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const SpeakersManager = () => {
  const { content, updateSpeakers } = useCMS();
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    institution: '',
    image: '',
    bio: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      institution: '',
      image: '',
      bio: ''
    });
    setEditingSpeaker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const speakers = [...content.speakers];
      
      if (editingSpeaker) {
        const index = speakers.findIndex(s => s.id === editingSpeaker.id);
        speakers[index] = {
          ...editingSpeaker,
          ...formData
        };
      } else {
        const newSpeaker: Speaker = {
          id: 'new',
          ...formData,
          order: speakers.length + 1
        };
        speakers.push(newSpeaker);
      }

      await updateSpeakers(speakers);
      toast.success(editingSpeaker ? 'Palestrante atualizado com sucesso!' : 'Palestrante adicionado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving speaker:', error);
      toast.error('Erro ao salvar palestrante');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      title: speaker.title,
      institution: speaker.institution,
      image: speaker.image,
      bio: speaker.bio
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (speakerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este palestrante?')) {
      return;
    }

    try {
      console.log('Deleting speaker:', speakerId);

      // Recuperar sessão admin
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '' as string;
      let sessionToken: string | undefined;
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Falha ao ler a sessão admin do localStorage');
        }
      }

      if (!sessionEmail || !sessionToken) {
        toast.error('Sessão administrativa inválida. Faça login novamente.');
        return;
      }

      // Deletar via função segura
      const { data: deleteResult, error: deleteError } = await supabase.rpc('admin_delete_speaker', {
        speaker_id: speakerId,
        user_email: sessionEmail,
        session_token: sessionToken,
      });

      if (deleteError) {
        console.error('Erro ao deletar speaker:', deleteError);
        toast.error('Erro ao deletar palestrante: ' + deleteError.message);
        return;
      }

      if ((deleteResult as any)?.success) {
        toast.success('Palestrante deletado com sucesso!');
        
        // Recarregar speakers do banco
        const { data: updatedSpeakers, error: loadError } = await supabase
          .from('cms_speakers')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!loadError && updatedSpeakers) {
          const speakersFormatted = updatedSpeakers.map((speaker: any) => ({
            id: speaker.id,
            name: speaker.name,
            title: speaker.title,
            institution: speaker.institution,
            image: speaker.image_url || '',
            bio: speaker.bio,
            order: speaker.order_index
          }));
          
          // Forçar atualização do contexto
          window.location.reload(); // Temporário para garantir sincronização
        }
      } else {
        toast.error('Erro ao deletar palestrante');
      }
    } catch (error) {
      console.error('Error deleting speaker:', error);
      toast.error('Erro ao deletar palestrante');
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = content.speakers.findIndex(s => s.id === active.id);
    const newIndex = content.speakers.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedSpeakers = arrayMove(content.speakers, oldIndex, newIndex);
    
    // Atualizar a ordem localmente primeiro para feedback imediato
    const speakersWithNewOrder = reorderedSpeakers.map((speaker, index) => ({
      ...speaker,
      order: index + 1
    }));

    // Atualizar contexto imediatamente para feedback visual
    await updateSpeakers(speakersWithNewOrder);

    // Salvar nova ordem no banco em background
    try {
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Falha ao ler a sessão admin');
        }
      }

      if (!sessionEmail || !sessionToken) {
        toast.error('Sessão administrativa inválida');
        return;
      }

      // Atualizar ordem de cada speaker no banco
      const updatePromises = speakersWithNewOrder.map(speaker =>
        supabase.rpc('admin_upsert_speaker', {
          speaker_data: {
            id: speaker.id,
            name: speaker.name,
            title: speaker.title,
            institution: speaker.institution,
            bio: speaker.bio,
            image_url: speaker.image,
            order_index: speaker.order,
            is_active: true
          },
          user_email: sessionEmail,
          session_token: sessionToken
        })
      );

      await Promise.all(updatePromises);
      toast.success('Ordem dos palestrantes atualizada!');
    } catch (error) {
      console.error('Erro ao reordenar palestrantes:', error);
      toast.error('Erro ao salvar a nova ordem');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Palestrantes</h2>
        <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Palestrante
        </Button>
      </div>

      <SpeakerFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingSpeaker={editingSpeaker}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={content.speakers.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {content.speakers.map((speaker) => (
              <SpeakerCard
                key={speaker.id}
                speaker={speaker}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SpeakersManager;
