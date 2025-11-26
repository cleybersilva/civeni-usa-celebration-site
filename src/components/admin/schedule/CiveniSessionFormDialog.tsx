import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CiveniSession, CiveniDay } from './useCiveniScheduleOperations';

const sessionSchema = z.object({
  day_id: z.string().min(1, 'Dia é obrigatório'),
  session_type: z.enum([
    'credenciamento',
    'abertura',
    'conferencia',
    'palestra',
    'painel',
    'mesa_redonda',
    'workshop',
    'sessoes_simultaneas',
    'intervalo',
    'cerimonia',
    'encerramento',
    'outro'
  ]),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().nullish(),
  start_at: z.string().min(1, 'Horário de início é obrigatório'),
  end_at: z.string().nullish(),
  room: z.string().nullish(),
  modality: z.enum(['presencial', 'online', 'hibrido']).nullish(),
  livestream_url: z.string().nullish(),
  materials_url: z.string().nullish(),
  is_parallel: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  order_in_day: z.number().min(0),
  is_published: z.boolean(),
});

const formatDateTimeForInput = (value: string | null | undefined): string => {
  if (!value) return '';
  if (value.includes('T')) {
    return value.slice(0, 16);
  }
  const [datePart, rest] = value.split(' ');
  if (datePart && rest) {
    const timePart = rest.slice(0, 5);
    return `${datePart}T${timePart}`;
  }
  return value;
};

const normalizeDateTimeForDatabase = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
};

type SessionFormData = z.infer<typeof sessionSchema>;

interface CiveniSessionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => void;
  editingSession: CiveniSession | null;
  isLoading: boolean;
  type: 'presencial' | 'online';
  days: CiveniDay[];
}

const CiveniSessionFormDialog: React.FC<CiveniSessionFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSession,
  isLoading,
  type,
  days,
}) => {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: editingSession ? {
      ...editingSession,
      start_at: formatDateTimeForInput(editingSession.start_at),
      end_at: formatDateTimeForInput(editingSession.end_at),
      is_parallel: editingSession.is_parallel || false,
      is_featured: editingSession.is_featured || false,
    } : {
      day_id: days[0]?.id || '',
      session_type: 'palestra',
      title: '',
      description: '',
      start_at: '',
      end_at: '',
      room: '',
      modality: type === 'presencial' ? 'presencial' : 'online',
      livestream_url: '',
      materials_url: '',
      is_parallel: false,
      is_featured: false,
      order_in_day: 0,
      is_published: false,
    },
  });

  React.useEffect(() => {
    if (editingSession) {
      form.reset({
        ...editingSession,
        start_at: formatDateTimeForInput(editingSession.start_at),
        end_at: formatDateTimeForInput(editingSession.end_at),
        is_parallel: editingSession.is_parallel || false,
        is_featured: editingSession.is_featured || false,
      });
    } else if (isOpen && days.length > 0) {
      // Reset to default values when opening for new session
      form.reset({
        day_id: days[0]?.id || '',
        session_type: 'palestra',
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        room: '',
        modality: type === 'presencial' ? 'presencial' : 'online',
        livestream_url: '',
        materials_url: '',
        is_parallel: false,
        is_featured: false,
        order_in_day: 0,
        is_published: false,
      });
    }
  }, [editingSession, isOpen, days, type, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSession ? 'Editar Sessão' : 'Nova Sessão'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da sessão da programação {type}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            // Normalizar datas/horários e converter strings vazias para null
            const cleanedData = {
              ...data,
              start_at: normalizeDateTimeForDatabase(data.start_at) || data.start_at,
              end_at: data.end_at ? normalizeDateTimeForDatabase(data.end_at) : null,
              description: data.description || null,
              room: data.room || null,
              livestream_url: data.livestream_url || null,
              materials_url: data.materials_url || null,
            };
            onSubmit(cleanedData);
          })} className="space-y-4">
              <FormField
                control={form.control}
                name="day_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {days.map(day => (
                          <SelectItem key={day.id} value={day.id}>
                            {day.weekday_label} - {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credenciamento">Credenciamento</SelectItem>
                        <SelectItem value="abertura">Abertura</SelectItem>
                        <SelectItem value="conferencia">Conferência</SelectItem>
                        <SelectItem value="palestra">Palestra</SelectItem>
                        <SelectItem value="painel">Painel</SelectItem>
                        <SelectItem value="mesa_redonda">Mesa Redonda</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="sessoes_simultaneas">Sessões Simultâneas</SelectItem>
                        <SelectItem value="intervalo">Intervalo</SelectItem>
                        <SelectItem value="cerimonia">Cerimônia</SelectItem>
                        <SelectItem value="encerramento">Encerramento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a modalidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da sessão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada da sessão"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala/Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Auditório Principal" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'online' && (
              <>
                <FormField
                  control={form.control}
                  name="livestream_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link de Transmissão</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Link da transmissão ao vivo (YouTube, Meet, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materials_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link de Materiais</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Link para slides, documentos, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_in_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => {
                          const raw = e.target.value;
                          const parsed = raw === '' ? 0 : parseInt(raw, 10);
                          field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Ordem de exibição no dia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_parallel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sessão Paralela</FormLabel>
                      <FormDescription>
                        Ocorre simultaneamente com outras sessões
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Destaque</FormLabel>
                      <FormDescription>
                        Marcar como sessão em destaque
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publicado</FormLabel>
                      <FormDescription>
                        Tornar esta sessão visível no site
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CiveniSessionFormDialog;
