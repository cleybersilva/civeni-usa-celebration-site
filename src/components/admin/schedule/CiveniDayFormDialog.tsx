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
import { CiveniDay } from './useCiveniScheduleOperations';

const daySchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  weekday_label: z.string().min(1, 'Dia da semana é obrigatório'),
  headline: z.string().min(1, 'Título é obrigatório'),
  theme: z.string().min(1, 'Tema é obrigatório'),
  location: z.string().optional(),
  modality: z.enum(['presencial', 'online', 'hibrido']),
  sort_order: z.number().min(0),
  is_published: z.boolean(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  slug: z.string().optional(),
});

type DayFormData = z.infer<typeof daySchema>;

interface CiveniDayFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DayFormData) => void;
  editingDay: CiveniDay | null;
  isLoading: boolean;
  type: 'presencial' | 'online';
}

const CiveniDayFormDialog: React.FC<CiveniDayFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingDay,
  isLoading,
  type,
}) => {
  const form = useForm<DayFormData>({
    resolver: zodResolver(daySchema),
    defaultValues: editingDay || {
      date: '',
      weekday_label: '',
      headline: '',
      theme: '',
      location: type === 'presencial' ? 'Fortaleza/CE' : '',
      modality: type === 'presencial' ? 'presencial' : 'online',
      sort_order: 0,
      is_published: false,
      seo_title: '',
      seo_description: '',
      slug: '',
    },
  });

  React.useEffect(() => {
    if (editingDay) {
      form.reset(editingDay);
    } else if (isOpen) {
      // Reset to default values when opening for new day
      form.reset({
        date: '',
        weekday_label: '',
        headline: '',
        theme: '',
        location: type === 'presencial' ? 'Fortaleza/CE' : '',
        modality: type === 'presencial' ? 'presencial' : 'online',
        sort_order: 0,
        is_published: false,
        seo_title: '',
        seo_description: '',
        slug: '',
      });
    }
  }, [editingDay, isOpen, type, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingDay ? 'Editar Dia' : 'Novo Dia'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes do dia da programação {type}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekday_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia da Semana *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Segunda-feira" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome do dia da semana para exibição
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dia 1 - Abertura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tema principal do dia"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'presencial' && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fortaleza/CE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="modality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidade *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número para ordenar os dias (menor aparece primeiro)
                  </FormDescription>
                  <FormMessage />
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
                      Tornar este dia visível no site
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

export default CiveniDayFormDialog;
