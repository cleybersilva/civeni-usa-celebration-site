# Guia de Desenvolvimento CIVENI

Guia completo para desenvolvedores trabalhando na plataforma CIVENI.

## Índice

1. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
2. [Convenções de Código](#convenções-de-código)
3. [Padrões de Componentes](#padrões-de-componentes)
4. [Padrões de Banco de Dados](#padrões-de-banco-de-dados)
5. [Diretrizes de Testes](#diretrizes-de-testes)
6. [Fluxo de Trabalho Git](#fluxo-de-trabalho-git)
7. [Solução de Problemas](#solução-de-problemas)

## Ambiente de Desenvolvimento

### Ferramentas Necessárias

- **Node.js**: 20.x ou superior (use nvm para gerenciamento de versão)
- **npm**: 10.x ou superior
- **Git**: Versão mais recente
- **VSCode**: IDE recomendada
- **Supabase CLI**: Opcional, para desenvolvimento local

### Extensões Recomendadas do VSCode

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode"
  ]
}
```

### Configuração do Ambiente

1. **Clonar repositório**
   ```bash
   git clone <repo-url>
   cd civeni-usa-celebration-site
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**

   Criar arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://wdkeqxfglmritghmakma.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_aqui
   ```

4. **Iniciar servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

   Servidor roda em `http://localhost:8080`

### Configuração do Supabase Local (Opcional)

Para desenvolvimento local completo:

```bash
# Inicializar Supabase
supabase init

# Iniciar instância local
supabase start

# Vincular ao projeto remoto
supabase link --project-ref wdkeqxfglmritghmakma

# Puxar esquema remoto
supabase db pull
```

## Convenções de Código

### TypeScript

**Convenções de Nomenclatura**:
- **PascalCase**: Componentes, Types, Interfaces
- **camelCase**: Variáveis, funções, métodos
- **UPPER_SNAKE_CASE**: Constantes, variáveis de ambiente
- **kebab-case**: Nomes de arquivos, classes CSS

**Definições de Tipo**:
```typescript
// ✅ Bom
interface Speaker {
  id: string;
  name: string;
  bio: string;
}

type SpeakerStatus = 'active' | 'inactive';

// ❌ Evitar
interface speaker {  // Case errado
  Id: string;  // Case inconsistente
}
```

**Tipagem Explícita**:
```typescript
// ✅ Bom
function getSpeaker(id: string): Promise<Speaker | null> {
  return supabase
    .from('speakers')
    .select('*')
    .eq('id', id)
    .single();
}

// ❌ Evitar
function getSpeaker(id) {  // Tipos faltando
  return supabase.from('speakers').select('*');
}
```

### Componentes React

**Componentes Funcionais**:
```typescript
// ✅ Bom - Export nomeado com tipos adequados
interface SpeakerCardProps {
  speaker: Speaker;
  onEdit?: () => void;
}

export function SpeakerCard({ speaker, onEdit }: SpeakerCardProps) {
  return (
    <div className="speaker-card">
      {/* ... */}
    </div>
  );
}

// ❌ Evitar - Export padrão
export default function SpeakerCard(props: any) {
  // ...
}
```

**Organização de Componentes**:
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeakers } from '@/hooks/useSpeakers';

// 2. Definições de tipo
interface Props {
  // ...
}

// 3. Componente
export function MyComponent({ prop }: Props) {
  // 3.1 Hooks
  const [state, setState] = useState();
  const { data } = useSpeakers();

  // 3.2 Event handlers
  const handleClick = () => {
    // ...
  };

  // 3.3 Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Estilização

**Tailwind CSS**:
```tsx
// ✅ Bom - Agrupamento semântico
<div className="
  flex items-center justify-between
  p-4 mb-4
  bg-white rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">
  {/* conteúdo */}
</div>

// ❌ Evitar - Ordem aleatória, difícil de ler
<div className="p-4 shadow-md bg-white mb-4 flex rounded-lg items-center hover:shadow-lg justify-between transition-shadow">
  {/* conteúdo */}
</div>
```

**CSS Customizado** (quando necessário):
- Use módulos CSS ou styled-components
- Evite estilos globais exceto em `index.css`
- Prefixe classes customizadas com o nome do componente

### Organização de Arquivos

```
src/
├── components/
│   ├── ui/              # Primitivos shadcn/ui
│   ├── admin/           # Componentes exclusivos admin
│   ├── SpeakerCard.tsx  # Componentes de funcionalidade
│   └── Header.tsx
├── pages/               # Componentes de rota
│   ├── Index.tsx
│   └── AdminDashboard.tsx
├── hooks/               # Hooks customizados
│   └── useSpeakers.ts
├── contexts/            # Contextos React
│   └── CMSContext.tsx
├── utils/               # Funções utilitárias
│   └── imageUtils.ts
└── types/               # Tipos compartilhados
    └── registration.ts
```

## Padrões de Componentes

### Custom Hooks

**Hook de Busca de Dados**:
```typescript
export function useSpeakers() {
  return useQuery({
    queryKey: ['speakers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Speaker[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

**Hook de Mutação**:
```typescript
export function useUpdateSpeaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (speaker: Speaker) => {
      const { data, error } = await supabase
        .from('speakers')
        .update(speaker)
        .eq('id', speaker.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speakers'] });
      toast.success('Palestrante atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(`Falha ao atualizar: ${error.message}`);
    }
  });
}
```

### Uso de Context

**Usando CMSContext**:
```typescript
import { useCMS } from '@/contexts/CMSContext';

function MyComponent() {
  const { speakers, updateSpeakers, loading } = useCMS();

  if (loading) return <Skeleton />;

  return (
    <div>
      {speakers.map(speaker => (
        <SpeakerCard key={speaker.id} speaker={speaker} />
      ))}
    </div>
  );
}
```

### Manipulação de Formulários

**Usando SecureForm**:
```typescript
import { SecureForm } from '@/components/SecureForm';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // SecureForm sanitiza automaticamente as entradas
    await submitRegistration(formData);
  };

  return (
    <SecureForm onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit">Enviar</Button>
    </SecureForm>
  );
}
```

## Padrões de Banco de Dados

### Consultando Dados

**Query Básica**:
```typescript
const { data, error } = await supabase
  .from('speakers')
  .select('*')
  .eq('is_active', true)
  .order('name');
```

**Query Complexa com Relações**:
```typescript
const { data, error } = await supabase
  .from('civeni_program_sessions')
  .select(`
    *,
    day:civeni_program_days(id, date, title_pt),
    speakers:speakers(id, name, photo_url)
  `)
  .eq('day.is_active', true);
```

**Paginação**:
```typescript
const { data, error } = await supabase
  .from('event_registrations')
  .select('*', { count: 'exact' })
  .range(0, 9);  // Primeiros 10 itens
```

### Operações Admin

**Sempre use funções RPC para operações admin**:
```typescript
// ✅ Bom - Usa RPC com validação de sessão
const sessionRaw = localStorage.getItem('adminSession');
const { user, session_token } = JSON.parse(sessionRaw);

const { data, error } = await supabase.rpc('admin_update_speaker', {
  p_speaker_id: speakerId,
  p_name: name,
  user_email: user.email,
  session_token: session_token
});

// ❌ Evitar - Update direto sem validação
const { data, error } = await supabase
  .from('speakers')
  .update({ name })
  .eq('id', speakerId);
```

### Padrão de Upload de Imagem

```typescript
async function uploadSpeakerPhoto(file: File, speakerId: string) {
  // 1. Gerar nome de arquivo único
  const fileExt = file.name.split('.').pop();
  const fileName = `${speakerId}-${Date.now()}.${fileExt}`;

  // 2. Upload para storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('site-civeni')
    .upload(`speakers/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // 3. Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('site-civeni')
    .getPublicUrl(`speakers/${fileName}`);

  // 4. Atualizar banco de dados com incremento de versão
  const { error: updateError } = await supabase
    .from('speakers')
    .update({
      photo_url: publicUrl,
      photo_version: supabase.rpc('increment', { field: 'photo_version' })
    })
    .eq('id', speakerId);

  if (updateError) throw updateError;

  return publicUrl;
}
```

## Diretrizes de Testes

### Checklist de Testes Manuais

Antes de submeter PR:

**Frontend**:
- [ ] Testar em Chrome, Firefox, Safari
- [ ] Testar em dispositivos móveis (responsivo)
- [ ] Testar com todos os 4 idiomas (PT, EN, ES, TR)
- [ ] Verificar ausência de erros no console
- [ ] Verificar acessibilidade (navegação por teclado)

**Painel Admin**:
- [ ] Testar operações CRUD
- [ ] Verificar checagens de permissão
- [ ] Testar uploads de imagem
- [ ] Verificar validação de formulários

**Integração**:
- [ ] Testar fluxo de inscrição end-to-end
- [ ] Verificar processamento de pagamento (usar modo de teste Stripe)
- [ ] Testar geração de certificados
- [ ] Verificar envio de e-mails

### Testando Edge Functions Localmente

```bash
# Servir função localmente
supabase functions serve function-name

# Testar com curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": "data"}'
```

## Fluxo de Trabalho Git

### Nomenclatura de Branches

```
feature/add-speaker-search
bugfix/fix-payment-redirect
hotfix/certificate-generation
refactor/update-admin-ui
```

### Mensagens de Commit

Seguir commits convencionais:

```
feat: adiciona funcionalidade de busca de palestrantes
fix: corrige URL de redirecionamento de pagamento
docs: atualiza referência da API
refactor: simplifica autenticação admin
style: formata componente speaker card
```

**Bom Commit**:
```
feat(admin): adiciona importação em lote de palestrantes

- Adiciona componente de upload CSV
- Implementa lógica de validação
- Adiciona indicador de progresso
- Atualiza documentação

Closes #123
```

### Processo de Pull Request

1. **Criar branch de feature**
   ```bash
   git checkout -b feature/minha-feature
   ```

2. **Fazer mudanças e commit**
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   ```

3. **Push para remoto**
   ```bash
   git push origin feature/minha-feature
   ```

4. **Criar PR com descrição**:
   - O que mudou
   - Por que mudou
   - Testes realizados
   - Screenshots (se mudança de UI)

5. **Solicitar revisão**

6. **Merge após aprovação**

## Solução de Problemas

### Problemas Comuns

**Problema**: Imagens não carregam
**Solução**: Verificar photo_version, limpar cache do navegador, verificar permissões de Storage

**Problema**: Erro de política RLS
**Solução**: Usar funções RPC para operações admin, não queries diretas

**Problema**: Erros de TypeScript após mudança de esquema
**Solução**: Regenerar tipos com `supabase gen types typescript`

**Problema**: Traduções não aparecem
**Solução**: Verificar se arquivo i18n tem a chave, verificar se troca de idioma funciona

**Problema**: Build falha
**Solução**: Limpar node_modules e reinstalar: `rm -rf node_modules && npm install`

### Modo Debug

Habilitar log verboso:

```typescript
// No .env
VITE_DEBUG=true

// No código
if (import.meta.env.VITE_DEBUG) {
  console.log('Debug info:', data);
}
```

### Debug do Supabase Local

```bash
# Ver logs em tempo real
supabase functions logs function-name --follow

# Verificar logs do banco de dados
supabase db logs
```

---

**Última Atualização**: 2025-11-28
**Mantido Por**: Equipe de Desenvolvimento VCCU
