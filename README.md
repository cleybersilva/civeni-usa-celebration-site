# 🌐 CIVENI 2025 — Plataforma Multidisciplinar de Eventos da Veni Creator Christian University (VCCU)

> Sistema completo para gestão de congressos, simpósios, certificações, submissões acadêmicas e transmissões internacionais

---

## 🎯 Visão Geral

A **Plataforma CIVENI** (Congresso Internacional da Violência na Infância) é uma solução tecnológica completa e escalável desenvolvida para a **Veni Creator Christian University (VCCU)**. Nossa missão é fornecer uma infraestrutura robusta e moderna para a realização de eventos acadêmicos internacionais de alto nível, integrando gestão de inscrições, processamento de pagamentos, transmissão ao vivo, emissão de certificados e análise financeira em um único ecossistema digital.

### 🚀 Missão

Capacitar instituições acadêmicas com tecnologia de ponta para a realização de congressos internacionais, promovendo a excelência científica, a colaboração global e a disseminação do conhecimento através de uma plataforma segura, multilíngue e altamente escalável.

---

## ✨ Funcionalidades Principais

### 📋 Sistema de Inscrições
- **Modalidades**: Inscrições presenciais e online
- **Pagamentos**: Integração completa com Stripe (cartões, PIX, boleto)
- **Categorias**: Estudantes, profissionais, parceiros institucionais
- **Lotes**: Sistema de early bird com precificação dinâmica
- **Cupons**: Descontos promocionais e bolsas de estudo
- **Multimoeda**: Suporte para BRL, USD, EUR

### 👥 Gestão de Palestrantes
- **Perfis Multilíngue**: Biografias em PT, EN, ES, TR
- **Galeria de Fotos**: Upload otimizado com versionamento
- **Organização**: Associação automática às sessões
- **Visibilidade**: Controle de perfis ativos/inativos

### 📅 Programação de Eventos
- **Dual Mode**: Sessões presenciais e online separadas
- **Timeline**: Organização por dias e horários
- **Salas**: Atribuição de locais físicos e virtuais
- **Fusos Horários**: Conversão automática (America/New_York)
- **Tipos**: Keynotes, painéis, workshops, palestras

### 🎓 Sistema de Certificados
- **Geração Automática**: PDFs personalizados por evento
- **Multilíngue**: Templates em 4 idiomas
- **Verificação**: Código único + QR Code
- **Distribuição**: E-mail automático com anexo
- **Portal Público**: Validação online de certificados

### 📡 Transmissão ao Vivo
- **Integração YouTube**: Embed de múltiplas transmissões
- **Agenda em Tempo Real**: Sessões com countdown
- **Salas Virtuais**: Google Meet + Zoom
- **FAQ**: Perguntas frequentes gerenciáveis
- **Chat**: Moderação e interação

### 📊 Painel Administrativo
- **Dashboard Financeiro**: Receita em tempo real
- **Gestão de Participantes**: CRUD completo
- **CMS**: Banners, vídeos, parceiros, textos
- **Analytics**: Métricas de conversão e engajamento
- **Permissões**: Controle baseado em funções (RBAC)

### 📄 Submissões Acadêmicas
- **Trabalhos**: Upload de PDFs com metadata
- **Vídeos**: Apresentações gravadas
- **Áreas Temáticas**: Categorização por tópicos
- **Avaliação**: Sistema de peer review
- **Exportação**: DOCX e PDF dos trabalhos

### 💰 Análises Financeiras
- **KPIs**: Receita total, ticket médio, conversão
- **Séries Temporais**: Gráficos diários/semanais/mensais
- **Breakdown**: Detalhamento por categoria
- **Funil**: Análise de abandono no checkout
- **Chargebacks**: Rastreamento de devoluções

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                 Navegador do Cliente                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  SPA React (Vite + TypeScript)                    │  │
│  │  - Componentes reutilizáveis (shadcn/ui)         │  │
│  │  - Roteamento client-side (React Router)         │  │
│  │  │  - Estado do servidor (TanStack Query)        │  │
│  │  - Internacionalização (i18next)                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS/REST API
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Plataforma Supabase                     │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  PostgreSQL   │  │ Edge         │  │  Storage    │  │
│  │  Database     │  │ Functions    │  │  Buckets    │  │
│  │  + RLS        │  │ (Deno)       │  │  (CDN)      │  │
│  └───────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Webhooks & APIs
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Serviços Externos                       │
│  ┌───────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Stripe   │  │  SendGrid    │  │  YouTube Live   │  │
│  │  Payment  │  │  E-mail      │  │  Streaming      │  │
│  └───────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Hierarquia de Providers

