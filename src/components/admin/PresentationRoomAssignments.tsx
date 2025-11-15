import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { usePresentationRoomDetails } from '@/hooks/usePresentationRooms';

interface AssignmentFormData {
  submission_id: string;
  ordem_apresentacao: number;
  inicio_apresentacao: string;
  fim_apresentacao: string;
  observacoes: string;
}

interface Props {
  roomId: string;
  onBack: () => void;
}

export const PresentationRoomAssignments = ({ roomId, onBack }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: roomDetails } = usePresentationRoomDetails(roomId);

  const [formData, setFormData] = useState<AssignmentFormData>({
    submission_id: '',
    ordem_apresentacao: 1,
    inicio_apresentacao: '',
    fim_apresentacao: '',
    observacoes: '',
  });

  // Buscar submissões para atribuir
  const { data: availableSubmissions } = useQuery({
    queryKey: ['available-submissions', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('submissions')
        .select('*')
        .eq('status', 'validado')
        .limit(20);

      if (searchTerm) {
        query = query.or(
          `autor_principal.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,titulo.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar submissões já atribuídas a esta sala
      const alreadyAssigned = new Set(
        roomDetails?.assignments?.map((a) => a.submission_id) || []
      );
      return data?.filter((s) => !alreadyAssigned.has(s.id)) || [];
    },
    enabled: isDialogOpen,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const { error } = await supabase
        .from('presentation_room_assignments')
        .insert([{ ...data, room_id: roomId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-room-details'] });
      toast.success('Trabalho adicionado à sala!');
      setIsDialogOpen(false);
      setSelectedSubmission(null);
      setFormData({
        submission_id: '',
        ordem_apresentacao: 1,
        inicio_apresentacao: '',
        fim_apresentacao: '',
        observacoes: '',
      });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar trabalho: ${error.message}`);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('presentation_room_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-room-details'] });
      toast.success('Trabalho removido da sala!');
    },
    onError: (error) => {
      toast.error(`Erro ao remover trabalho: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) {
      toast.error('Selecione uma submissão');
      return;
    }
    createAssignmentMutation.mutate({
      ...formData,
      submission_id: selectedSubmission.id,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este trabalho da sala?')) {
      deleteAssignmentMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{roomDetails?.nome_sala}</h2>
            <p className="text-sm text-muted-foreground">
              {roomDetails?.data_apresentacao &&
                format(new Date(roomDetails.data_apresentacao), 'dd/MM/yyyy')}{' '}
              • {roomDetails?.horario_inicio_sala} - {roomDetails?.horario_fim_sala}
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Trabalho
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Trabalho à Sala</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Busca de submissões */}
              {!selectedSubmission && (
                <>
                  <div>
                    <Label>Buscar Submissão</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome, email ou título do trabalho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button type="button" variant="outline">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableSubmissions?.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.autor_principal}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {submission.titulo}
                            </TableCell>
                            <TableCell>{submission.tipo}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Formulário de detalhes */}
              {selectedSubmission && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Card className="p-4 bg-muted">
                    <h4 className="font-semibold mb-2">Submissão Selecionada:</h4>
                    <p className="text-sm">
                      <strong>Aluno:</strong> {selectedSubmission.autor_principal}
                    </p>
                    <p className="text-sm">
                      <strong>Título:</strong> {selectedSubmission.titulo}
                    </p>
                    <p className="text-sm">
                      <strong>Tipo:</strong> {selectedSubmission.tipo}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSelectedSubmission(null)}
                    >
                      Trocar submissão
                    </Button>
                  </Card>

                  <div>
                    <Label htmlFor="ordem_apresentacao">
                      Ordem da Apresentação *
                    </Label>
                    <Input
                      id="ordem_apresentacao"
                      type="number"
                      min="1"
                      value={formData.ordem_apresentacao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ordem_apresentacao: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inicio_apresentacao">
                        Horário de Início *
                      </Label>
                      <Input
                        id="inicio_apresentacao"
                        type="time"
                        value={formData.inicio_apresentacao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            inicio_apresentacao: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="fim_apresentacao">
                        Horário de Término *
                      </Label>
                      <Input
                        id="fim_apresentacao"
                        type="time"
                        value={formData.fim_apresentacao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fim_apresentacao: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) =>
                        setFormData({ ...formData, observacoes: e.target.value })
                      }
                      placeholder="Observações sobre a apresentação"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setSelectedSubmission(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Adicionar</Button>
                  </div>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Trabalhos da Sala</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordem</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Título do Trabalho</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomDetails?.assignments?.map((assignment: any) => (
              <TableRow key={assignment.id}>
                <TableCell>{assignment.ordem_apresentacao}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(
                    new Date(assignment.inicio_apresentacao),
                    'HH:mm'
                  )}{' '}
                  -{' '}
                  {format(new Date(assignment.fim_apresentacao), 'HH:mm')}
                </TableCell>
                <TableCell className="font-medium">
                  {assignment.submission?.autor_principal}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {assignment.submission?.titulo}
                </TableCell>
                <TableCell>{assignment.submission?.tipo}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!roomDetails?.assignments?.length && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum trabalho atribuído a esta sala ainda.
          </div>
        )}
      </Card>
    </div>
  );
};
