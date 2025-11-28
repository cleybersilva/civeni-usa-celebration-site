# Guia Completo - Página Transmissão ao Vivo

## 📋 Visão Geral

A página **Transmissão ao Vivo** (`/transmissao-ao-vivo`) é o hub central para todas as transmissões online do III CIVENI 2025. Esta página está totalmente integrada com o banco de dados Supabase e o painel administrativo.

## 🎯 Funcionalidades Principais

### 1. Aba "Ao Vivo"
- **Player de vídeo**: Exibe a transmissão ao vivo do YouTube
- **Informações da sessão**: Título, descrição, horário e status
- **Próximas transmissões**: Lista de eventos futuros agendados
- **Status em tempo real**: Badges indicando se está ao vivo, agendado ou encerrado

### 2. Aba "Agenda"
- **Programação online**: Mostra todas as sessões online publicadas
- **Filtragem por data**: Organização automática por dia
- **Status das sessões**: Indica se está ao vivo, em breve ou encerrado
- **Links diretos**: Botões para acessar as transmissões

### 3. Aba "Salas"
- **Salas virtuais**: Lista de salas de reunião (Google Meet, Zoom, etc.)
- **Status ao vivo**: Indica quais salas estão ativas
- **Acesso direto**: Botões para entrar nas salas

### 4. Aba "FAQ"
- **Perguntas frequentes**: Informações sobre requisitos técnicos
- **Suporte**: Como obter ajuda durante o evento
- **Multilíngue**: Suporte para PT, EN, ES e TR

## 🔧 Gerenciamento pelo Admin

### Como acessar
1. Faça login no painel admin: `/admin-dashboard`
2. No menu lateral, clique em **"Transmissão Ao Vivo"**
3. Você verá 3 gerenciadores principais:
   - **Streams**: Gerenciar transmissões
   - **Agenda**: Gerenciar cronograma
   - **FAQ**: Gerenciar perguntas frequentes

### Gerenciador de Streams

**Campos obrigatórios:**
- Título (multilíngue: PT, EN, ES, TR)
- Descrição (multilíngue)
- ID do vídeo do YouTube
- Canal do YouTube (ex: @CiveniUSA2025)

**Campos opcionais:**
- Data agendada
- Status (Ao vivo / Não ao vivo)
- Ordem de exibição

**Como adicionar uma nova transmissão:**
```
1. Clique em "Novo Stream"
2. Preencha os campos multilíngues
3. Adicione o ID do vídeo do YouTube (ex: dQw4w9WgXcQ)
4. Defina o canal (ex: @CiveniUSA2025)
5. Escolha se está ao vivo ou agendado
6. Salve
```

### Gerenciador de Agenda

**Campos principais:**
- Dia (1, 2, 3, etc.)
- Data (formato YYYY-MM-DD)
- Horário de início e fim
- Tópico (multilíngue)
- Palestrante
- Modalidade (online/presencial/híbrido)
- Link da sala de reunião
- ID do stream relacionado

**Como adicionar uma sessão:**
```
1. Clique em "Novo Item"
2. Defina o dia e data
3. Configure os horários
4. Preencha o tópico em todos os idiomas
5. Adicione o nome do palestrante
6. Escolha a modalidade
7. Cole o link do Google Meet/Zoom (se aplicável)
8. Ative a sessão
9. Salve
```

### Gerenciador de FAQ

**Estrutura:**
- Pergunta (multilíngue)
- Resposta (multilíngue)
- Ordem de exibição
- Status ativo/inativo

**Como adicionar uma pergunta:**
```
1. Clique em "Nova FAQ"
2. Escreva a pergunta em todos os idiomas
3. Escreva a resposta em todos os idiomas
4. Defina a ordem (1, 2, 3...)
5. Marque como ativa
6. Salve
```

## 📊 Integração com Banco de Dados

### Tabelas Utilizadas

**1. transmissions**
- Armazena dados principais das transmissões
- Campos multilíngues em formato JSONB
- Status: 'live', 'scheduled', 'ended'

**2. transmission_rooms**
- Salas virtuais para reuniões
- Vinculadas a uma transmissão específica
- Campo `is_live` indica se está ativa

