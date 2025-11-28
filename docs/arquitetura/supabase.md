# 🗄️ Arquitetura Supabase — Banco de Dados e Edge Functions

> Documentação completa do esquema PostgreSQL, políticas RLS, Edge Functions e Storage da Plataforma CIVENI

---

## 📋 Índice

1. [Visão Geral Supabase](#visão-geral-supabase)
2. [Esquema do Banco de Dados](#esquema-do-banco-de-dados)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Edge Functions](#edge-functions)
5. [Storage Buckets](#storage-buckets)
6. [Funções RPC](#funções-rpc)

---

## 🎯 Visão Geral Supabase

**Supabase** é nossa plataforma Backend as a Service (BaaS) que fornece:

- **PostgreSQL Database** com Row Level Security
- **Edge Functions** (runtime Deno para serverless)
- **Storage** (buckets para imagens e arquivos)
- **Auth** (autenticação de usuários)
- **Real-time** (subscrições em tempo real)

**URL do Projeto**: `https://wdkeqxfglmritghmakma.supabase.co`

---

## 🗂️ Esquema do Banco de Dados

### Tabelas Principais

#### `speakers` — Palestrantes

Armazena perfis completos de palestrantes com suporte multilíngue.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária (auto-gerado) |
| `name` | text | Nome do palestrante |
| `bio` | text | Biografia em português |
| `bio_en` | text | Biografia em inglês |
| `bio_es` | text | Biografia em espanhol |
| `bio_tr` | text | Biografia em turco |
| `photo_url` | text | URL da foto do palestrante |
| `photo_version` | integer | Versão para cache busting (incrementa a cada upload) |
| `organization` | text | Instituição/Organização |
| `is_active` | boolean | Visibilidade pública (true = visível) |
| `created_at` | timestamptz | Timestamp de criação |
| `updated_at` | timestamptz | Timestamp da última atualização |

**Indexes**:
- Primary key em `id`
- Index em `is_active` para queries de listagem
- Index em `name` para ordenação

---

#### `events` — Eventos

Define os eventos/congressos gerenciados pela plataforma.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `title` | text | Título do evento (PT) |
| `title_en` | text | Título em inglês |
| `title_es` | text | Título em espanhol |
| `title_tr` | text | Título em turco |
| `description` | text | Descrição completa |
| `start_date` | date | Data de início |
| `end_date` | date | Data de término |
| `location` | text | Local (cidade/país) |
| `is_active` | boolean | Evento ativo |
| `max_participants` | integer | Capacidade máxima |
| `created_at` | timestamptz | Timestamp de criação |

---

#### `event_category` — Categorias de Inscrição

Define tipos de inscrição com precificação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `event_id` | uuid | FK para `events` |
| `title_pt` | text | Nome da categoria (PT) |
| `title_en` | text | Nome em inglês |
| `title_es` | text | Nome em espanhol |
| `title_tr` | text | Nome em turco |
| `price_cents` | integer | Preço em centavos |
| `currency` | text | Código da moeda (BRL, USD, EUR) |
| `is_free` | boolean | Categoria gratuita |
| `stripe_price_id` | text | ID do produto no Stripe |
| `quota_total` | integer | Vagas totais disponíveis |
| `quota_used` | integer | Vagas já utilizadas |
| `order_index` | integer | Ordem de exibição |
| `is_active` | boolean | Categoria ativa |

**Constraints**:
- `quota_used <= quota_total`
- `price_cents >= 0`

---

#### `event_registrations` — Inscrições

Armazena todas as inscrições de participantes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `event_id` | uuid | FK para `events` |
| `category_id` | uuid | FK para `event_category` |
| `user_name` | text | Nome do participante |
| `user_email` | text | E-mail (validado) |
| `user_phone` | text | Telefone |
| `document_number` | text | CPF/RG/Passport |
| `payment_status` | text | `paid`, `pending`, `failed` |
| `stripe_session_id` | text | ID da sessão Stripe |
| `stripe_payment_intent` | text | ID do pagamento |
| `amount_paid_cents` | integer | Valor pago em centavos |
| `created_at` | timestamptz | Data de inscrição |
| `confirmed_at` | timestamptz | Data de confirmação |

**Indexes**:
- Primary key em `id`
- Index em `event_id` + `payment_status` (queries frequentes)
- Index em `user_email` (busca de duplicatas)
- Index em `stripe_session_id` (webhook lookups)

---

#### `civeni_program_days` — Dias da Programação

Organiza a programação por dias.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `date` | date | Data do dia |
| `title_pt` | text | Título do dia (ex: "Dia 1 - Abertura") |
| `title_en` | text | Título em inglês |
| `title_es` | text | Título em espanhol |
| `title_tr` | text | Título em turco |
| `order_index` | integer | Ordem de exibição |
| `is_active` | boolean | Dia ativo |
| `created_at` | timestamptz | Timestamp de criação |

---

#### `civeni_program_sessions` — Sessões da Programação

Define sessões individuais (palestras, painéis, workshops).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `day_id` | uuid | FK para `civeni_program_days` |
| `title_pt` | text | Título da sessão |
| `title_en` | text | Título em inglês |
| `title_es` | text | Título em espanhol |
| `title_tr` | text | Título em turco |
| `start_time` | time | Horário de início |
| `end_time` | time | Horário de término |
| `location` | text | Sala/Local |
| `session_type` | text | `keynote`, `panel`, `workshop`, `lecture` |
| `speaker_ids` | uuid[] | Array de IDs de palestrantes |
| `description` | text | Descrição da sessão |
| `is_active` | boolean | Sessão ativa |

**Constraints**:
- `end_time > start_time`

---

#### `certificates` — Certificados

Armazena certificados gerados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `participant_name` | text | Nome do destinatário |
| `participant_email` | text | E-mail do destinatário |
| `event_name` | text | Nome do evento |
| `event_date` | text | Data do evento (formatada) |
| `hours` | integer | Carga horária |
| `issue_date` | date | Data de emissão |
| `verification_code` | text | Código único de verificação |
| `certificate_url` | text | URL do PDF |
| `language` | text | Idioma (`pt`, `en`, `es`, `tr`) |
| `created_at` | timestamptz | Timestamp de criação |

**Indexes**:
- Primary key em `id`
- **Unique** index em `verification_code`
- Index em `participant_email`

---

### Tabelas Administrativas

#### `admin_users` — Usuários Admin

Armazena permissões de acesso ao painel administrativo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | FK para `auth.users` (Supabase Auth) |
| `email` | text | E-mail do admin |
| `role` | text | `admin_root`, `admin`, `editor`, `viewer`, `design` |
| `session_token` | text | Token de sessão atual |
| `session_expires_at` | timestamptz | Expiração da sessão |
| `created_at` | timestamptz | Data de criação |
| `last_login` | timestamptz | Último login |

**Roles**:
- `admin_root`: Acesso total (CRUD completo, gerenciamento de usuários)
- `admin`: CRUD de conteúdo, sem gerenciamento de usuários
- `editor`: Apenas edição de conteúdo existente
- `viewer`: Apenas visualização (read-only)
- `design`: Apenas banners e elementos visuais

---

## 🔒 Row Level Security (RLS)

Todas as tabelas têm **RLS habilitado** para segurança granular.

### Políticas de Acesso Público

Tabelas com leitura pública (sem autenticação):

```sql
-- Exemplo: speakers (somente leitura de ativos)
CREATE POLICY "Public read active speakers"
ON speakers FOR SELECT
USING (is_active = true);

-- Exemplo: events (somente eventos ativos)
CREATE POLICY "Public read active events"
ON events FOR SELECT
USING (is_active = true);

-- Exemplo: certificates (apenas com código de verificação)
CREATE POLICY "Public read with verification code"
ON certificates FOR SELECT
USING (verification_code IS NOT NULL);
```

### Políticas de Acesso Admin

Operações admin usam **funções RPC** que bypassam RLS com validação de sessão:

```sql
-- Função RPC para validar sessão admin
CREATE OR REPLACE FUNCTION check_user_role_secure(
  p_email text,
  p_session_token text
)
RETURNS TABLE (role text, is_valid boolean)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.role,
    (u.session_token = p_session_token
     AND u.session_expires_at > NOW())::boolean AS is_valid
  FROM admin_users u
  WHERE u.email = p_email;
END;
$$;
```

**Importante**: Todas as operações admin (INSERT, UPDATE, DELETE) devem:
1. Passar `user_email` e `session_token` como parâmetros
2. Usar funções RPC que validam a sessão
3. Nunca fazer queries diretas no frontend

---

## ⚡ Edge Functions

Edge Functions são funções serverless TypeScript/Deno que rodam na edge de Supabase.

### Localização

Todas as Edge Functions estão em: `supabase/functions/`

### Categorias de Funções

#### 1. Processamento de Pagamentos

**`create-registration-payment`**
- **Endpoint**: `POST /functions/v1/create-registration-payment`
- **Propósito**: Cria uma Sessão de Checkout Stripe
- **Input**:
  ```json
  {
    "categoryId": "uuid",
    "eventId": "uuid",
    "userData": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "document": "string"
    },
    "couponCode": "string (opcional)"
  }
  ```
- **Output**:
  ```json
  {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
  ```

**`stripe-webhook`**
- **Endpoint**: `POST /functions/v1/stripe-webhook`
- **Propósito**: Recebe e processa eventos de webhook do Stripe
- **Eventos**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `charge.succeeded`
- **Autenticação**: Valida assinatura do webhook via `stripe-signature` header

**`verify-payment`**
- **Endpoint**: `POST /functions/v1/verify-payment`
- **Propósito**: Verifica status de um pagamento específico
- **Input**: `{ "sessionId": "cs_test_..." }`
- **Output**: `{ "status": "paid|unpaid", "registrationId": "uuid" }`

---

#### 2. Gerenciamento de Certificados

**`issue-certificate`**
- **Endpoint**: `POST /functions/v1/issue-certificate`
- **Propósito**: Gera PDF de certificado personalizado
- **Input**:
  ```json
  {
    "participantName": "string",
    "participationType": "string",
    "eventName": "string",
    "eventDate": "string",
    "hours": number,
    "language": "pt|en|es|tr"
  }
  ```
- **Output**:
  ```json
  {
    "certificateUrl": "https://...",
    "verificationCode": "CIVENI-2025-ABCD1234",
    "certificateId": "uuid"
  }
  ```

**`verify-certificate`**
- **Endpoint**: `GET /functions/v1/verify-certificate?code=CIVENI-2025-ABCD1234`
- **Propósito**: Valida autenticidade de um certificado
- **Output**:
  ```json
  {
    "valid": true,
    "certificate": {
      "participantName": "string",
      "eventName": "string",
      "issueDate": "2025-01-15",
      "certificateUrl": "https://..."
    }
  }
  ```

**`send-certificate-email`**
- **Endpoint**: `POST /functions/v1/send-certificate-email`
- **Propósito**: Envia certificado por e-mail via SendGrid
- **Input**: `{ "email": "string", "certificateId": "uuid", "language": "pt" }`

---

#### 3. Análises Financeiras

**`finance-kpis`**
- **Endpoint**: `GET /functions/v1/finance-kpis`
- **Propósito**: Retorna indicadores chave de performance
- **Output**:
  ```json
  {
    "totalRevenue": 50000.00,
    "totalParticipants": 250,
    "averageTicket": 200.00,
    "conversionRate": 0.75
  }
  ```

**`finance-series`**
- **Endpoint**: `GET /functions/v1/finance-series?period=daily&startDate=2025-01-01`
- **Propósito**: Dados de receita em série temporal
- **Parameters**:
  - `period`: `daily` | `weekly` | `monthly`
  - `startDate`: Data ISO (YYYY-MM-DD)
  - `endDate`: Data ISO (opcional)

**`finance-breakdown`**
- **Endpoint**: `GET /functions/v1/finance-breakdown`
- **Propósito**: Detalhamento de receita por categoria
- **Output**:
  ```json
  {
    "byCategory": [
      {
        "category": "Student",
        "revenue": 15000.00,
        "count": 150,
        "percentage": 30.0
      }
    ]
  }
  ```

---

#### 4. Submissões Acadêmicas

**`submit-work`**
- **Endpoint**: `POST /functions/v1/submit-work`
- **Propósito**: Submete trabalho acadêmico (PDF + metadata)
- **Input**: FormData com arquivo e metadados
- **Output**: `{ "submissionId": "uuid", "confirmationCode": "string" }`

**`submit-video`**
- **Endpoint**: `POST /functions/v1/submit-video`
- **Propósito**: Submete apresentação em vídeo
- **Input**: FormData similar ao submit-work

**`download-submissao`**
- **Endpoint**: `POST /functions/v1/download-submissao`
- **Propósito**: Exporta submissão como PDF
- **Output**: Stream de arquivo PDF

**`download-submissao-docx`**
- **Endpoint**: `POST /functions/v1/download-submissao-docx`
- **Propósito**: Exporta submissão como DOCX

---

#### 5. Utilitários Admin

**`admin-list-users`**
- **Endpoint**: `POST /functions/v1/admin-list-users`
- **Propósito**: Lista todos os usuários autenticados
- **Autenticação**: Requer `user_email` + `session_token` de admin_root

**`delete-customer-registrations`**
- **Endpoint**: `POST /functions/v1/delete-customer-registrations`
- **Propósito**: Remove inscrições duplicadas de um cliente
- **Input**: `{ "customerId": "cus_..." }`

**`sync-category-stripe`**
- **Endpoint**: `POST /functions/v1/sync-category-stripe`
- **Propósito**: Sincroniza categoria com produto Stripe
- **Input**: `{ "categoryId": "uuid" }`

---

## 📦 Storage Buckets

### Bucket: `site-civeni`

**Tipo**: Público (leitura pública, escrita autenticada)

**Estrutura de Diretórios**:
```
site-civeni/
├── speakers/          # Fotos de palestrantes (JPG, PNG, WebP)
├── banners/          # Imagens do carrossel da homepage
├── videos/           # Miniaturas de vídeos (thumbnails)
├── certificates/     # PDFs de certificados gerados
├── submissions/      # Trabalhos acadêmicos submetidos
├── logos/            # Logos de parceiros e patrocinadores
└── uploads/          # Outros uploads gerais
```

**Políticas**:
- **Leitura**: Acesso público sem autenticação
- **Escrita**: Apenas usuários autenticados
- **Limite de tamanho**: 10MB por arquivo
- **Tipos permitidos**: `image/*`, `application/pdf`

**Versionamento**:
- Imagens incluem coluna `photo_version` ou `image_version` no banco
- URLs incluem query parameter: `?v=2`
- Cache busting automático quando versão incrementa

**Exemplo de Upload**:
```typescript
const { data, error } = await supabase.storage
  .from('site-civeni')
  .upload(`speakers/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

const { data: { publicUrl } } = supabase.storage
  .from('site-civeni')
  .getPublicUrl(`speakers/${fileName}`);
```

---

## 🔧 Funções RPC

### Funções Admin (Requerem Autenticação)

**`check_user_role_secure(p_email text, p_session_token text)`**
- Valida sessão admin e retorna função do usuário
- Retorna: `TABLE (role text, is_valid boolean)`

**`admin_update_speaker(...)`**
- Atualiza dados de palestrante
- Params: `p_speaker_id`, `p_name`, `p_bio_jsonb`, `p_photo_url`, `user_email`, `session_token`

**`admin_delete_speaker(p_speaker_id uuid, user_email text, session_token text)`**
- Remove palestrante (soft delete)
- Retorna: boolean (sucesso)

### Funções Públicas

**`get_active_speakers()`**
- Retorna todos os palestrantes ativos
- Sem parâmetros
- Retorna: `TABLE (id uuid, name text, bio text, photo_url text, organization text)`

**`get_active_events()`**
- Retorna eventos ativos com categorias
- Retorna: JSON com eventos e suas categorias

**`verify_certificate_code(p_code text)`**
- Verifica certificado pelo código
- Retorna: Dados do certificado se válido

---

## 🔗 Links Relacionados

- [Visão Geral da Arquitetura](overview.md) — Arquitetura completa do sistema
- [Integração Stripe](stripe.md) — Fluxo de pagamentos
- [Padrões Backend](../desenvolvimento/padroes_backend.md) — Como usar RPC functions

---

**Autor**: Cleyber Silva
**Instituição**: ICMC - USP
**Contato**: cleyber.silva@usp.br
**Última Atualização**: 2025-11-28
