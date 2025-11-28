# Guia de Deploy CIVENI

Guia completo para implantação da plataforma CIVENI em produção.

## Índice

1. [Checklist Pré-Deploy](#checklist-pré-deploy)
2. [Deploy no cPanel](#deploy-no-cpanel)
3. [Configuração de Ambiente](#configuração-de-ambiente)
4. [Verificação Pós-Deploy](#verificação-pós-deploy)
5. [Procedimentos de Rollback](#procedimentos-de-rollback)
6. [Solução de Problemas](#solução-de-problemas)

## Checklist Pré-Deploy

### Qualidade de Código

- [ ] Todos os erros de compilação TypeScript resolvidos
- [ ] ESLint não mostra erros
- [ ] Todos os testes passando (testes manuais completos)
- [ ] Nenhum console.error no código de produção
- [ ] Headers de segurança configurados
- [ ] Redirecionamento HTTPS habilitado

### Banco de Dados

- [ ] Todas as migrações aplicadas ao banco de produção
- [ ] Políticas RLS configuradas corretamente
- [ ] Usuários admin criados e funções atribuídas
- [ ] Dados de teste removidos
- [ ] Backup do banco de produção criado

### Edge Functions

- [ ] Todas as funções implantadas no Supabase
- [ ] Variáveis de ambiente definidas no dashboard Supabase
- [ ] Endpoints de webhook configurados no Stripe
- [ ] Logs de funções revisados para erros

### Assets

- [ ] Todas as imagens otimizadas
- [ ] Arquivos de favicon presentes
- [ ] Service worker configurado
- [ ] Arquivo manifest atualizado

### Configuração

- [ ] Variáveis `.env` documentadas
- [ ] Chaves Stripe configuradas (modo produção)
- [ ] Serviço de e-mail configurado
- [ ] Configurações CORS atualizadas para domínio de produção

## Deploy no cPanel

### Método 1: Script de Build (Recomendado)

1. **Executar script de build**
   ```bash
   ./build-cpanel.sh
   ```

   Isso cria `civeni-saas-cpanel.zip` com:
   - Build de produção otimizado
   - Headers de segurança (.htaccess)
   - Service worker
   - Todos os assets estáticos

2. **Upload para cPanel**
   - Fazer login no cPanel
   - Navegar para Gerenciador de Arquivos
   - Ir para `public_html/` (ou raiz do domínio)
   - Upload de `civeni-saas-cpanel.zip`
   - Extrair arquivo
   - Verificar se `.htaccess` está presente

3. **Verificar deployment**
   - Visitar seu domínio
   - Verificar se redirecionamento HTTPS funciona
   - Testar roteamento (atualizar em sub-páginas)
   - Verificar se assets carregam corretamente

### Método 2: Script Python

Método alternativo de build:

```bash
python3 create-cpanel-zip.py
```

Produz mesmo resultado do script bash, útil em sistemas Windows.

### Estrutura de Diretórios Após Deploy

```
public_html/
├── index.html
├── .htaccess              # CRÍTICO - roteamento & segurança
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── uploads/
│   └── [arquivos de imagem]
├── service-worker.js
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
└── _headers
```

## Configuração de Ambiente

### Variáveis de Ambiente Frontend

Definir em `.env` antes do build:

```env
# Configuração Supabase
VITE_SUPABASE_URL=https://wdkeqxfglmritghmakma.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...

# Opcional
VITE_DEBUG=false
```

**IMPORTANTE**: Nunca commitar `.env` no repositório!

### Secrets de Edge Functions Supabase

Definir em Dashboard Supabase → Configurações → Edge Functions:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LOVABLE_API_KEY=...
SENDGRID_API_KEY=...
```

### Configuração Stripe

1. **Dashboard → Developers → Webhooks**
   - Adicionar endpoint: `https://wdkeqxfglmritghmakma.supabase.co/functions/v1/stripe-webhook`
   - Selecionar eventos:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `charge.succeeded`
   - Copiar webhook signing secret para secrets Supabase

2. **Produtos e Preços**
   - Criar produtos para cada categoria de evento
   - Copiar IDs de Preço para `event_category.stripe_price_id`

### Apache .htaccess

**CRÍTICO**: `.htaccess` deve estar presente para:
- Roteamento SPA (todas as rotas → index.html)
- Headers de segurança
- Redirecionamento HTTPS
- Compressão

```apache
# Redirecionamento HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Roteamento SPA
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Headers de Segurança
Header set X-Frame-Options "DENY"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# Content Security Policy
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://wdkeqxfglmritghmakma.supabase.co https://checkout.stripe.com https://api.stripe.com;"

# Compressão
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Controle de Cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 1 day"
</IfModule>
```

## Verificação Pós-Deploy

### Verificações Automatizadas

Executar script de verificação:
```bash
# Da máquina local
curl -I https://seudominio.com
```

Verificar:
- Status: 200 OK
- Presença de headers de segurança
- Conexão HTTPS

### Verificação Manual

**Site Público**:
- [ ] Página inicial carrega corretamente
- [ ] Todos os links de navegação funcionam
- [ ] Página de palestrantes exibe fotos
- [ ] Páginas de programação mostram dados
- [ ] Formulário de inscrição abre
- [ ] Troca de idioma funciona
- [ ] Design responsivo mobile funciona
- [ ] Service Worker registra
- [ ] PWA instalável

**Painel Admin**:
- [ ] Página de login acessível em `/admin`
- [ ] Credenciais admin funcionam
- [ ] Dashboard carrega sem erros
- [ ] Operações CRUD funcionais
- [ ] Uploads de imagem funcionam
- [ ] Gráficos financeiros exibem
- [ ] Funções de exportação funcionam

**Fluxo de Pagamento**:
- [ ] Stripe Checkout abre
- [ ] Pagamento de teste processa (usar cartões de teste Stripe)
- [ ] Webhook recebe eventos
- [ ] Inscrição criada no banco de dados
- [ ] E-mail de confirmação enviado

**Sistema de Certificados**:
- [ ] Geração de certificados funciona
- [ ] PDF baixa corretamente
- [ ] Entrega de e-mail funcional
- [ ] Página de verificação funciona

### Testes de Performance

```bash
# Google PageSpeed Insights
https://pagespeed.web.dev/

# Verificar todas as páginas:
- Home
- Palestrantes
- Programação
- Inscrições

# Metas de pontuação:
- Performance: > 90
- Acessibilidade: > 95
- Melhores Práticas: > 95
- SEO: > 95
```

### Testes de Segurança

- [ ] HTTPS forçado (HTTP redireciona para HTTPS)
- [ ] Headers de segurança presentes (verificar com securityheaders.com)
- [ ] Sem dados sensíveis em logs do console
- [ ] Proteção CSRF ativa
- [ ] Testes de SQL injection falham (entrada sanitizada)
- [ ] Tentativas XSS bloqueadas (headers CSP)
- [ ] Rotas admin requerem autenticação

## Procedimentos de Rollback

### Rollback Rápido

Se deployment falhar:

1. **Acessar Gerenciador de Arquivos cPanel**
2. **Navegar para public_html/**
3. **Deletar arquivos atuais**
4. **Upload versão anterior funcional**
5. **Extrair arquivo**

### Rollback de Banco de Dados

Se migração de banco falhar:

```bash
# No Dashboard Supabase → Database → Migrations
# Reverter para migração anterior

# Ou usando CLI:
supabase db reset --db-url <production-url>
```

**AVISO**: Apenas reverter banco se absolutamente necessário. Pode ocorrer perda de dados.

### Rollback de Edge Function

```bash
# Implantar versão anterior
supabase functions deploy function-name --project-ref wdkeqxfglmritghmakma
```

## Solução de Problemas

### Problemas Comuns de Deploy

#### Problema: Rotas retornam 404 ao atualizar

**Causa**: `.htaccess` ausente ou não carregado

**Solução**:
1. Verificar se `.htaccess` existe na raiz
2. Verificar se Apache tem `mod_rewrite` habilitado
3. Verificar `AllowOverride All` na config Apache

#### Problema: Assets falham ao carregar (404)

**Causa**: Caminhos de assets incorretos ou arquivos ausentes

**Solução**:
1. Verificar se `index.html` tem caminhos de assets corretos
2. Verificar se diretório `assets/` existe
3. Verificar console do navegador para arquivos específicos ausentes
4. Limpar cache do navegador

#### Problema: Redirecionamento HTTPS não funciona

**Causa**: `.htaccess` RewriteEngine não ativo

**Solução**:
1. Verificar módulo `mod_rewrite` Apache habilitado
2. Verificar sintaxe `.htaccess`
3. Testar com: `curl -I http://seudominio.com`

#### Problema: Webhook de pagamento não dispara

**Causa**: URL webhook incorreta ou falha na validação de assinatura

**Solução**:
1. Verificar URL webhook no Dashboard Stripe
2. Verificar se webhook signing secret corresponde ao secret Supabase
3. Revisar logs de função Supabase para erros
4. Testar com Stripe CLI: `stripe trigger checkout.session.completed`

#### Problema: Imagens não carregam do Supabase Storage

**Causa**: Configuração CORS ou políticas RLS

**Solução**:
1. Verificar configurações CORS do Supabase Storage
2. Verificar se bucket é público
3. Verificar se políticas RLS permitem leitura pública
4. Testar URL da imagem diretamente no navegador

#### Problema: Login admin falha

**Causa**: Validação de sessão ou problemas de política RLS

**Solução**:
1. Verificar se tabela `admin_users` tem registro de usuário
2. Verificar se função RPC `check_user_role_secure` existe
3. Verificar localStorage do navegador para dados de sessão
4. Revisar logs Supabase para erros de auth

### Problemas de Performance

#### Carregamento lento de página

**Soluções**:
- Habilitar compressão em `.htaccess`
- Otimizar imagens (usar formato WebP)
- Implementar lazy loading
- Revisar tamanho de bundle: `npm run build -- --analyze`

#### Queries de banco lentas

**Soluções**:
- Adicionar índices a colunas frequentemente consultadas
- Usar views de banco para queries complexas
- Implementar paginação
- Cachear resultados com TanStack Query

### Monitoramento

**Dashboard Supabase**:
- Monitorar logs de Edge Functions
- Verificar métricas de performance do banco
- Revisar uso de storage

**DevTools do Navegador**:
- Aba Network para tempos de carregamento
- Console para erros JavaScript
- Aba Application para Service Worker

**Ferramentas Externas**:
- Google Analytics para comportamento de usuário
- Sentry para rastreamento de erros (se configurado)
- Serviço de monitoramento de uptime

## Deploy Contínuo

Para deploys automatizados:

1. **Configurar pipeline CI/CD** (exemplo GitHub Actions):

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy to cPanel
        uses: SamKirkland/FTP-Deploy-Action@4.0.0
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
```

2. **Configurar secrets nas configurações do repositório GitHub**

3. **Testar deployment em ambiente de staging primeiro**

## Estratégia de Backup

### Backups de Banco de Dados

**Automatizado**:
- Supabase fornece backups diários automáticos
- Retidos por 7 dias no plano gratuito

**Manual**:
```bash
# Exportar banco de dados
supabase db dump -f backup.sql --project-ref wdkeqxfglmritghmakma

# Importar banco de dados
supabase db reset --db-url <database-url> --file backup.sql
```

### Backups de Arquivos

**Antes de cada deployment**:
1. Baixar arquivos de produção atuais do cPanel
2. Armazenar em pasta `backups/AAAA-MM-DD/`
3. Manter últimos 5 deployments

**Backups de Storage**:
- Supabase Storage tem versionamento automático
- Baixar assets críticos periodicamente

---

**Última Atualização**: 2025-11-28
**Versão de Deploy**: Produção 2.0
