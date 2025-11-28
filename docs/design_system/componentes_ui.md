# 🧩 Componentes UI (shadcn/ui)

> Biblioteca de componentes reutilizáveis baseada em Radix UI e Tailwind CSS

---

## 📦 Componentes Disponíveis

### Formulários
- `Button` — Botões com variantes (default, destructive, outline, ghost)
- `Input` — Campos de entrada de texto
- `Select` — Dropdown de seleção
- `Checkbox` — Caixa de seleção
- `RadioGroup` — Grupo de opções radio
- `Textarea` — Campo de texto multilinhas
- `Form` — Wrapper de formulário com validação (react-hook-form + zod)

### Layout
- `Card` — Container com header, content e footer
- `Sheet` — Sidebar deslizante
- `Dialog` — Modal de diálogo
- `Tabs` — Navegação por abas
- `Separator` — Linha divisória
- `ScrollArea` — Área com scroll customizado

### Feedback
- `Toast` — Notificações temporárias (via sonner)
- `Alert` — Avisos e mensagens de status
- `Skeleton` — Placeholder de carregamento
- `Progress` — Barra de progresso

### Dados
- `Table` — Tabela com ordenação e paginação
- `Chart` — Gráficos (via Recharts)
- `Badge` — Tag/Label colorida

---

## 🔧 Uso Básico

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Enviar</Button>
<Button variant="destructive">Cancelar</Button>
<Button variant="outline">Ver Mais</Button>
```

### Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
    </DialogHeader>
    <p>Conteúdo aqui...</p>
  </DialogContent>
</Dialog>
```

### Form

```tsx
import { Form, FormField, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
});

const form = useForm({
  resolver: zodResolver(formSchema),
});

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormControl>
        <Input placeholder="E-mail" {...field} />
      </FormControl>
    )}
  />
</Form>
```

---

## 📚 Documentação Completa

Veja documentação completa dos componentes em:
- https://ui.shadcn.com/docs/components

---

**Autor**: Cleyber Silva | ICMC - USP | cleyber.silva@usp.br
