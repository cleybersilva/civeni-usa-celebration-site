import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Save, HelpCircle } from 'lucide-react';

interface FAQItem {
  id?: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  order_index: number;
  is_active: boolean;
}

const TransmissionFAQManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FAQItem>({
    question: { pt: '', en: '', es: '', tr: '' },
    answer: { pt: '', en: '', es: '', tr: '' },
    order_index: 1,
    is_active: true
  });

  const { data: faqItems, isLoading } = useQuery({
    queryKey: ['admin-transmission-faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_faq')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (item: FAQItem) => {
      if (item.id) {
        const { error } = await supabase
          .from('transmission_faq')
          .update(item)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transmission_faq')
          .insert([item]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transmission-faq'] });
      toast.success('FAQ salvo com sucesso!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transmission_faq')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transmission-faq'] });
      toast.success('FAQ removido!');
    }
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      question: { pt: '', en: '', es: '', tr: '' },
      answer: { pt: '', en: '', es: '', tr: '' },
      order_index: 1,
      is_active: true
    });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleSave = () => {
    if (!formData.question.pt || !formData.answer.pt) {
      toast.error('Preencha pergunta e resposta em português');
      return;
    }
    saveMutation.mutate(editingId ? { ...formData, id: editingId } : formData);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Gerenciar FAQ da Transmissão</h2>
        <Button onClick={resetForm} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nova Pergunta
        </Button>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {(['pt', 'en', 'es', 'tr'] as const).map((lang) => (
            <div key={lang} className="space-y-2">
              <Label>Pergunta ({lang.toUpperCase()})</Label>
              <Textarea
                value={formData.question[lang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    question: { ...formData.question, [lang]: e.target.value }
                  })
                }
                placeholder={`Pergunta em ${lang.toUpperCase()}`}
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(['pt', 'en', 'es', 'tr'] as const).map((lang) => (
            <div key={lang} className="space-y-2">
              <Label>Resposta ({lang.toUpperCase()})</Label>
              <Textarea
                value={formData.answer[lang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    answer: { ...formData.answer, [lang]: e.target.value }
                  })
                }
                placeholder={`Resposta em ${lang.toUpperCase()}`}
                rows={4}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Ativo</Label>
          </div>

          <div className="space-y-2">
            <Label>Ordem</Label>
            <Input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
              className="w-20"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            {editingId ? 'Atualizar' : 'Criar'}
          </Button>
          {editingId && (
            <Button onClick={resetForm} variant="outline">
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      <div className="grid gap-4">
        {faqItems?.map((item) => {
          const question = item.question as unknown as Record<string, string>;
          const answer = item.answer as unknown as Record<string, string>;
          
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    {!item.is_active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">{question.pt}</h3>
                  <p className="text-sm text-gray-600">{answer.pt}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TransmissionFAQManager;