**3. transmission_schedule** (Deprecated - usar schedules)
- Agenda de sessões
- Horários e palestrantes

**4. transmission_faq**
- Perguntas e respostas
- Totalmente multilíngue

**5. schedules**
- Tabela principal de programação
- Campo `type`: 'online' ou 'presencial'
- Usado pela aba "Agenda"

### Estrutura de Dados Multilíngue

Todos os campos de texto usam formato JSONB:
```json
{
  "pt": "Texto em português",
  "en": "Text in English",
  "es": "Texto en español",
  "tr": "Türkçe metin"
}
```

## 🎨 Personalização Visual

### Cores e Estilos
A página usa o sistema de design do CIVENI 2025:
- **Cores primárias**: `civeni-blue`, `civeni-red`
- **Componentes**: Seguem o padrão shadcn/ui
- **Animações**: Transições suaves e hover effects
- **Responsividade**: Mobile-first design

### Tokens de Design
```css
/* Cores principais */
--civeni-blue: /* Azul institucional */
--civeni-red: /* Vermelho institucional */

/* Gradientes */
bg-gradient-to-br from-civeni-blue to-civeni-red
```

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px (Stack vertical, tabs horizontais)
- **Tablet**: 768px - 1024px (Layout híbrido)
- **Desktop**: > 1024px (Layout em duas colunas)

### Comportamento Mobile
- Player full width
- Informações abaixo do vídeo
- Tabs com scroll horizontal suave
- Botões com altura confortável para toque

## 🔄 Sincronização e Cache

### Atualização Automática
- **Transmissões ao vivo**: Refetch a cada 30 segundos
- **Agendadas**: Refetch a cada 2 minutos
- **Encerradas**: Refetch a cada 10 minutos

### Cache
- React Query gerencia o cache automaticamente
- `staleTime`: 5 minutos para dados estáticos
- Invalidação manual disponível no admin

## 🚀 Próximos Passos

### Para Testar Localmente

1. **Adicionar uma transmissão de teste:**
```sql
INSERT INTO transmissions (
  slug, 
  title, 
  subtitle, 
  description, 
  status, 
  timezone, 
  youtube_video_id,
  channel_handle,
  is_public
) VALUES (
  'transmissao-ao-vivo',
  '{"pt": "Transmissão ao vivo", "en": "Live Stream"}',
  '{"pt": "Direto da Florida", "en": "Live from Florida"}',
  '{"pt": "Acompanhe ao vivo", "en": "Watch live"}',
  'live',
  'America/New_York',
  'dQw4w9WgXcQ',
  '@CiveniUSA2025',
  true
);
```

2. **Adicionar uma sala:**
```sql
INSERT INTO transmission_rooms (
  transmission_id,
  name,
  meet_url,
  is_live,
  ord
) VALUES (
  (SELECT id FROM transmissions WHERE slug = 'transmissao-ao-vivo'),
  '{"pt": "Sala Principal", "en": "Main Room"}',
  'https://meet.google.com/abc-defg-hij',
  true,
  1
);
```

3. **Adicionar uma sessão na agenda:**
```sql
INSERT INTO schedules (
  type,
  date,
  start_time,
  end_time,
  title,
  category,
  is_published
) VALUES (
  'online',
  '2025-12-11',
  '10:00:00',
  '11:00:00',
  'Palestra de Abertura',
  'palestra',
  true
);
```

## 🛡️ Segurança

### Row Level Security (RLS)
- **Leitura pública**: Qualquer um pode ver transmissões marcadas como `is_public = true`
- **Escrita restrita**: Apenas admin autenticado pode criar/editar
- **Validação**: Campos obrigatórios validados no frontend e backend

### Proteção de Dados
- Sanitização de URLs
- Validação de campos multilíngues
- Rate limiting nas APIs

## 📞 Suporte

### Contato
Para dúvidas técnicas sobre a página:
- Email: suporte@civeni.org
- WhatsApp: Disponível na página de contato

### Documentação Adicional
- [Guia de Admin](./README.md)
- [Documentação Supabase](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Última atualização**: Novembro 2025  
**Versão**: 2.0  
**Mantido por**: Equipe CIVENI Tech
