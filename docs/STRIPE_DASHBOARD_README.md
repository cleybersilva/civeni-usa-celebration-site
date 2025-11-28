# Dashboard Financeiro Stripe - Civeni 2025

## 📊 Visão Geral

Dashboard financeiro em tempo real que espelha os dados do Stripe para o Civeni 2025. Fornece visão completa de transações, KPIs, análises e relatórios, tudo sincronizado automaticamente via webhooks e com opção de backfill manual.

## 🎯 Funcionalidades Implementadas

### 1. **Schema Completo** ✅
- `stripe_events` - Eventos idempotentes do Stripe
- `stripe_checkout_sessions` - Sessões de checkout
- `stripe_payment_intents` - Intenções de pagamento
- `stripe_charges` - Cobranças (verdade sobre captura + detalhes do cartão)
- `stripe_refunds` - Reembolsos
- `stripe_disputes` - Disputas/chargebacks
- `stripe_payouts` - Repasses
- `stripe_balance_transactions` - Transações de saldo (taxas exatas)

### 2. **Webhooks Expandidos** ✅
Edge Function `stripe-webhook` processa:
- `checkout.session.*`
- `payment_intent.*`
- `charge.*`
- `refund.*`
- `dispute.*`
- `payout.*`

**Recursos:**
- Idempotência via `event.id`
- Enriquecimento de metadata (lote, cupom, email)
- Extração de dados do cartão (brand, funding, last4)
- Vinculação com `event_registrations`
- Balance transactions para taxas exatas
- Compatibilidade retroativa com `stripe_payments`

### 3. **API de Leitura** ✅

#### `finance-summary`
```
GET /finance-summary?from=2024-01-01&to=2024-12-31&currency=BRL&status=succeeded&lote=Lote1&cupom=DESC10&brand=visa
```
Retorna KPIs: bruto, taxas, líquido, ticket médio, conversão, reembolsos, disputas, próximo payout

#### `finance-timeseries`
```
GET /finance-timeseries?granularity=day&from=2024-01-01&to=2024-12-31
```
Retorna série temporal de receita (diária ou horária)

#### `finance-by-brand`
```
GET /finance-by-brand?from=2024-01-01&to=2024-12-31
```
Retorna receita agregada por bandeira e funding (credit/debit)

#### `finance-funnel`
```
GET /finance-funnel?from=2024-01-01&to=2024-12-31
```
Retorna funil: Sessions → Intents → Charges Succeeded

#### `finance-charges`
```
GET /finance-charges?limit=50&offset=0&from=2024-01-01&status=succeeded&brand=visa
```
Retorna lista paginada de transações detalhadas

#### `stripe-sync` (Admin only)
```
POST /stripe-sync
Body: { "since": "2024-01-01", "until": "2024-12-31", "resources": ["payment_intents", "charges", "refunds", "payouts"] }
```
Sincroniza histórico do Stripe (backfill)

### 4. **Interface Visual** ✅

#### Componentes Criados:
- **StripeFilters** - Filtros avançados (período, status, lote, cupom, bandeira)
- **RevenueChart** - Gráfico de área (receita bruta vs líquida ao longo do tempo)
- **BrandChart** - Gráfico de barras horizontal (receita por bandeira)
- **FunnelChart** - Visualização do funil de conversão
- **ChargesTable** - Tabela paginada com todas as transações

#### KPI Cards:
- 💰 Receita Líquida (com bruto e taxas)
- 👥 Inscrições Pagas (com taxa de conversão)
- 📈 Ticket Médio
- ⚠️ Alertas & Disputas (com reembolsos e falhas)
- 💵 Próximo Payout (data e valor)

### 5. **Realtime** ✅
- Assinatura de canal `stripe_realtime` para atualizações automáticas
- Atualização instantânea quando novos charges são processados
- Sem necessidade de refresh manual

### 6. **Timezone** ✅
- Todos os timestamps convertidos para `America/Fortaleza` (BRT -03:00)
- Views calculam datas no timezone correto
- UI exibe horários locais

## 🔐 Segurança

- RLS habilitado em todas as tabelas Stripe
- Apenas `is_current_user_admin()` pode ler
- Realtime habilitado apenas para tabelas críticas
- Nunca expõe PAN, CVC ou dados sensíveis
- Mascaramento de `last4` com `**** 1234`

