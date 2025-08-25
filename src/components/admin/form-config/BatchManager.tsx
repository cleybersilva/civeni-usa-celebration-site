import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useBatches } from '@/hooks/useBatches';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BatchFormData {
  batch_number: number;
  start_date: string;
  end_date: string;
}

const BatchManager = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<BatchFormData>({
    batch_number: 1,
    start_date: '',
    end_date: ''
  });

  // Load batches
  React.useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('registration_batches')
        .select('*')
        .order('batch_number', { ascending: true });
      
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.loadError', 'Erro ao carregar dados'),
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      batch_number: batches.length + 1,
      start_date: '',
      end_date: ''
    });
    setEditingBatch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) return;
    
    setLoading(true);
    try {
      if (editingBatch) {
        const { error } = await supabase
          .from('registration_batches')
          .update({
            batch_number: formData.batch_number,
            start_date: formData.start_date,
            end_date: formData.end_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBatch.id);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.batchUpdated', 'Lote atualizado com sucesso')
        });
      } else {
        const { error } = await supabase
          .from('registration_batches')
          .insert([{
            batch_number: formData.batch_number,
            start_date: formData.start_date,
            end_date: formData.end_date
          }]);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.batchCreated', 'Lote criado com sucesso')
        });
      }
      
      await loadBatches();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving batch:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch: any) => {
    setEditingBatch(batch);
    setFormData({
      batch_number: batch.batch_number,
      start_date: batch.start_date,
      end_date: batch.end_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.formConfig.confirmDelete', 'Tem certeza que deseja excluir?'))) return;
    
    try {
      const { error } = await supabase
        .from('registration_batches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadBatches();
      toast({
        title: t('admin.formConfig.success', 'Sucesso'),
        description: t('admin.formConfig.batchDeleted', 'Lote excluído com sucesso')
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.deleteError', 'Erro ao excluir'),
        variant: 'destructive'
      });
    }
  };

  const isActiveBatch = (batch: any) => {
    const now = new Date();
    const startDate = new Date(batch.start_date);
    const endDate = new Date(batch.end_date);
    return now >= startDate && now <= endDate;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {t('admin.formConfig.registrationBatches', 'Lotes de Inscrição')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('admin.formConfig.batchesDescription', 'Configure os períodos de inscrição e seus prazos')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.formConfig.addBatch', 'Adicionar Lote')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBatch 
                  ? t('admin.formConfig.editBatch', 'Editar Lote')
                  : t('admin.formConfig.addBatch', 'Adicionar Lote')
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="batch_number">
                  {t('admin.formConfig.batchNumber', 'Número do Lote')}
                </Label>
                <Input
                  id="batch_number"
                  type="number"
                  min="1"
                  value={formData.batch_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_number: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_date">
                  {t('admin.formConfig.startDate', 'Data de Início')}
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">
                  {t('admin.formConfig.endDate', 'Data de Fim')}
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('admin.formConfig.cancel', 'Cancelar')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t('admin.formConfig.saving', 'Salvando...') : t('admin.formConfig.save', 'Salvar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {t('admin.formConfig.noBatches', 'Nenhum lote configurado')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.formConfig.batchesList', 'Lotes Configurados')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.formConfig.batchNumber', 'Lote')}</TableHead>
                  <TableHead>{t('admin.formConfig.startDate', 'Data de Início')}</TableHead>
                  <TableHead>{t('admin.formConfig.endDate', 'Data de Fim')}</TableHead>
                  <TableHead>{t('admin.formConfig.status', 'Status')}</TableHead>
                  <TableHead>{t('admin.formConfig.actions', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      {t('admin.formConfig.batchLabel', 'Lote')} {batch.batch_number}
                    </TableCell>
                    <TableCell>
                      {new Date(batch.start_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(batch.end_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isActiveBatch(batch) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActiveBatch(batch) 
                          ? t('admin.formConfig.active', 'Ativo')
                          : t('admin.formConfig.inactive', 'Inativo')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(batch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchManager;