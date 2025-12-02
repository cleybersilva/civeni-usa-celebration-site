# 💳 Integração Stripe — Processamento de Pagamentos

> Documentação completa do fluxo de pagamentos, webhooks, analytics financeiras e integração com Stripe

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo de Checkout](#fluxo-de-checkout)
3. [Webhooks](#webhooks)
4. [Produtos e Preços](#produtos-e-preços)
5. [Analytics Financeiras](#analytics-financeiras)
6. [Configuração](#configuração)

---

## 🎯 Visão Geral

A Plataforma CIVENI utiliza **Stripe** como gateway de pagamento principal para processar inscrições de eventos.

### Funcionalidades

✅ **Checkout Session** — Interface de pagamento hospedada pelo Stripe
✅ **Múltiplos Métodos** — Cartões, PIX, Boleto, Carteiras digitais
✅ **Multi-moeda** — BRL, USD, EUR
✅ **Webhooks** — Confirmação automática de pagamentos
✅ **Analytics** — Dashboard financeiro em tempo real
✅ **Cupons** — Descontos e promoções
✅ **Subscription** — Suporte para pagamentos recorrentes (futuro)

---

## 🛒 Fluxo de Checkout

### Diagrama do Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário seleciona categoria e preenche formulário        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend valida dados (SecurityProvider)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. POST /functions/v1/create-registration-payment           │
│    {                                                         │
│      categoryId: "uuid",                                     │
│      eventId: "uuid",                                        │
│      userData: { name, email, phone, document },             │
│      couponCode: "EARLY2025" (opcional)                      │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Edge Function cria Stripe Checkout Session               │
│    - Busca category_id → stripe_price_id                    │
│    - Aplica cupom se fornecido                               │
│    - Define success_url e cancel_url                         │
│    - Metadata: { eventId, categoryId, userData }             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Retorna { sessionId, url }                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend redireciona usuário para checkout.stripe.com    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Usuário completa pagamento na interface Stripe           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Stripe envia webhook "checkout.session.completed"        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Edge Function /stripe-webhook processa evento            │
│    - Valida assinatura do webhook                            │
│    - Extrai metadata (eventId, categoryId, userData)         │
│    - Cria registro em event_registrations                    │
│    - Status: "paid"                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Edge Function /send-registration-confirmation           │
│     - Envia e-mail de confirmação via SendGrid               │
│     - Inclui dados do evento e QR code                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Stripe redireciona usuário para success_url             │
│     /registration-success?session_id=cs_test_...             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. Frontend exibe página de sucesso com confirmação        │
└─────────────────────────────────────────────────────────────┘
```

### Implementação do Checkout

**Frontend** (`src/pages/InscricaoPresencial.tsx`):

```typescript
const handleSubmit = async (formData) => {
  // 1. Validar dados
  const validatedData = securityValidator.validateRegistrationData(formData);

  // 2. Chamar Edge Function
  const { data, error } = await supabase.functions.invoke(
    'create-registration-payment',
    {
      body: {
        categoryId: selectedCategory.id,
        eventId: currentEvent.id,
        userData: validatedData,
        couponCode: appliedCoupon?.code
      }
    }
  );

  if (error) {
    toast.error('Erro ao processar pagamento');
    return;
  }

  // 3. Redirecionar para Stripe
  window.location.href = data.url;
};
```

**Edge Function** (`supabase/functions/create-registration-payment/index.ts`):

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card', 'boleto'],
  line_items: [
    {
      price: category.stripe_price_id,
      quantity: 1,
    },
  ],
  discounts: coupon ? [{ coupon: coupon.stripe_coupon_id }] : [],
  success_url: `${siteUrl}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${siteUrl}/registration-canceled`,
  metadata: {
    eventId,
    categoryId,
    userName: userData.name,
    userEmail: userData.email,
    userPhone: userData.phone,
    documentNumber: userData.document,
  },
});

return new Response(
  JSON.stringify({
    sessionId: session.id,
    url: session.url,
  }),
  { headers: { 'Content-Type': 'application/json' } }
);
```

---

## 🔔 Webhooks

### Configuração

**URL do Webhook**: `https://wdkeqxfglmritghmakma.supabase.co/functions/v1/stripe-webhook`

**Eventos Subscritos**:
- `checkout.session.completed` — Checkout finalizado com sucesso
- `payment_intent.succeeded` — Pagamento confirmado
- `charge.succeeded` — Cobrança bem-sucedida
- `charge.refunded` — Reembolso processado

### Validação de Assinatura

Todo webhook **DEVE** validar a assinatura para garantir autenticidade:

```typescript
const signature = req.headers.get('stripe-signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

let event;
try {
  event = stripe.webhooks.constructEvent(
    await req.text(),
    signature,
    webhookSecret
  );
} catch (err) {
  console.error('⚠️ Webhook signature verification failed:', err.message);
  return new Response(
    JSON.stringify({ error: 'Invalid signature' }),
    { status: 400 }
  );
}
```

### Processamento de Eventos

**`checkout.session.completed`**:

```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;

  // Extrair metadata
  const { eventId, categoryId, userName, userEmail, userPhone, documentNumber } =
    session.metadata;

  // Criar registro de inscrição
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      category_id: categoryId,
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      document_number: documentNumber,
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      amount_paid_cents: session.amount_total,
      confirmed_at: new Date().toISOString(),
    });

  // Enviar e-mail de confirmação
  await supabase.functions.invoke('send-registration-confirmation', {
    body: { registrationId: data.id, language: 'pt' },
  });
}
```

**`charge.refunded`**:

```typescript
if (event.type === 'charge.refunded') {
  const charge = event.data.object;

  // Atualizar status da inscrição
  await supabase
    .from('event_registrations')
    .update({
      payment_status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent', charge.payment_intent);
}
```

---

## 📦 Produtos e Preços

### Estrutura no Stripe

Cada **categoria de inscrição** corresponde a um **Produto Stripe** com **Preço** associado.

**Exemplo**:

| Categoria | Produto Stripe | Preço (BRL) | Price ID |
|-----------|----------------|-------------|----------|
| Estudante Early Bird | CIVENI 2025 - Estudante | R$ 150,00 | `price_1ABC123...` |
| Profissional Regular | CIVENI 2025 - Profissional | R$ 350,00 | `price_1DEF456...` |
| Parceiro VIP | CIVENI 2025 - Parceiro | R$ 0,00 (Grátis) | `price_1GHI789...` |

### Sincronização

A tabela `event_category` armazena `stripe_price_id`:

```sql
SELECT
  title_pt,
  price_cents / 100.0 AS price_brl,
  stripe_price_id
FROM event_category
WHERE is_active = true;
```

**Edge Function** `sync-category-stripe`:
- Cria ou atualiza produto no Stripe
- Salva `stripe_price_id` no banco
- Sincroniza preços e metadados

### Cupons de Desconto

Cupons são criados no **Dashboard Stripe** e referenciados na tabela `coupons`:

```sql
CREATE TABLE coupons (
  id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,
  stripe_coupon_id text,
  discount_percent integer,
  discount_amount_cents integer,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses integer,
  uses_count integer DEFAULT 0,
  is_active boolean DEFAULT true
);
```

**Validação de Cupom**:

```typescript
const { data: coupon } = await supabase
  .from('coupons')
  .select('*')
  .eq('code', couponCode)
  .eq('is_active', true)
  .single();

if (!coupon) {
  throw new Error('Cupom inválido ou expirado');
}

if (coupon.uses_count >= coupon.max_uses) {
  throw new Error('Cupom esgotado');
}

if (new Date() > new Date(coupon.valid_until)) {
  throw new Error('Cupom expirado');
}
```

---

## 📊 Analytics Financeiras

### Dashboard Financeiro

A plataforma oferece analytics em tempo real via Edge Functions.

#### KPIs Principais

**Endpoint**: `GET /functions/v1/finance-kpis`

```json
{
  "totalRevenue": 125750.00,
  "totalParticipants": 523,
  "averageTicket": 240.48,
  "conversionRate": 0.68,
  "pendingAmount": 8500.00,
  "refundedAmount": 1200.00
}
```

#### Séries Temporais

**Endpoint**: `GET /functions/v1/finance-series?period=daily&startDate=2025-01-01&endDate=2025-01-31`

```json
{
  "series": [
    {
      "date": "2025-01-01",
      "revenue": 4500.00,
      "count": 18,
      "averageTicket": 250.00
    },
    {
      "date": "2025-01-02",
      "revenue": 6200.00,
      "count": 25,
      "averageTicket": 248.00
    }
  ]
}
```

#### Breakdown por Categoria

**Endpoint**: `GET /functions/v1/finance-breakdown`

```json
{
  "byCategory": [
    {
      "category": "Estudante",
      "revenue": 45000.00,
      "count": 300,
      "percentage": 35.8
    },
    {
      "category": "Profissional",
      "revenue": 70000.00,
      "count": 200,
      "percentage": 55.7
    }
  ],
  "byPaymentMethod": [
    {
      "method": "card",
      "revenue": 95000.00,
      "count": 420,
      "percentage": 75.5
    },
    {
      "method": "boleto",
      "revenue": 30750.00,
      "count": 103,
      "percentage": 24.5
    }
  ]
}
```

#### Funil de Conversão

**Endpoint**: `GET /functions/v1/finance-funnel`

```json
{
  "stages": [
    {
      "stage": "visited_registration",
      "count": 1500,
      "percentage": 100.0
    },
    {
      "stage": "started_checkout",
      "count": 750,
      "percentage": 50.0,
      "dropoff": 750
    },
    {
      "stage": "completed_payment",
      "count": 523,
      "percentage": 34.9,
      "dropoff": 227
    }
  ],
  "overallConversion": 0.349
}
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

**Production (Supabase Edge Functions Secrets)**:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Development (`.env` local)**:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Configuração no Dashboard Stripe

#### 1. Criar Produtos

1. Acessar **Products** → **Add Product**
2. Preencher:
   - **Name**: CIVENI 2025 - Estudante
   - **Description**: Inscrição de estudante para CIVENI 2025
   - **Pricing**: R$ 150,00 BRL
   - **Billing**: One-time
3. Copiar **Price ID** (ex: `price_1ABC123...`)
4. Salvar em `event_category.stripe_price_id`

#### 2. Configurar Webhooks

1. Acessar **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://wdkeqxfglmritghmakma.supabase.co/functions/v1/stripe-webhook`
3. **Events to send**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.succeeded`
   - `charge.refunded`
4. Copiar **Signing secret** (ex: `whsec_...`)
5. Salvar em secrets do Supabase: `STRIPE_WEBHOOK_SECRET`

#### 3. Configurar Métodos de Pagamento

1. Acessar **Settings** → **Payment methods**
2. Habilitar:
   - ✅ Cards (Visa, Mastercard, Amex)
   - ✅ Boleto (Brasil)
   - ✅ PIX (Brasil)
   - ✅ Digital wallets (Apple Pay, Google Pay)

#### 4. Criar Cupons (Opcional)

1. Acessar **Products** → **Coupons** → **Create coupon**
2. Preencher:
   - **ID**: `EARLY2025`
   - **Type**: Percentage discount
   - **Discount**: 20%
   - **Duration**: Once
   - **Max redemptions**: 100
3. Copiar **Coupon ID**
4. Criar registro em tabela `coupons` com `stripe_coupon_id`

---

## 🔗 Links Relacionados

- [Visão Geral da Arquitetura](overview.md) — Arquitetura completa
- [Arquitetura Supabase](supabase.md) — Edge Functions e webhooks
- [Fluxo de Inscrições](../fluxo_eventos/inscricoes.md) — Processo completo de inscrição

---

**Autor**: Cleyber Silva
**Instituição**: ICMC - USP
**Contato**: cleyber.silva@usp.br
**Última Atualização**: 2025-11-28
