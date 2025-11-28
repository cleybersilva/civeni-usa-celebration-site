# 🔧 Padrões Backend — Supabase e RPC Functions

> Convenções e melhores práticas para desenvolvimento backend com Supabase, PostgreSQL e Edge Functions

---

## 📋 Índice

1. [Padrões de Consulta ao Banco](#padrões-de-consulta-ao-banco)
2. [Funções RPC Admin](#funções-rpc-admin)
3. [Upload de Imagens](#upload-de-imagens)
4. [Edge Functions](#edge-functions)
5. [Segurança](#segurança)

---

## 🗄️ Padrões de Consulta ao Banco

### Consulta Básica

✅ **Bom** — Selecionar apenas colunas necessárias:

```typescript
const { data, error } = await supabase
  .from('speakers')
  .select('id, name, bio, photo_url')
  .eq('is_active', true)
  .order('name');
```

❌ **Evitar** — Selecionar todas as colunas sem necessidade:

```typescript
const { data, error } = await supabase
  .from('speakers')
  .select('*');  // Muitos dados desnecessários
```

### Consulta com Relações

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

### Paginação

```typescript
const ITEMS_PER_PAGE = 10;
const page = 1;

const { data, error, count } = await supabase
  .from('event_registrations')
  .select('*', { count: 'exact' })
  .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
```

---

## 🔐 Funções RPC Admin

**IMPORTANTE**: Todas as operações admin devem usar funções RPC que validam sessão.

### Padrão de Chamada

```typescript
// 1. Obter sessão do localStorage
const sessionRaw = localStorage.getItem('adminSession');
if (!sessionRaw) {
  throw new Error('Sessão não encontrada');
}

const { user, session_token } = JSON.parse(sessionRaw);

// 2. Chamar função RPC com validação
const { data, error } = await supabase.rpc('admin_update_speaker', {
  p_speaker_id: speakerId,
  p_name: name,
  p_bio_jsonb: { pt: bioPt, en: bioEn, es: bioEs, tr: bioTr },
  p_photo_url: photoUrl,
  user_email: user.email,
  session_token: session_token
});

if (error) {
  throw error;
}
```

### Nunca Fazer Queries Diretas Admin

❌ **ERRADO** — Query direta bypassa segurança:

```typescript
// NÃO FAZER ISSO!
const { data, error } = await supabase
  .from('speakers')
  .update({ name, bio })
  .eq('id', speakerId);
```

✅ **CORRETO** — Usar RPC function:

```typescript
const { data, error } = await supabase.rpc('admin_update_speaker', {
  p_speaker_id: speakerId,
  p_name: name,
  user_email: adminEmail,
  session_token: sessionToken
});
```

---

## 📸 Upload de Imagens

### Padrão Completo

```typescript
async function uploadSpeakerPhoto(file: File, speakerId: string): Promise<string> {
  // 1. Validar arquivo
  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo deve ser uma imagem');
  }

  if (file.size > 10 * 1024 * 1024) {  // 10MB
    throw new Error('Arquivo muito grande (máx 10MB)');
  }

  // 2. Gerar nome único
  const fileExt = file.name.split('.').pop();
  const fileName = `${speakerId}-${Date.now()}.${fileExt}`;

  // 3. Upload para storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('site-civeni')
    .upload(`speakers/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // 4. Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('site-civeni')
    .getPublicUrl(`speakers/${fileName}`);

  // 5. Atualizar banco de dados com incremento de versão
  const { error: updateError } = await supabase
    .from('speakers')
    .update({
      photo_url: publicUrl,
      photo_version: supabase.sql`photo_version + 1`
    })
    .eq('id', speakerId);

  if (updateError) throw updateError;

  return publicUrl;
}
```

### Versionamento de Imagens

URLs incluem parâmetro de versão para cache busting:

```typescript
const imageUrl = `${speaker.photo_url}?v=${speaker.photo_version}`;
```

---

## ⚡ Edge Functions

### Estrutura de Arquivo

```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // 1. CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // 2. Parsear body
    const { param1, param2 } = await req.json();

    // 3. Validar inputs
    if (!param1) {
      throw new Error('param1 é obrigatório');
    }

    // 4. Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 5. Lógica da função
    const result = await processarLogica(param1, param2);

    // 6. Retornar resposta
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    // 7. Tratamento de erros
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

### Deploy

```bash
# Deploy de uma função específica
supabase functions deploy my-function --project-ref wdkeqxfglmritghmakma

# Ver logs em tempo real
supabase functions logs my-function --follow
```

---

## 🔒 Segurança

### Validação de Entrada

Sempre validar e sanitizar inputs antes de usar:

```typescript
import { z } from 'zod';

const registrationSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  document: z.string().min(11).max(14)
});

// Validar
const validatedData = registrationSchema.parse(userData);
```

### Prevenção SQL Injection

✅ **Correto** — Queries parametrizadas:

```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail);  // Supabase escapa automaticamente
```

❌ **NUNCA** fazer query raw com concatenação:

```typescript
// NÃO FAZER ISSO!
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

### Rate Limiting

Frontend implementa rate limiting via `SecurityProvider`:

```typescript
const rateLimiter = {
  requests: 0,
  lastReset: Date.now(),
  limit: 100,  // 100 requisições
  window: 60000,  // por minuto

  check() {
    const now = Date.now();
    if (now - this.lastReset > this.window) {
      this.requests = 0;
      this.lastReset = now;
    }

    if (this.requests >= this.limit) {
      throw new Error('Rate limit excedido. Aguarde 1 minuto.');
    }

    this.requests++;
  }
};
```

---

## 🔗 Links Relacionados

- [Arquitetura Supabase](../arquitetura/supabase.md) — Esquema e Edge Functions
- [Padrões Frontend](padroes_frontend.md) — React e TypeScript
- [Deploy de Edge Functions](../operacoes/edge_functions.md) — Como implantar

---

**Autor**: Cleyber Silva
**Instituição**: ICMC - USP
**Contato**: cleyber.silva@usp.br
**Última Atualização**: 2025-11-28
