# ⚡ Deploy de Edge Functions

> Guia para implantar, atualizar e monitorar Edge Functions do Supabase

---

## 📋 Pré-requisitos

- **Supabase CLI** instalado
- Projeto vinculado ao Supabase Cloud
- Acesso ao projeto `wdkeqxfglmritghmakma`

### Instalação da Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verificar instalação
supabase --version
```

---

## 🔗 Vincular Projeto

```bash
# Vincular ao projeto remoto
supabase link --project-ref wdkeqxfglmritghmakma

# Será solicitado:
# - Password do banco de dados (obtenha no Dashboard Supabase)
```

---

## 🚀 Deploy de Funções

### Deploy de Uma Função Específica

```bash
# Deploy de função individual
supabase functions deploy create-registration-payment

# Com secrets (se necessário)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase functions deploy create-registration-payment
```

### Deploy de Todas as Funções

```bash
# Deploy de todas as funções de uma vez
supabase functions deploy
```

### Verificar Funções Implantadas

```bash
# Listar todas as funções
supabase functions list
```

---

## 🔐 Gerenciamento de Secrets

### Definir Secrets

```bash
# Definir um secret
supabase secrets set STRIPE_SECRET_KEY=sk_live_abc123...

# Definir múltiplos secrets
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  LOVABLE_API_KEY=...
```

### Listar Secrets

```bash
# Ver lista de secrets (valores não são mostrados)
supabase secrets list
```

### Remover Secret

```bash
# Deletar um secret
supabase secrets unset STRIPE_SECRET_KEY
```

---

## 📝 Logs e Debugging

### Ver Logs em Tempo Real

```bash
# Logs de uma função específica
supabase functions logs create-registration-payment --follow

# Logs de todas as funções
supabase functions logs --follow
```

### Filtrar Logs por Nível

```bash
# Apenas erros
supabase functions logs my-function --level error

# Info e acima
supabase functions logs my-function --level info
```

---

## 🧪 Teste Local

### Servir Função Localmente

```bash
# Iniciar servidor local
supabase start

# Servir função específica
supabase functions serve create-registration-payment --env-file .env.local

# Acessar em: http://localhost:54321/functions/v1/create-registration-payment
```

### Testar com cURL

```bash
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/create-registration-payment' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "categoryId": "uuid-here",
    "eventId": "uuid-here",
    "userData": {
      "name": "Teste",
      "email": "teste@example.com"
    }
  }'
```

---

## 📦 Estrutura de Arquivos

Cada Edge Function deve seguir esta estrutura:

```
supabase/functions/
├── my-function/
│   ├── index.ts          # Código principal
│   └── README.md         # Documentação (opcional)
└── _shared/              # Código compartilhado (opcional)
    └── corsHeaders.ts
```

### Template de Função

```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { param1, param2 } = await req.json();

    // Sua lógica aqui
    const result = await processLogic(param1, param2);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

---

## 🔄 Versionamento

### Estratégia de Versionamento

1. **Desenvolvimento**: Testar localmente primeiro
2. **Staging**: Deploy em ambiente de teste (se disponível)
3. **Produção**: Deploy após testes completos

### Rollback

Se uma função apresentar problemas:

```bash
# 1. Fazer deploy da versão anterior
git checkout <commit-anterior>
supabase functions deploy my-function

# 2. Ou reverter código localmente e fazer deploy
supabase functions deploy my-function
```

---

## 📊 Monitoramento

### Dashboard Supabase

1. Acessar: https://supabase.com/dashboard/project/wdkeqxfglmritghmakma
2. Navegar para **Edge Functions**
3. Ver métricas:
   - **Invocations**: Número de chamadas
   - **Errors**: Taxa de erros
   - **Duration**: Tempo de execução

### Logs no Dashboard

- **Real-time logs**: Ver logs conforme chegam
- **Filtros**: Filtrar por função, nível, timestamp
- **Search**: Buscar por texto específico

---

## ⚠️ Troubleshooting

### Função Não Inicia

**Problema**: Função não responde após deploy

**Soluções**:
1. Verificar logs: `supabase functions logs my-function`
2. Verificar secrets estão definidos
3. Verificar sintaxe TypeScript
4. Testar localmente primeiro

### Cold Start Lento

**Problema**: Primeira requisição demora muito

**Soluções**:
1. Minimizar imports pesados
2. Usar lazy loading
3. Considerar warm-up requests

### Erro de CORS

**Problema**: Navegador bloqueia requisições

**Solução**:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Ou domínio específico
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 🔗 Links Relacionados

- [Arquitetura Supabase](../arquitetura/supabase.md) — Todas as Edge Functions disponíveis
- [Padrões Backend](../desenvolvimento/padroes_backend.md) — Como escrever Edge Functions
- [Guia de Deploy](deploy.md) — Deploy completo da aplicação

---

**Autor**: Cleyber Silva
**Instituição**: ICMC - USP
**Contato**: cleyber.silva@usp.br
**Última Atualização**: 2025-11-28
