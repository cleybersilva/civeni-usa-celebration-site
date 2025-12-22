import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Eye, RefreshCw, Download, ChevronLeft, ChevronRight, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Registrant {
  id: string;
  email: string;
  full_name: string;
  payment_status: string | null;
  amount_paid: number | null;
  currency: string | null;
  coupon_code: string | null;
  payment_method: string | null;
  card_brand: string | null;
  participant_type: string | null;
  created_at: string;
  updated_at: string;
  curso_id: string | null;
  turma_id: string | null;
  stripe_session_id: string | null;
  cursos?: { nome_curso: string } | null;
  turmas?: { nome_turma: string } | null;
}

const RegistrantsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', full_name: '', payment_status: '' });
  
  const pageSize = 20;

  // Fetch registrants
  const { data: registrants = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-registrants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id, email, full_name, payment_status, amount_paid, currency, 
          coupon_code, payment_method, card_brand, participant_type,
          created_at, updated_at, curso_id, turma_id, stripe_session_id,
          cursos(nome_curso),
          turmas(nome_turma)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Registrant[];
    }
  });

  // Fetch cursos for dropdown
  const { data: cursos = [] } = useQuery({
    queryKey: ['cursos-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cursos').select('id, nome_curso');
      if (error) throw error;
      return data;
    }
  });

  // Fetch turmas for dropdown
  const { data: turmas = [] } = useQuery({
    queryKey: ['turmas-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('turmas').select('id, nome_turma, curso_id');
      if (error) throw error;
      return data;
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Registrant> }) => {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          ...data.updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Inscrito atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['admin-registrants'] });
      setIsEditDialogOpen(false);
      setSelectedRegistrant(null);
    },
    onError: (error) => {
      toast({ title: 'Erro', description: `Erro ao atualizar: ${error.message}`, variant: 'destructive' });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Inscrito removido com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['admin-registrants'] });
      setIsDeleteDialogOpen(false);
      setSelectedRegistrant(null);
    },
    onError: (error) => {
      toast({ title: 'Erro', description: `Erro ao excluir: ${error.message}`, variant: 'destructive' });
    }
  });

  // Filter and search
  const filteredRegistrants = useMemo(() => {
    return registrants.filter(r => {
      const matchesSearch = search === '' || 
        r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || r.payment_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [registrants, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRegistrants.length / pageSize);
  const paginatedRegistrants = filteredRegistrants.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const stats = useMemo(() => ({
    total: registrants.length,
    completed: registrants.filter(r => r.payment_status === 'completed').length,
    pending: registrants.filter(r => r.payment_status === 'pending').length,
    other: registrants.filter(r => r.payment_status !== 'completed' && r.payment_status !== 'pending').length
  }), [registrants]);

  // Handle edit
  const handleEdit = (registrant: Registrant) => {
    setSelectedRegistrant(registrant);
    setEditForm({
      email: registrant.email,
      full_name: registrant.full_name,
      payment_status: registrant.payment_status || 'pending'
    });
    setIsEditDialogOpen(true);
  };

  // Handle view
  const handleView = (registrant: Registrant) => {
    setSelectedRegistrant(registrant);
    setIsViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (registrant: Registrant) => {
    setSelectedRegistrant(registrant);
    setIsDeleteDialogOpen(true);
  };

  // Handle save
  const handleSave = () => {
    if (!selectedRegistrant) return;
    
    updateMutation.mutate({
      id: selectedRegistrant.id,
      updates: {
        email: editForm.email.trim().toLowerCase(),
        full_name: editForm.full_name.trim(),
        payment_status: editForm.payment_status
      }
    });
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedRegistrant) return;
    deleteMutation.mutate(selectedRegistrant.id);
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredRegistrants.map(r => ({
      'Nome Completo': r.full_name,
      'E-mail': r.email,
      'Status Pagamento': r.payment_status === 'completed' ? 'Pago' : r.payment_status === 'pending' ? 'Pendente' : r.payment_status,
      'Valor Pago': r.amount_paid ? `R$ ${r.amount_paid.toFixed(2)}` : '-',
      'Método Pagamento': r.payment_method || '-',
      'Cupom': r.coupon_code || '-',
      'Curso': r.cursos?.nome_curso || '-',
      'Turma': r.turmas?.nome_turma || '-',
      'Data Inscrição': format(new Date(r.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      'Última Atualização': format(new Date(r.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscritos');
    XLSX.writeFile(wb, `inscritos_civeni_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({ title: 'Exportado!', description: `${data.length} inscritos exportados para Excel.` });
  };

  // Get status badge
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />{status || 'N/A'}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.other}</p>
                <p className="text-xs text-muted-foreground">Outros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Inscritos
              </CardTitle>
              <CardDescription>
                Gerencie os inscritos do evento (nome, e-mail, status)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : paginatedRegistrants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum inscrito encontrado</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegistrants.map((registrant) => (
                      <TableRow key={registrant.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {registrant.full_name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {registrant.email}
                        </TableCell>
                        <TableCell>{getStatusBadge(registrant.payment_status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(registrant.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(registrant)} title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(registrant)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(registrant)} title="Excluir" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredRegistrants.length)} de {filteredRegistrants.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Inscrito</DialogTitle>
          </DialogHeader>
          {selectedRegistrant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome Completo</Label>
                  <p className="font-medium">{selectedRegistrant.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">E-mail</Label>
                  <p className="font-medium break-all">{selectedRegistrant.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div>{getStatusBadge(selectedRegistrant.payment_status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Valor Pago</Label>
                  <p className="font-medium">{selectedRegistrant.amount_paid ? `R$ ${selectedRegistrant.amount_paid.toFixed(2)}` : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Método</Label>
                  <p className="font-medium">{selectedRegistrant.payment_method || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Bandeira</Label>
                  <p className="font-medium">{selectedRegistrant.card_brand || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Cupom</Label>
                  <p className="font-medium">{selectedRegistrant.coupon_code || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo Participante</Label>
                  <p className="font-medium">{selectedRegistrant.participant_type || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Curso</Label>
                  <p className="font-medium">{selectedRegistrant.cursos?.nome_curso || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Turma</Label>
                  <p className="font-medium">{selectedRegistrant.turmas?.nome_turma || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Data Inscrição</Label>
                  <p className="font-medium">{format(new Date(selectedRegistrant.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Última Atualização</Label>
                  <p className="font-medium">{format(new Date(selectedRegistrant.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
              </div>
              {selectedRegistrant.stripe_session_id && (
                <div>
                  <Label className="text-muted-foreground text-xs">Stripe Session ID</Label>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{selectedRegistrant.stripe_session_id}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Inscrito</DialogTitle>
            <DialogDescription>Altere os dados do inscrito abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status do Pagamento</Label>
              <Select value={editForm.payment_status} onValueChange={(v) => setEditForm(f => ({ ...f, payment_status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Pago (completed)</SelectItem>
                  <SelectItem value="pending">Pendente (pending)</SelectItem>
                  <SelectItem value="failed">Falhou (failed)</SelectItem>
                  <SelectItem value="refunded">Reembolsado (refunded)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o inscrito <strong>{selectedRegistrant?.full_name}</strong> ({selectedRegistrant?.email})?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RegistrantsManager;
