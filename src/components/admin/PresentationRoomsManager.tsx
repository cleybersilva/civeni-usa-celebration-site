import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { format, parse } from 'date-fns';
import { PresentationRoomAssignments } from './PresentationRoomAssignments';
import { usePresentationRooms } from '@/hooks/usePresentationRooms';

interface RoomFormData {
  nome_sala: string;
  descricao_sala: string;
  meet_link: string;
  data_apresentacao: string;
  horario_inicio_sala: string;
  horario_fim_sala: string;
  status: 'rascunho' | 'publicado' | 'inativo';
  responsavel_sala: string;
}

export const PresentationRoomsManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { data: rooms, isLoading } = usePresentationRooms(false);

  const [formData, setFormData] = useState<RoomFormData>({
    nome_sala: '',
    descricao_sala: '',
    meet_link: '',
    data_apresentacao: '',
    horario_inicio_sala: '',
    horario_fim_sala: '',
    status: 'rascunho',
    responsavel_sala: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;

      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          throw new Error('Sessão administrativa inválida. Faça login novamente.');
        }
      }

      if (!sessionEmail || !sessionToken) {
        throw new Error('Sessão administrativa inválida. Faça login novamente.');
      }

      const { data: result, error } = await supabase.rpc(
        'admin_upsert_presentation_room',
        {
          room_data: data as any,
          user_email: sessionEmail,
          session_token: sessionToken,
        }
      );
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-rooms'] });
      toast.success('Sala criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.message || String(error);
      if (message.includes('invalid or expired session')) {
        toast.error('Sua sessão expirou. Faça login novamente para continuar.');
      } else {
        toast.error(`Erro ao criar sala: ${message}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoomFormData }) => {
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;

      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          throw new Error('Sessão administrativa inválida. Faça login novamente.');
        }
      }

      if (!sessionEmail || !sessionToken) {
        throw new Error('Sessão administrativa inválida. Faça login novamente.');
      }

      const { data: result, error } = await supabase.rpc(
        'admin_upsert_presentation_room',
        {
          room_data: { ...data, id } as any,
          user_email: sessionEmail,
          session_token: sessionToken,
        }
      );
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-rooms'] });
      toast.success('Sala atualizada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.message || String(error);
      if (message.includes('invalid or expired session')) {
        toast.error('Sua sessão expirou. Faça login novamente para continuar.');
      } else {
        toast.error(`Erro ao atualizar sala: ${message}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;

      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          throw new Error('Sessão administrativa inválida. Faça login novamente.');
        }
      }

      if (!sessionEmail || !sessionToken) {
        throw new Error('Sessão administrativa inválida. Faça login novamente.');
      }

      const { data: result, error } = await supabase.rpc(
        'admin_delete_presentation_room',
        {
          room_id: id,
          user_email: sessionEmail,
          session_token: sessionToken,
        }
      );
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-rooms'] });
      toast.success('Sala excluída com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.message || String(error);
      if (message.includes('invalid or expired session')) {
        toast.error('Sua sessão expirou. Faça login novamente para continuar.');
      } else {
        toast.error(`Erro ao excluir sala: ${message}`);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      nome_sala: '',
      descricao_sala: '',
      meet_link: '',
      data_apresentacao: '',
      horario_inicio_sala: '',
      horario_fim_sala: '',
      status: 'rascunho',
      responsavel_sala: '',
    });
    setEditingRoom(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.meet_link.startsWith('https://meet.google.com')) {
      toast.error('O link do Meet deve começar com https://meet.google.com');
      return;
    }

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      nome_sala: room.nome_sala,
      descricao_sala: room.descricao_sala || '',
      meet_link: room.meet_link,
      data_apresentacao: room.data_apresentacao,
      horario_inicio_sala: room.horario_inicio_sala,
      horario_fim_sala: room.horario_fim_sala,
      status: room.status,
      responsavel_sala: room.responsavel_sala || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta sala?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredRooms = rooms?.filter((room) => {
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      room.nome_sala.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      rascunho: 'secondary',
      publicado: 'default',
      inativo: 'outline',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (selectedRoomId) {
    return (
      <PresentationRoomAssignments
        roomId={selectedRoomId}
        onBack={() => setSelectedRoomId(null)}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Salas de Apresentação</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Sala
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Editar Sala' : 'Nova Sala'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome_sala">Nome da Sala *</Label>
                <Input
                  id="nome_sala"
                  value={formData.nome_sala}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_sala: e.target.value })
                  }
                  required
                  placeholder="Ex: Sala 01 – Artigos Educação"
                />
              </div>

              <div>
                <Label htmlFor="descricao_sala">Descrição</Label>
                <Textarea
                  id="descricao_sala"
                  value={formData.descricao_sala}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao_sala: e.target.value })
                  }
                  placeholder="Observações gerais sobre a sala"
                />
              </div>

              <div>
                <Label htmlFor="meet_link">Link do Google Meet *</Label>
                <Input
                  id="meet_link"
                  type="url"
                  value={formData.meet_link}
                  onChange={(e) =>
                    setFormData({ ...formData, meet_link: e.target.value })
                  }
                  required
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="data_apresentacao">Data *</Label>
                  <Input
                    id="data_apresentacao"
                    type="date"
                    value={formData.data_apresentacao}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_apresentacao: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="horario_inicio_sala">Início *</Label>
                  <Input
                    id="horario_inicio_sala"
                    type="time"
                    value={formData.horario_inicio_sala}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        horario_inicio_sala: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="horario_fim_sala">Término *</Label>
                  <Input
                    id="horario_fim_sala"
                    type="time"
                    value={formData.horario_fim_sala}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        horario_fim_sala: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="responsavel_sala">Responsável</Label>
                <Input
                  id="responsavel_sala"
                  value={formData.responsavel_sala}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel_sala: e.target.value })
                  }
                  placeholder="Nome do moderador/avaliador"
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRoom ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Buscar por nome da sala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="publicado">Publicado</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Sala</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trabalhos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms?.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.nome_sala}</TableCell>
                  <TableCell>
                    {room.data_apresentacao
                      ? format(
                          parse(room.data_apresentacao, 'yyyy-MM-dd', new Date()),
                          'dd/MM/yyyy'
                        )
                      : ''}
                  </TableCell>
                  <TableCell>
                    {room.horario_inicio_sala} - {room.horario_fim_sala}
                  </TableCell>
                  <TableCell>{getStatusBadge(room.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Gerenciar
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(room)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(room.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
