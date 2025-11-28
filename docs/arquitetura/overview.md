# 🏗️ Visão Geral da Arquitetura CIVENI

> Compreenda a estrutura fundamental, decisões de design e padrões arquiteturais da Plataforma CIVENI

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Frontend](#arquitetura-frontend)
3. [Arquitetura Backend](#arquitetura-backend)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Arquitetura de Segurança](#arquitetura-de-segurança)
6. [Otimização de Performance](#otimização-de-performance)

---

## 🎯 Visão Geral do Sistema

CIVENI segue uma **arquitetura serverless moderna** com clara separação entre as preocupações de frontend e backend.

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                 Navegador do Cliente                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  SPA React (Vite + TypeScript)                    │  │
│  │  - UI baseada em componentes                      │  │
│  │  - Roteamento client-side                         │  │
│  │  - Gerenciamento de estado (TanStack Query +     │  │
│  │    Context)                                        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS/REST
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Plataforma Supabase                     │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  PostgreSQL   │  │ Edge         │  │  Storage    │  │
│  │  Database     │  │ Functions    │  │  Buckets    │  │
│  │  (RLS)        │  │ (Deno)       │  │             │  │
│  └───────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Webhooks
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Serviços Externos                       │
│  ┌───────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Stripe   │  │  SendGrid    │  │  YouTube Live   │  │
│  │  Pagamento│  │  E-mail      │  │  Streaming      │  │
│  └───────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Separação de Responsabilidades**: Frontend (UI/UX) e Backend (lógica de negócio) completamente separados
2. **Serverless**: Edge Functions para processamento backend sem gerenciamento de servidores
3. **API-First**: Toda comunicação via REST APIs bem documentadas
4. **Segurança em Camadas**: Proteção em múltiplos níveis (browser, app, API, database)
5. **Escalabilidade Horizontal**: Arquitetura stateless permite escalonamento automático

---

## ⚛️ Arquitetura Frontend

### Hierarquia de Componentes

A aplicação React está estruturada em camadas de providers que fornecem funcionalidades essenciais:

```typescript
App.tsx
├── QueryClientProvider (TanStack Query)
│   └── I18nextProvider (Internacionalização)
│       └── TooltipProvider (Tooltips da UI)
│           └── SecurityProvider (CSRF + validação)
│               └── CMSProvider (Gerenciamento de conteúdo)
│                   └── Router
│                       ├── Páginas Públicas
│                       │   ├── Index (Home)
│                       │   ├── Speakers
│                       │   ├── Schedule
│                       │   ├── Registration
│                       │   └── ...
│                       └── Painel Administrativo
│                           ├── Gerenciador de Palestrantes
│                           ├── Gerenciador de Eventos
│                           ├── Dashboard Financeiro
│                           └── ...
```

### Responsabilidades dos Providers

#### QueryClientProvider (TanStack Query)
- **Propósito**: Gerenciamento de estado do servidor
- **Funções**:
  - Cache de dados de API
  - Refetch automático em background
  - Atualizações otimistas
  - Gerenciamento de estados de loading/erro

#### I18nextProvider
- **Propósito**: Internacionalização
- **Funções**:
  - Detecção automática de idioma do navegador
  - Troca de idioma em tempo real
  - Formatação específica de locale
  - Fallback inteligente de traduções

#### SecurityProvider
- **Propósito**: Segurança da aplicação
- **Funções**:
  - Geração e validação de tokens CSRF
  - Sanitização de entrada do usuário
  - Rate limiting
  - Detecção anti-tampering

#### CMSProvider
- **Propósito**: Gerenciamento central de conteúdo
- **Funções**:
  - Estado centralizado de speakers, events, banners, videos
  - Operações CRUD para todas as entidades
  - Upload e versionamento de imagens
  - Sincronização com Supabase

### Estratégia de Gerenciamento de Estado

**Estado do Servidor** (TanStack Query):
- Dados buscados de APIs
- Registros do banco de dados
- Subscrições em tempo real

**Estado do Cliente** (React Context):
- Estado da UI (modais, dropdowns)
- Estado de formulários
- Preferências do usuário
- Sessão de administrador

**Estado da URL** (React Router):
- Rota atual
- Query parameters
- Histórico de navegação

### Padrões de Componentes

#### Componentes Smart vs Presentational

**Componentes Smart** (Containers):
- Responsabilidade: Busca de dados e lógica de negócio
- Localização: `pages/` e `components/admin/`
- Exemplo: `AdminDashboard.tsx`, `SpeakersSection.tsx`

**Componentes Presentational** (UI):
- Responsabilidade: Renderização pura
- Localização: `components/ui/`
- Exemplo: `Button.tsx`, `Card.tsx`, `Dialog.tsx`

#### Padrão de Custom Hooks

Toda busca de dados usa custom hooks:

```typescript
// Exemplo: hook useSpeakers
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

### Estratégia de Roteamento

**Rotas Públicas**:
- `/` - Página inicial
- `/palestrantes` - Palestrantes
- `/programacao-presencial` - Programação presencial
- `/programacao-online` - Programação online
- `/inscricoes` - Hub de inscrições
- `/transmissao-ao-vivo` - Transmissão ao vivo

**Rotas Admin**:
- `/admin` - Painel administrativo (protegido por autenticação)

**Rotas Dinâmicas**:
- `/eventos/:id` - Detalhes do evento
- `/certificados/verify/:code` - Verificação de certificado

---

## 🗄️ Arquitetura Backend

### Supabase como Backend as a Service (BaaS)

CIVENI utiliza Supabase que fornece três serviços principais:

#### 1. PostgreSQL Database
- **Row Level Security (RLS)**: Políticas de acesso granular em nível de linha
- **Migrations**: Versionamento de esquema com arquivos SQL
- **Indexes**: Otimização de performance de queries
- **Triggers**: Lógica automática (ex: sanitização de entrada)

#### 2. Edge Functions (Deno)
- **Serverless**: Funções executadas sob demanda
- **TypeScript**: Desenvolvimento type-safe
- **Global Distribution**: CDN edge locations
- **Auto-scaling**: Escalonamento automático

#### 3. Storage Buckets
- **Public Bucket**: `site-civeni` para assets públicos
- **Versionamento**: URLs com query parameters de versão
- **CDN**: Distribuição global de assets

### Principais Edge Functions

**Processamento de Pagamentos**:
- `create-registration-payment` - Criação de sessão Stripe
- `verify-payment` - Verificação de status de pagamento
- `stripe-webhook` - Manipulador de eventos Stripe
- `stripe-sync` - Sincronização de dados

**Gerenciamento de Certificados**:
- `issue-certificate` - Geração de PDF
- `verify-certificate` - Validação de código
- `send-certificate-email` - Entrega por e-mail
- `translate-certificate` - Tradução via IA

**Análises Financeiras**:
- `finance-kpis` - Indicadores chave
- `finance-series` - Dados de série temporal
- `finance-breakdown` - Detalhamento por categoria
- `finance-charges` - Detalhes de cobranças

**Geração de Documentos**:
- `generate-programacao-pdf` - PDF da programação
- `download-submissao` - Exportação de trabalhos
- `download-submissao-docx` - Exportação DOCX

---

## 🔄 Fluxo de Dados

### Fluxo de Inscrição Completo

```
1. Usuário preenche formulário de inscrição
   ↓
2. Frontend valida entrada (SecurityProvider)
   ↓
3. Chama Edge Function create-registration-payment
   ↓
4. Sessão Stripe Checkout criada
   ↓
5. Usuário redirecionado ao Stripe
   ↓
6. Usuário completa pagamento
   ↓
7. Webhook Stripe dispara
   ↓
8. Edge Function stripe-webhook processa
   ↓
9. Registro criado no BD
   ↓
10. E-mail de confirmação enviado
   ↓
11. Usuário redirecionado à página de sucesso
```

### Fluxo de Upload de Imagem

```
1. Admin seleciona imagem no dashboard
   ↓
2. Arquivo convertido para data URL base64
   ↓
3. Data URL armazenada no estado (React)
   ↓
4. Admin salva formulário
   ↓
5. CMSContext detecta data URL
   ↓
6. Upload para Supabase Storage
   ↓
7. Obtém URL pública
   ↓
8. Substitui data URL por URL pública
   ↓
9. Salva URL no banco de dados
   ↓
10. Incrementa número de versão (cache busting)
```

### Fluxo de Geração de Certificado

```
1. Participante solicita certificado
   ↓
2. Sistema valida participação no evento
   ↓
3. Chama Edge Function issue-certificate
   ↓
4. PDF gerado com template multilíngue
   ↓
5. Upload do PDF para Storage
   ↓
6. Registro de verificação criado
   ↓
7. Chama send-certificate-email
   ↓
8. E-mail enviado com anexo PDF
   ↓
9. Retorna código de verificação único
```

---

## 🔒 Arquitetura de Segurança

### Defesa em Profundidade (Múltiplas Camadas)

**Camada 1: Navegador**
- Content Security Policy (CSP) headers
- X-XSS-Protection headers
- Forçamento de HTTPS
- Cookies seguros (httpOnly, secure, sameSite)

**Camada 2: Frontend**
- Sanitização de entrada (DOMPurify)
- Tokens CSRF em todas as requisições
- Rate limiting client-side
- Detecção anti-tampering

**Camada 3: API (Edge Functions)**
- Validação de session tokens
- Verificação de CSRF tokens
- Rate limiting server-side
- Input validation

**Camada 4: Banco de Dados**
- Row Level Security (RLS) policies
- Prepared statements (prevenção SQL injection)
- Triggers de sanitização
- Audit logs

### Fluxo de Autenticação Admin

```
1. Admin entra email + senha
   ↓
2. Supabase Auth valida credenciais
   ↓
3. Busca função do usuário em admin_users
   ↓
4. Gera session token único
   ↓
5. Armazena em localStorage com expiração
   ↓
6. Todas requisições incluem email + session_token
   ↓
7. RPC functions validam sessão em cada operação
```

---

## ⚡ Otimização de Performance

### Frontend

**Code Splitting**:
- Splitting baseado em rotas
- Lazy loading de componentes pesados
- Dynamic imports para módulos admin

**Otimização de Imagens**:
- Lazy loading (IntersectionObserver)
- Responsive images
- Versionamento para cache busting
- Compressão automática

**Query Optimization**:
- Cache inteligente (TanStack Query)
- Stale-while-revalidate
- Prefetching de dados
- Atualizações otimistas

### Backend

**Índices de Banco de Dados**:
- Primary keys em todas as tabelas
- Foreign key indexes
- Composite indexes para joins comuns
- Indexes em colunas de filtro

**Edge Functions**:
- Cold start optimization
- Connection pooling
- Caching de responses
- Lazy loading de módulos

**Storage**:
- CDN global para assets
- Cache headers configurados
- Compressão automática (Gzip)

### Deploy

**Build Process**:
- Minificação de código
- Tree shaking
- Asset optimization
- Compressão Gzip/Brotli

**CDN Strategy**:
- Assets estáticos em CDN
- Cache headers otimizados
- URLs versionadas

---

## 📊 Escalabilidade

### Escala Horizontal

**Arquitetura Stateless**:
- Sem sessões server-side
- Autenticação via JWT
- Estado no banco de dados

**Edge Functions**:
- Auto-scaling automático
- Distribuição global
- Pay-per-use

### Escala Vertical

**Database**:
- Connection pooling
- Read replicas (quando necessário)
- Indexação estratégica

**Storage**:
- Escalabilidade ilimitada
- CDN distribution
- Automatic backups

---

## 🔗 Links Relacionados

- [Arquitetura Supabase](supabase.md) — Detalhes do banco de dados e Edge Functions
- [Integração Stripe](stripe.md) — Fluxo de pagamentos
- [Padrões Frontend](../desenvolvimento/padroes_frontend.md) — Convenções React/TypeScript
- [Padrões Backend](../desenvolvimento/padroes_backend.md) — Convenções Supabase/RPC

---

**Autor**: Cleyber Silva
**Instituição**: ICMC - USP
**Contato**: cleyber.silva@usp.br
**Última Atualização**: 2025-11-28