```typescript
App.tsx
├── QueryClientProvider (TanStack Query)
│   └── I18nextProvider (Internacionalização)
│       └── TooltipProvider (UI Tooltips)
│           └── SecurityProvider (CSRF + Validação)
│               └── CMSProvider (Gestão de Conteúdo)
│                   └── Router (React Router v6)
```

### Principais Tecnologias

#### Frontend
- **React 18.3** — Biblioteca UI moderna
- **TypeScript 5.5** — Desenvolvimento type-safe
- **Vite 5.4** — Build tool ultra-rápido
- **Tailwind CSS** — Estilização utility-first
- **shadcn/ui** — Componentes de alta qualidade
- **TanStack Query** — Gerenciamento de estado do servidor
- **i18next** — Framework de internacionalização
- **Recharts** — Visualização de dados
- **date-fns** — Manipulação de datas

#### Backend
- **Supabase** — Backend as a Service
  - PostgreSQL com Row Level Security (RLS)
  - Edge Functions (Deno/TypeScript)
  - Storage para assets de mídia
  - Subscrições em tempo real
- **Stripe** — Processamento de pagamentos
- **Deno** — Runtime para Edge Functions

#### Infraestrutura
- **cPanel** — Hospedagem de produção
- **Apache** — Servidor web
- **PWA** — Capacidades Progressive Web App
- **Service Worker** — Suporte offline e caching

---

## 🌍 Suporte Multilíngue

A plataforma oferece suporte completo a **4 idiomas**:

- 🇧🇷 **Português (Brasil)** — Idioma padrão
- 🇺🇸 **Inglês (Estados Unidos)**
- 🇪🇸 **Espanhol (Espanha)**
- 🇹🇷 **Turco**