## 📥 Como Usar

### 1. Configurar Webhook no Stripe
1. Acesse https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
3. Selecione eventos:
   - `checkout.session.*`
   - `payment_intent.*`
   - `charge.*`
   - `refund.*`
   - `dispute.*`
   - `payout.*`
4. Copie o `Webhook Secret` e configure como `STRIPE_WEBHOOK_SECRET` no Supabase

### 2. Sincronizar Histórico (Primeira vez)
No Dashboard Admin, clique em **Sincronizar** para buscar dados históricos do Stripe.

Ou via API:
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/stripe-sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "since": "2024-01-01",
    "until": "2024-12-31",
    "resources": ["payment_intents", "charges", "refunds", "payouts"]
  }'
```

### 3. Acessar Dashboard
Navegue para `/admin` → Dashboard Financeiro

## 📊 Views Disponíveis

### `v_fin_kpis`
KPIs gerais por moeda

### `v_fin_receita_diaria`
Receita diária (bruta, líquida, taxas) em BRT

### `v_fin_por_bandeira`
Agregação por bandeira e funding

### `v_fin_funnel`
Funil de conversão (sessions → intents → charges)

### `v_fin_heatmap_hora`
Quantidade de transações por hora do dia (BRT)

### `v_fin_coupons_lotes`
Receita por lote e cupom (via metadata)

## 🔄 Fluxo de Dados

```
Stripe Event → Webhook → stripe_events (idempotente)
                ↓
         Process by Type
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
Checkout Session      Payment Intent
    ↓                       ↓
    └─────→ Charge ←────────┘
                ↓
         Balance Transaction
                ↓
      stripe_charges (completo)
                ↓
         event_registrations (vincula)
                ↓
      Realtime → Dashboard UI
```

## 🎨 Filtros Disponíveis

- **Período:** 7d, 30d, 90d, Custom
- **Status:** Todos, Confirmado, Processando, Falhou, Reembolsado
- **Lote:** Texto livre
- **Cupom:** Texto livre
- **Bandeira:** Todas, Visa, Mastercard, Amex, Elo, Hipercard
- **Data Custom:** Calendário com início e fim

## 📈 Gráficos

### Revenue Chart (Area)
- Receita Bruta (linha superior)
- Receita Líquida (linha inferior)
- Tooltip com valores formatados em BRL
- Eixo X com datas DD/MM

### Brand Chart (Bar Horizontal)
- Barras por bandeira/funding
- Ordenado por receita líquida
- Badges com quantidade de transações

### Funnel Chart (Stages)
- 3 etapas visuais com barras proporcionais
- Percentual de conversão entre etapas
- Taxa total destacada

## 🔗 Integração com Registrations

Quando um `charge` é processado:
1. Busca `payment_intent.metadata.email` ou `charge.receipt_email`
2. Procura em `event_registrations` por esse email
3. Atualiza campos:
   - `stripe_checkout_session_id`
   - `stripe_payment_intent_id`
   - `stripe_charge_id`
4. Enriquece metadata com `category_name`, `coupon_code`, `batch_id`, `lote_id`

## 🛠️ Troubleshooting

### Dashboard não carrega
1. Verifique se as Edge Functions estão deployadas
2. Confira logs: `supabase functions logs`
3. Verifique RLS policies (admin deve ter acesso)

### Dados desatualizados
1. Clique em **Atualizar** no header
2. Verifique webhook no Stripe (última entrega)
3. Execute sincronização manual

### Valores divergentes
1. Execute `stripe-sync` para reconciliação
2. Verifique `stripe_events` com status `error`
3. Compare com Dashboard Stripe oficial

## 📝 Próximos Passos

- [ ] Exportar relatórios CSV/PDF
- [ ] Heatmap visual por hora do dia
- [ ] Análise de falhas por `failure_code`
- [ ] Alertas automatizados (email/Slack)
- [ ] Comparativo período anterior
- [ ] Projeções de receita

## 📞 Suporte

Para dúvidas sobre o Dashboard Financeiro Stripe do Civeni 2025, consulte a documentação técnica ou contate o time de desenvolvimento.
