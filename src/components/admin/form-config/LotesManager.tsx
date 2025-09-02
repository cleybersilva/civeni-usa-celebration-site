import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Lote {
  id: string;
  nome: string;
  price_cents: number;
  dt_inicio: string;
  dt_fim: string;
  ativo: boolean;
  created_at: string;
}

const LotesManager = () => {
  const { t } = useTranslation();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    price_cents: '',
    dt_inicio: '',
    dt_fim: '',
    ativo: true
  });

  useEffect(() => {
    loadLotes();
    
    // Configurar realtime para sincronização
    const channel = supabase.channel('lotes-sync');
    channel.on('broadcast', { event: 'REFRESH' }, () => {
      loadLotes();
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLotes = async () => {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select('*')
        .order('dt_inicio', { ascending: true });

      if (error) throw error;
      setLotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      toast.error('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      price_cents: '',
      dt_inicio: '',
      dt_fim: '',
      ativo: true
    });
    setEditingLote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.price_cents || !formData.dt_inicio || !formData.dt_fim) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (parseInt(formData.price_cents) <= 0) {
      toast.error('O preço deve ser maior que zero');
      return;
    }

    if (new Date(formData.dt_inicio) > new Date(formData.dt_fim)) {
      toast.error('Data de início deve ser anterior à data de fim');
      return;
    }

    try {
      const loteData = {
        nome: formData.nome.trim(),
        price_cents: parseInt(formData.price_cents),
        dt_inicio: formData.dt_inicio,
        dt_fim: formData.dt_fim,
        ativo: formData.ativo
      };

      if (editingLote) {
        const { error } = await supabase
          .from('lotes')
          .update(loteData)
          .eq('id', editingLote.id);

        if (error) throw error;
        toast.success('Lote atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('lotes')  
          .insert([loteData]);

        if (error) throw error;
        toast.success('Lote criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadLotes();

      // Notificar site para atualizar
      const channel = supabase.channel('lotes-sync');
      channel.send({
        type: 'broadcast',
        event: 'REFRESH',
        payload: {}
      });
      
    } catch (error: any) { 
      console.error('Erro ao salvar lote:', error);
      
      if (error.message?.includes('sobreposto')) {
        toast.error('Erro: Intervalo de datas sobreposto com outro lote ativo.');
      } else {
        toast.error('Erro ao salvar lote. Tente novamente.');
      }
    }
  };

  const handleEdit = (lote: Lote) => {
    setEditingLote(lote);
    setFormData({
      nome: lote.nome,
      price_cents: lote.price_cents.toString(),
      dt_inicio: lote.dt_inicio,
      dt_fim: lote.dt_fim,
      ativo: lote.ativo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Lote excluído com sucesso!');
      loadLotes();

      // Notificar site para atualizar
      const channel = supabase.channel('lotes-sync');
      channel.send({
        type: 'broadcast',
        event: 'REFRESH',
        payload: {}
      });
      
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      toast.error('Erro ao excluir lote. Tente novamente.');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const isLoteVigente = (lote: Lote) => {
    if (!lote.ativo) return false;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicio = new Date(lote.dt_inicio + 'T00:00:00');
    const fim = new Date(lote.dt_fim + 'T00:00:00');
    
    return hoje >= inicio && hoje <= fim;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando lotes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Lotes</h3>
          <p className="text-sm text-muted-foreground">
            Configure os lotes de inscrição com preços e períodos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>  
              <DialogTitle>
                {editingLote ? 'Editar Lote' : 'Novo Lote'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Lote</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Lote Lançamento, 1º Lote..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="price_cents">Preço (em centavos)</Label>
                <Input
                  id="price_cents"
                  type="number"
                  min="1"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                  placeholder="Ex: 7500 para R$ 75,00"
                  required
                />
                {formData.price_cents && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor: {formatPrice(parseInt(formData.price_cents) || 0)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dt_inicio">Data de Início</Label>
                  <Input
                    id="dt_inicio"
                    type="date"
                    value={formData.dt_inicio}
                    onChange={(e) => setFormData({ ...formData, dt_inicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dt_fim">Data de Fim</Label>
                  <Input
                    id="dt_fim"
                    type="date"
                    value={formData.dt_fim}
                    onChange={(e) => setFormData({ ...formData, dt_fim: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              <Label htmlFor="ativo">Lote ativo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingLote ? 'Atualizar' : 'Criar'} Lote
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum lote configurado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotes.map((lote) => (
                <TableRow key={lote.id}>
                  <TableCell className="font-medium">
                    {lote.nome}
                    {isLoteVigente(lote) && (
                      <Badge variant="default" className="ml-2">
                        VIGENTE
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(lote.price_cents)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDate(lote.dt_inicio)} até {formatDate(lote.dt_fim)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lote.ativo ? "default" : "secondary"}>
                      {lote.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lote)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lote.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default LotesManager;