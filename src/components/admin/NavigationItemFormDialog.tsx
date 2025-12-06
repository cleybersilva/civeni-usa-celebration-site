import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigationItem, NavigationItemFormData } from '@/hooks/useNavigationItems';

const formSchema = z.object({
  type: z.enum(['menu', 'submenu']),
  parent_id: z.string().nullable(),
  slug: z.string().min(1, 'Slug é obrigatório'),
  path: z.string().min(1, 'Caminho é obrigatório'),
  order_index: z.number().min(0),
  is_visible: z.boolean(),
  status: z.enum(['active', 'inactive']),
  restricted_to_registered: z.boolean(),
  label_pt_br: z.string().min(1, 'Nome em PT-BR é obrigatório'),
  label_en: z.string(),
  label_es: z.string(),
  label_tr: z.string(),
  icon: z.string(),
});

interface NavigationItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NavigationItem | null;
  menus: NavigationItem[];
  onSubmit: (data: NavigationItemFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function NavigationItemFormDialog({
  open,
  onOpenChange,
  item,
  menus,
  onSubmit,
  isSubmitting,
}: NavigationItemFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'menu',
      parent_id: null,
      slug: '',
      path: '',
      order_index: 0,
      is_visible: true,
      status: 'active',
      restricted_to_registered: false,
      label_pt_br: '',
      label_en: '',
      label_es: '',
      label_tr: '',
      icon: '',
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (item) {
      form.reset({
        type: item.type,
        parent_id: item.parent_id,
        slug: item.slug,
        path: item.path,
        order_index: item.order_index,
        is_visible: item.is_visible,
        status: item.status,
        restricted_to_registered: item.restricted_to_registered,
        label_pt_br: item.label_pt_br,
        label_en: item.label_en || '',
        label_es: item.label_es || '',
        label_tr: item.label_tr || '',
        icon: item.icon || '',
      });
    } else {
      form.reset({
        type: 'menu',
        parent_id: null,
        slug: '',
        path: '',
        order_index: 0,
        is_visible: true,
        status: 'active',
        restricted_to_registered: false,
        label_pt_br: '',
        label_en: '',
        label_es: '',
        label_tr: '',
        icon: '',
      });
    }
  }, [item, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form values to submit:', values);
    try {
      const dataToSubmit = {
        id: item?.id,
        type: values.type,
        parent_id: values.type === 'menu' ? null : values.parent_id,
        slug: values.slug,
        path: values.path,
        order_index: values.order_index,
        is_visible: Boolean(values.is_visible),
        status: values.status,
        restricted_to_registered: Boolean(values.restricted_to_registered),
        label_pt_br: values.label_pt_br,
        label_en: values.label_en || '',
        label_es: values.label_es || '',
        label_tr: values.label_tr || '',
        icon: values.icon || '',
      };
      console.log('Data to submit:', dataToSubmit);
      await onSubmit(dataToSubmit);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving navigation item:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item de Menu' : 'Novo Item de Menu'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações Básicas</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="menu">Menu</SelectItem>
                          <SelectItem value="submenu">Submenu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchType === 'submenu' && (
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menu Pai</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o menu pai" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {menus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                {menu.label_pt_br}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="exemplo-slug" {...field} />
                      </FormControl>
                      <FormDescription>
                        Identificador único (ex: transmissao-ao-vivo)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caminho (Path)</FormLabel>
                      <FormControl>
                        <Input placeholder="/exemplo-rota" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL da página (ex: /transmissao-ao-vivo)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do ícone Lucide" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome do ícone da biblioteca Lucide (ex: Home, Menu, Settings)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Labels by Language */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Rótulos por Idioma</h3>
              
              <Tabs defaultValue="pt" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pt">🇧🇷 PT-BR</TabsTrigger>
                  <TabsTrigger value="en">🇺🇸 EN</TabsTrigger>
                  <TabsTrigger value="es">🇪🇸 ES</TabsTrigger>
                  <TabsTrigger value="tr">🇹🇷 TR</TabsTrigger>
                </TabsList>

                <TabsContent value="pt" className="mt-4">
                  <FormField
                    control={form.control}
                    name="label_pt_br"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome em Português (BR) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do menu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="en" className="mt-4">
                  <FormField
                    control={form.control}
                    name="label_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome em Inglês</FormLabel>
                        <FormControl>
                          <Input placeholder="Menu name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="es" className="mt-4">
                  <FormField
                    control={form.control}
                    name="label_es"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome em Espanhol</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del menú" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="tr" className="mt-4">
                  <FormField
                    control={form.control}
                    name="label_tr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome em Turco</FormLabel>
                        <FormControl>
                          <Input placeholder="Menü adı" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Configurações de Visibilidade</h3>

              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="is_visible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Visível no menu</FormLabel>
                        <FormDescription>
                          Se desativado, o item não aparecerá no menu
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
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status</FormLabel>
                        <FormDescription>
                          Ativo: link funciona normalmente. Inativo: aparece semi-transparente e clique bloqueado
                        </FormDescription>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restricted_to_registered"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Restringir a inscritos</FormLabel>
                        <FormDescription>
                          Se ativado, apenas participantes inscritos no evento poderão acessar a página
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