### Implementação
- Arquivos de tradução em `src/i18n/locales/`
- Campos de banco de dados com sufixos de idioma (`title_en`, `title_es`, etc.)
- Detecção automática do idioma do navegador
- Seleção persistente de idioma
- Fallback inteligente: solicitado → pt → en

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js 20+** (recomendado via [nvm](https://github.com/nvm-sh/nvm))
- **npm 10+** ou **pnpm** ou **yarn**
- **Supabase CLI** (opcional, para desenvolvimento local)
- **Docker** (opcional, para instância local do Supabase)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <SEU_GIT_URL>
   cd civeni-usa-celebration-site
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` no diretório raiz:
   ```env
   VITE_SUPABASE_URL=https://wdkeqxfglmritghmakma.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_aqui
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

   A aplicação estará disponível em `http://localhost:8080`

### Comandos de Desenvolvimento

```bash
# Servidor de desenvolvimento (porta 8080)
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Linting
npm run lint

# Verificação de tipos
npx tsc --noEmit
```

### Desenvolvimento Local com Supabase

```bash
# Iniciar Supabase local (requer Docker)
supabase start

# Implantar Edge Function
supabase functions deploy <nome-da-funcao>

# Ver logs da função
supabase functions logs <nome-da-funcao>

# Parar Supabase local
supabase stop
```

---

## 📦 Deploy em Produção

### Deploy no cPanel

1. **Build para produção**
   ```bash
   ./build-cpanel.sh
   ```
   Isso cria `civeni-saas-cpanel.zip` com build otimizado e headers de segurança.

2. **Upload para cPanel**
   - Acesse o Gerenciador de Arquivos do cPanel
   - Navegue até `public_html/` ou raiz do seu domínio
   - Faça upload e extraia `civeni-saas-cpanel.zip`
   - Certifique-se de que `.htaccess` está presente para roteamento e segurança

3. **Verificação pós-deploy**
   - Verifique se redirecionamento HTTPS está ativo
   - Teste todas as rotas (sem erros 404)
   - Verifique funcionalidade de login admin
   - Confirme carregamento de assets (CSS/JS/imagens)

### Variáveis de Ambiente (Produção)

Configure nos secrets das Edge Functions do Supabase:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `LOVABLE_API_KEY` (para funcionalidades com IA)

---

## 🔒 Segurança

Esta plataforma implementa segurança de nível empresarial:

- ✅ **Proteção CSRF** — Validação de requisições baseada em tokens
- ✅ **Sanitização de Entrada** — DOMPurify para HTML, validadores customizados
- ✅ **Prevenção SQL Injection** — Queries parametrizadas e triggers de banco
- ✅ **Proteção XSS** — Headers Content Security Policy
- ✅ **Rate Limiting** — Throttling de API e prevenção de abuso
- ✅ **Gestão de Sessões** — Armazenamento seguro de tokens com expiração
- ✅ **Forçamento HTTPS** — Redirecionamento automático para conexão segura
- ✅ **RLS (Row Level Security)** — Políticas de acesso granular no banco

Veja `SECURITY.md` para documentação detalhada de segurança.

---

## 💳 Integração de Pagamentos

### Stripe Integration

**Fluxo de Inscrição**:
1. Usuário seleciona categoria e fornece dados
2. Sessão de Checkout Stripe é criada
3. Pagamento processado com segurança via Stripe
4. Webhook confirma pagamento
5. Inscrição confirmada no banco de dados
6. E-mail de confirmação enviado automaticamente

**Funcionalidades**:
- Múltiplos métodos de pagamento (cartões, PIX, boleto)
- Suporte a múltiplas moedas
- Dashboard de analytics de receita
- Rastreamento de chargebacks
- Relatórios financeiros em tempo real

---

## 📚 Documentação Completa

A documentação técnica completa está disponível em **[/docs](/docs)**:

### Estrutura de Documentação

```
docs/
├── index.md                      # Hub central de navegação
├── arquitetura/
│   ├── overview.md              # Visão geral da arquitetura
│   ├── supabase.md              # Banco de dados e Edge Functions
│   └── stripe.md                # Integração de pagamentos
├── desenvolvimento/
│   ├── padroes_frontend.md      # Padrões React/TypeScript
│   ├── padroes_backend.md       # Padrões Supabase/RPC
│   └── multilingue_i18n.md      # Sistema de tradução
├── design_system/
│   ├── cores.md                 # Paleta de cores
│   ├── logos.md                 # Logos e branding
│   └── componentes_ui.md        # Biblioteca shadcn/ui
├── operacoes/
│   ├── deploy.md                # Guia de deploy cPanel
│   └── edge_functions.md        # Deploy de Edge Functions
└── fluxo_eventos/
    ├── inscricoes.md            # Sistema de inscrições
    ├── artigos.md               # Submissão de trabalhos
    ├── consorcios.md            # Parcerias institucionais
    ├── certificados.md          # Geração e verificação
    └── transmissao_ao_vivo.md   # YouTube Live integration
```

**Acesse**: [Documentação Completa →](/docs)

---

## 🤝 Contribuindo

Este é um projeto privado da VCCU. Para desenvolvimento interno:

1. Crie uma branch de feature a partir da `main`
2. Faça as alterações seguindo as convenções do projeto
3. Teste minuciosamente (admin, público, pagamentos, i18n)
4. Crie pull request com descrição detalhada
5. Solicite revisão de código do líder da equipe

---

## 📞 Suporte

Para suporte técnico ou dúvidas:

- **Instituição**: Veni Creator Christian University (VCCU)
- **Projeto**: Plataforma CIVENI de Congressos Internacionais
- **Documentação Técnica**: Veja pasta `/docs`
- **Questões de Segurança**: Reporte imediatamente à equipe técnica

---

## 📄 Licença

Software proprietário. Todos os direitos reservados pela Veni Creator Christian University (VCCU).

Cópia, modificação, distribuição ou uso não autorizado deste software é estritamente proibido.

---

## 👨‍💻 Autoria Técnica

**Autor**: Cleyber Silva
**Cargo**: SRE Engineer / Cientista de IA
**Instituição**: ICMC - Universidade de São Paulo (USP)
**Contato**: (81) 98484-5021
**E-mail**: cleyber.silva@usp.br

---

**Construído com excelência para promover o avanço acadêmico internacional pela Equipe de Desenvolvimento VCCU** 🎓✨
