import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Play, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TransmissaoLive {
  id: string;
  titulo: string;
  descricao?: string;
  url_embed: string;
  data_hora_inicio?: string;
  status: string;
  created_at: string;
}

const TransmissaoLiveManager = () => {
  const { toast } = useToast();
  const [transmissoes, setTransmissoes] = useState<TransmissaoLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TransmissaoLive | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url_embed: '',
    data_hora_inicio: '',
    status: 'inativo'
  });

  useEffect(() => {
    loadTransmissoes();
  }, []);

  const loadTransmissoes = async () => {
    try {
      const { data, error } = await supabase
        .from('transmissoes_live')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransmissoes(data || []);
    } catch (error) {
      console.error('Error loading transmissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transmissões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('transmissoes_live')
          .update(formData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Transmissão atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('transmissoes_live')
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Transmissão criada com sucesso",
        });
      }
      
      setDialogOpen(false);
      resetForm();
      loadTransmissoes();
    } catch (error) {
      console.error('Error saving transmissão:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar transmissão",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transmissão?')) return;
    
    try {
      const { error } = await supabase
        .from('transmissoes_live')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Transmissão excluída com sucesso",
      });
      
      loadTransmissoes();
    } catch (error) {
      console.error('Error deleting transmissão:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transmissão",
        variant: "destructive",
      });
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('transmissoes_live')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Transmissão ${newStatus === 'ativo' ? 'ativada' : 'desativada'}`,
      });
      
      loadTransmissoes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (transmissao: TransmissaoLive) => {
    setEditingItem(transmissao);
    setFormData({
      titulo: transmissao.titulo,
      descricao: transmissao.descricao || '',
      url_embed: transmissao.url_embed,
      data_hora_inicio: transmissao.data_hora_inicio ? new Date(transmissao.data_hora_inicio).toISOString().slice(0, 16) : '',
      status: transmissao.status
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      url_embed: '',
      data_hora_inicio: '',
      status: 'inativo'
    });
    setEditingItem(null);
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transmissão Ao Vivo</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transmissão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Transmissão' : 'Nova Transmissão'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="url_embed">URL do YouTube</Label>
                <Input
                  id="url_embed"
                  value={formData.url_embed}
                  onChange={(e) => setFormData({ ...formData, url_embed: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="data_hora_inicio">Data e Hora de Início</Label>
                <Input
                  id="data_hora_inicio"
                  type="datetime-local"
                  value={formData.data_hora_inicio}
                  onChange={(e) => setFormData({ ...formData, data_hora_inicio: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'ativo'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, status: checked ? 'ativo' : 'inativo' })
                  }
                />
                <Label htmlFor="status">Ativo</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {transmissoes.map((transmissao) => (
          <Card key={transmissao.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{transmissao.titulo}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={transmissao.status === 'ativo' ? 'default' : 'secondary'}>
                      {transmissao.status === 'ativo' ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                    {transmissao.data_hora_inicio && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(transmissao.data_hora_inicio).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(transmissao.id, transmissao.status)}
                  >
                    {transmissao.status === 'ativo' ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(transmissao)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(transmissao.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {transmissao.descricao && (
                <p className="text-sm text-muted-foreground mb-3">
                  {transmissao.descricao}
                </p>
              )}
              
              {transmissao.url_embed && extractYouTubeId(transmissao.url_embed) && (
                <div className="aspect-video w-full max-w-md">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(transmissao.url_embed)}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-md"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {transmissoes.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transmissão cadastrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TransmissaoLiveManager;