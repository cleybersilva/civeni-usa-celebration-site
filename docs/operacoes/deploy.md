# 🚀 Guia de Deploy CIVENI

> Guia completo e visual para implantação da plataforma CIVENI em produção

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-2.1-blue.svg)
![Last Update](https://img.shields.io/badge/updated-2025--12--01-orange.svg)

</div>

---

## 📋 Índice Rápido

| Seção | Descrição | Tempo Estimado |
|-------|-----------|----------------|
| [🎼 Pipeline CI/CD](#-pipeline-cicd) | Entenda o fluxo automatizado | 5 min |
| [✅ Pré-Deploy](#-checklist-pré-deploy) | Checklist completo | 10 min |
| [🏗️ Deploy Manual](#-deploy-manual-cpanel) | Upload direto para cPanel | 15 min |
| [🤖 Deploy Automático](#-deploy-automático-ftp) | Configuração via GitHub Actions | 20 min |
| [🔍 Validação](#-verificação-pós-deploy) | Testes pós-implantação | 15 min |
| [🔄 Rollback](#-procedimentos-de-rollback) | Reverter em caso de falha | 10 min |
| [🐛 Troubleshooting](#-solução-de-problemas) | Resolver problemas comuns | - |

---

## 🎼 Pipeline CI/CD

### Arquitetura do Pipeline (7 Stages)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CIVENI Sequential Pipeline                       │
│                     GitHub Actions Workflow                         │
└─────────────────────────────────────────────────────────────────────┘

  Trigger: Push/PR → main, develop
           │
           ▼
  ┌───────────────────┐
  │ 📝 STAGE 1/7      │  Code Quality
  │ Lint + TypeScript │  ✓ ESLint validation
  └─────────┬─────────┘  ✓ TypeScript check
            │
            ▼
  ┌───────────────────┐
  │ 🔒 STAGE 2/7      │  Security Scan
  │ npm audit         │  ✓ Dependency vulnerabilities
  └─────────┬─────────┘  ✓ OWASP check
            │
            ▼
  ┌───────────────────┐
  │ 🏗️ STAGE 3/7      │  Build Frontend
  │ Vite Production   │  ✓ Optimized bundle
  └─────────┬─────────┘  ✓ dist/ artifact upload
            │
            ▼
  ┌───────────────────┐
  │ 🔧 STAGE 4/7      │  Validate Supabase Functions
  │ Deno Check        │  ✓ TypeScript validation
  └─────────┬─────────┘  ✓ All Edge Functions
            │
            ▼
  ┌───────────────────┐
  │ 📦 STAGE 5/7      │  Create cPanel Package
  │ ZIP Generation    │  ✓ civeni-cpanel.zip
  └─────────┬─────────┘  ✓ SHA256 checksum
            │
            ▼
  ┌───────────────────┐
  │ 🚀 STAGE 6/7      │  Deploy Edge Functions
  │ Supabase CLI      │  ✓ Auto-deploy to Supabase
  └─────────┬─────────┘  ✓ Production environment
            │
            ▼
  ┌───────────────────┐
  │ 🌐 STAGE 7/7      │  Deploy to Environment
  │ FTP Deployment    │  ✓ Auto-deploy to cPanel
  └───────────────────┘  ✓ Production/Staging sync
```

### 📊 Status dos Stages

| Stage | Nome | Automação | Status |
|:-----:|------|:---------:|:------:|
| 1️⃣ | Code Quality | ✅ Full | 🟢 Ativo |
| 2️⃣ | Security Scan | ✅ Full | 🟢 Ativo |
| 3️⃣ | Build Frontend | ✅ Full | 🟢 Ativo |
| 4️⃣ | Validate Functions | ✅ Full | 🟢 Ativo |
| 5️⃣ | Create Package | ✅ Full | 🟢 Ativo |
| 6️⃣ | Deploy Functions | ✅ Full | 🟢 Ativo |
| 7️⃣ | Deploy Environment | ✅ Full (FTP) | 🟢 Ativo |

---

## ✅ Checklist Pré-Deploy

### 🎯 Qualidade de Código

```bash
# Execute localmente antes de fazer push
npm run lint          # ✓ Sem erros ESLint
npm run build         # ✓ Build com sucesso
npm run preview       # ✓ Testar build localmente
```

- [ ] ✅ Todos os erros de compilação TypeScript resolvidos
- [ ] ✅ ESLint não mostra erros (`npm run lint`)
- [ ] ✅ Build de produção completa sem warnings
- [ ] ✅ Testes manuais executados com sucesso
- [ ] ✅ Nenhum `console.error` ou `console.log` desnecessário no código
- [ ] ✅ Headers de segurança configurados no `.htaccess`
- [ ] ✅ Redirecionamento HTTPS habilitado

### 💾 Banco de Dados Supabase

- [ ] 🗄️ Todas as migrações aplicadas ao banco de produção
- [ ] 🔐 Políticas RLS (Row Level Security) configuradas e testadas
- [ ] 👥 Usuários admin criados com funções apropriadas
- [ ] 🧹 Dados de teste removidos do ambiente de produção
- [ ] 💾 Backup do banco de produção criado e validado
- [ ] 🔍 Índices de performance criados para queries principais

### ⚡ Edge Functions Supabase

```bash
# Deploy manual de funções (se necessário)
supabase functions deploy --project-ref wdkeqxfglmritghmakma
```

- [ ] 🚀 Todas as funções implantadas no Supabase
- [ ] 🔑 Variáveis de ambiente definidas no dashboard Supabase
- [ ] 🔗 Endpoints de webhook configurados no Stripe Dashboard
- [ ] 📋 Logs de funções revisados para erros críticos
- [ ] 🧪 Testes de Edge Functions executados com sucesso

### 🖼️ Assets e Mídia

- [ ] 🎨 Todas as imagens otimizadas (WebP quando possível)
- [ ] 🎯 Favicon e ícones PWA presentes (`public/`)
- [ ] ⚙️ Service Worker configurado e testado
- [ ] 📱 Arquivo `manifest.webmanifest` atualizado
- [ ] 📄 `robots.txt` e `sitemap.xml` configurados

### ⚙️ Configuração e Secrets

- [ ] 🔐 Variáveis `.env` documentadas (não commitadas!)
- [ ] 💳 Chaves Stripe configuradas (modo produção)
- [ ] 📧 Serviço de e-mail configurado e testado
- [ ] 🌐 Configurações CORS atualizadas para domínio de produção
- [ ] 🔑 GitHub Secrets configurados:
  - `SUPABASE_ACCESS_TOKEN` ✅
  - `FTP_SERVER` (opcional - deploy automático)
  - `FTP_USERNAME` (opcional - deploy automático)
  - `FTP_PASSWORD` (opcional - deploy automático)

---

## 🏗️ Deploy Manual (cPanel)

> 💡 **Recomendado para:** Primeira implantação, deploys críticos, ou quando preferir controle total

### 📥 Passo 1: Obter Pacote de Deploy

#### Opção A: Via GitHub Actions (Recomendado)

```
1. Acesse: https://github.com/seu-usuario/seu-repo/actions
2. Clique no workflow mais recente com ✅ sucesso
3. Role até "Artifacts" no final da página
4. Baixe: cpanel-package-[hash].zip
5. Extraia localmente para verificar conteúdo
```

#### Opção B: Build Local

```bash
# Na pasta do projeto
npm run build

# Criar pacote manualmente
cd dist
zip -r ../civeni-cpanel.zip .
cd ..
```

### 📤 Passo 2: Upload para cPanel

#### Via File Manager (Mais Fácil)

```
┌─────────────────────────────────────────────────────────┐
│  cPanel → File Manager → public_html/                   │
└─────────────────────────────────────────────────────────┘

1. 🔐 Login no cPanel
2. 📁 Abra "File Manager"
3. 📂 Navegue até "public_html/" (ou raiz do domínio)
4. 🗑️  BACKUP IMPORTANTE: Baixe conteúdo atual antes!
5. ⬆️  Upload do civeni-cpanel.zip
6. 📦 Clique direito → "Extract"
7. ✅ Verifique se .htaccess está presente
```

#### Via FTP (Alternativo)

```bash
# Usando FileZilla, WinSCP, ou cliente FTP
Host: ftp.seudominio.com
User: seu_usuario_cpanel
Pass: sua_senha_cpanel
Port: 21 (FTP) ou 22 (SFTP)

# Após conectar:
1. Navegue até /public_html/
2. Arraste arquivos de dist/ para o servidor
3. Aguarde upload completo (pode demorar)
```

### 🔍 Passo 3: Verificar Estrutura de Arquivos

```
public_html/
├── 📄 index.html                 ✅ Arquivo principal
├── ⚙️  .htaccess                 ✅ CRÍTICO - roteamento & segurança
├── 📱 manifest.webmanifest       ✅ PWA
├── ⚙️  service-worker.js         ✅ Cache offline
├── 🤖 robots.txt                 ✅ SEO
├── 🗺️  sitemap.xml               ✅ SEO
├── 📁 assets/                    ✅ CSS, JS, imagens
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── 📁 uploads/                   (criado automaticamente)
```

### 🔐 Passo 4: Configurar Permissões

```bash
# Permissões corretas
Arquivos: 644 (rw-r--r--)
Pastas:   755 (rwxr-xr-x)
.htaccess: 644
```

No cPanel File Manager:
1. Selecione todos os arquivos
2. Clique em "Permissions"
3. Configure conforme acima

---

## 🤖 Deploy Automático (FTP)

> ✅ **Status:** ATIVO - Deploy automático configurado via FTP

### 🎯 Benefícios da Automação

| Recurso | Manual | Automático |
|---------|:------:|:----------:|
| Deploy em 1 clique | ❌ | ✅ |
| Validação de checksum | ⚠️ Manual | ✅ Auto |
| Rollback fácil | 🔄 Complexo | ✅ Simples |
| Logs de deploy | ❌ | ✅ Completo |
| Notificações de erro | ❌ | ✅ Email/Slack |

### ✅ Configuração Atual (Ativo)

O deploy automático está **configurado e funcionando**. A cada push para `main` ou `develop`, o sistema:

1. ✅ Executa todos os testes e validações (Stages 1-4)
2. ✅ Cria o pacote de produção (Stage 5)
3. ✅ Faz deploy das Edge Functions no Supabase (Stage 6)
4. ✅ **Envia arquivos automaticamente para cPanel via FTP (Stage 7)**

#### 🔐 Secrets Configurados

Os seguintes secrets estão ativos no repositório GitHub:

| Secret | Descrição | Valor Exemplo | Obrigatório | Status |
|--------|-----------|---------------|:-----------:|:------:|
| `FTP_SERVER` | Servidor FTP do cPanel | `ftp.seudominio.com` ou `seudominio.com` | ✅ | ✅ |
| `FTP_USERNAME` | Usuário FTP | `deploy-bot@seudominio.com` | ✅ | ✅ |
| `FTP_PASSWORD` | Senha FTP | `sua_senha_segura` | ✅ | ✅ |
| `FTP_SERVER_DIR` | Diretório de destino (**deve terminar com /**) | `/public_html/` | ✅ | ✅ |
| `FTP_PORT` | Porta FTP (padrão: 21) | `21` ou `22` (SFTP) | ❌ | ⚠️ |
| `FTP_PROTOCOL` | Protocolo FTP (padrão: ftps) | `ftps`, `ftp`, ou `sftp` | ❌ | ⚠️ |

> ⚠️ **IMPORTANTE:**
> - O `FTP_SERVER_DIR` **deve terminar com `/`** (barra final). Exemplo: `/public_html/` ✅ (não `/public_html` ❌)
> - Se tiver erro `ECONNREFUSED`, configure `FTP_PROTOCOL` e `FTP_PORT` (veja troubleshooting abaixo)

#### 🔄 Como Funciona o Deploy Automático

```yaml
# Workflow: .github/workflows/07-deploy-environment.yml
- name: Deploy to cPanel via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    port: ${{ secrets.FTP_PORT || 21 }}              # Porta (padrão: 21)
    protocol: ${{ secrets.FTP_PROTOCOL || 'ftps' }}  # ftps, ftp, ou sftp
    server-dir: ${{ secrets.FTP_SERVER_DIR }}
    local-dir: ./cpanel-package/
    dangerous-clean-slate: false  # Não deleta tudo antes de enviar
    exclude: |                     # Ignora estes arquivos
      **/.git*
      **/node_modules/**
    log-level: standard            # Logs detalhados
    security: loose                # Aceita certificados SSL auto-assinados
    timeout: 300000                # Timeout: 5 minutos
```

### 🔧 Reconfigurar Secrets (se necessário)

Se precisar atualizar as credenciais FTP:

#### Passo 1: Atualizar Secret no GitHub

```
Repositório → Settings → Secrets and variables → Actions
Clique no secret que deseja atualizar
Clique em "Update secret"
Cole o novo valor
Salve
```

#### Passo 2: Testar Deploy

```
Faça um commit pequeno (ex: atualizar README)
Push para develop
Monitore o pipeline no GitHub Actions
Verifique se Stage 7 completa com sucesso
```

> 🔔 **Deploy Automático:** A cada push para `main` (produção) ou `develop` (staging), o site será atualizado automaticamente!

---

## 🔍 Verificação Pós-Deploy

### 🌐 Checklist do Site Público

```bash
# Teste rápido via cURL
curl -I https://seudominio.com
```

**Esperado:**
```
HTTP/2 200 OK
strict-transport-security: max-age=31536000
x-frame-options: DENY
x-content-type-options: nosniff
```

#### Testes Manuais Essenciais

- [ ] 🏠 **Página Inicial** (`/`)
  - [ ] Carrega sem erros 404/500
  - [ ] Imagens aparecem corretamente
  - [ ] Animações funcionam
  - [ ] Links de navegação funcionais

- [ ] 🗣️ **Palestrantes** (`/palestrantes`)
  - [ ] Lista completa de speakers
  - [ ] Fotos carregam do Supabase Storage
  - [ ] Modal de detalhes abre

- [ ] 📅 **Programação** (`/cronograma`)
  - [ ] Sessões aparecem organizadas
  - [ ] Datas e horários corretos
  - [ ] Filtros funcionam

- [ ] 📝 **Inscrições** (`/inscricoes`)
  - [ ] Formulário renderiza
  - [ ] Integração Stripe funciona
  - [ ] Validação de campos ativa

- [ ] 🌍 **Troca de Idioma**
  - [ ] PT → EN → ES → TR funcionam
  - [ ] Conteúdo traduz corretamente
  - [ ] Persistência em localStorage

- [ ] 📱 **Responsividade**
  - [ ] Desktop (1920x1080) ✅
  - [ ] Tablet (768x1024) ✅
  - [ ] Mobile (375x667) ✅

### 🔐 Checklist do Painel Admin

- [ ] 🔑 **Login** (`/admin`)
  - [ ] Página de login acessível
  - [ ] Credenciais admin funcionam
  - [ ] Redirecionamento pós-login correto

- [ ] 📊 **Dashboard**
  - [ ] KPIs carregam corretamente
  - [ ] Gráficos renderizam (Recharts)
  - [ ] Sem erros no console

- [ ] ✏️ **CRUD Operations**
  - [ ] Criar registros funciona
  - [ ] Editar registros funciona
  - [ ] Deletar registros funciona
  - [ ] Upload de imagens funciona

- [ ] 💰 **Financial Dashboard**
  - [ ] Revenue charts exibem
  - [ ] Dados Stripe sincronizados
  - [ ] Filtros de data funcionam

- [ ] 📤 **Exportação**
  - [ ] Export CSV funciona
  - [ ] Export PDF funciona
  - [ ] Download de relatórios

### 💳 Fluxo de Pagamento Stripe

```
Teste com Cartão de Teste Stripe:
Card: 4242 4242 4242 4242
Exp:  12/34
CVC:  123
ZIP:  12345
```

- [ ] 🛒 **Checkout Flow**
  - [ ] Stripe Checkout Session abre
  - [ ] Valores corretos exibidos
  - [ ] Pagamento processa
  - [ ] Redirecionamento pós-pagamento

- [ ] 🔔 **Webhook Processing**
  - [ ] Webhook recebe eventos (`checkout.session.completed`)
  - [ ] Registro criado no banco de dados
  - [ ] Status atualizado corretamente

- [ ] 📧 **Email Confirmation**
  - [ ] Email enviado automaticamente
  - [ ] Template correto renderizado
  - [ ] Links funcionais no email

### 🎓 Sistema de Certificados

- [ ] 📜 **Geração**
  - [ ] Certificado PDF gerado
  - [ ] Dados corretos (nome, evento, data)
  - [ ] Logo e design aparecem

- [ ] 📬 **Entrega**
  - [ ] Email com certificado anexado
  - [ ] Link de verificação incluído

- [ ] ✅ **Verificação**
  - [ ] `/certificados/verify/:code` funciona
  - [ ] Validação de autenticidade exibe

### ⚡ Testes de Performance

#### Google PageSpeed Insights

```
🔗 https://pagespeed.web.dev/

Páginas para testar:
1. Home (/)
2. Palestrantes (/palestrantes)
3. Cronograma (/cronograma)
4. Inscrições (/inscricoes)
```

**Metas de Pontuação:**

| Métrica | Target | Status |
|---------|:------:|:------:|
| Performance | > 90 | 🎯 |
| Accessibility | > 95 | 🎯 |
| Best Practices | > 95 | 🎯 |
| SEO | > 95 | 🎯 |

#### Core Web Vitals

```
Métricas Críticas:
✅ LCP (Largest Contentful Paint): < 2.5s
✅ FID (First Input Delay):        < 100ms
✅ CLS (Cumulative Layout Shift):  < 0.1
```

### 🔒 Testes de Segurança

```bash
# Verificar headers de segurança
curl -I https://seudominio.com | grep -i "security\|frame\|xss\|content-type"
```

- [ ] 🔐 **HTTPS Enforcement**
  - [ ] HTTP redireciona para HTTPS (301)
  - [ ] Certificado SSL válido
  - [ ] HSTS header presente

- [ ] 🛡️ **Security Headers** (verificar em https://securityheaders.com)
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Content-Security-Policy` configurado

- [ ] 🔍 **Proteções Ativas**
  - [ ] SQL Injection bloqueado
  - [ ] XSS bloqueado (CSP)
  - [ ] CSRF tokens validados
  - [ ] Rate limiting ativo

- [ ] 🚪 **Acesso Admin**
  - [ ] Rotas `/admin/*` requerem autenticação
  - [ ] Session timeout funciona
  - [ ] Logout limpa sessão

---

## 🔄 Procedimentos de Rollback

### ⚡ Rollback Rápido (Frontend)

> ⏱️ **Tempo estimado:** 5-10 minutos

```
┌─────────────────────────────────────────────────────┐
│  PROCEDIMENTO DE EMERGÊNCIA                         │
└─────────────────────────────────────────────────────┘

1. 🔐 Acesse cPanel → File Manager
2. 📁 Navegue para public_html/
3. 🗑️  Delete arquivos atuais (ou renomeie para backup/)
4. ⬆️  Upload da versão anterior (mantida em local seguro)
5. 📦 Extraia arquivos
6. ✅ Teste site imediatamente
```

#### Manter Backups de Deploy

```bash
# Estrutura recomendada localmente
backups/
├── 2025-12-01-build/
│   └── civeni-cpanel.zip
├── 2025-11-28-build/
│   └── civeni-cpanel.zip
└── 2025-11-25-build/
    └── civeni-cpanel.zip

# Manter últimos 5 deploys
```

### 💾 Rollback de Banco de Dados

> ⚠️ **CUIDADO:** Pode resultar em perda de dados recentes!

```bash
# Supabase Dashboard → Database → Backups
# Selecionar backup anterior e restaurar
```

**Via CLI:**

```bash
# 1. Download do backup
supabase db dump -f backup-YYYY-MM-DD.sql --project-ref wdkeqxfglmritghmakma

# 2. Restaurar (USE COM CAUTELA!)
supabase db reset --db-url <production-url> --file backup-YYYY-MM-DD.sql
```

### ⚙️ Rollback de Edge Functions

```bash
# Deploy versão anterior de uma função específica
supabase functions deploy function-name \
  --project-ref wdkeqxfglmritghmakma \
  --legacy-bundle  # Se usar versão antiga
```

> 💡 **Dica:** Mantenha histórico de commits das Edge Functions para rollback fácil

---

## 🐛 Solução de Problemas

### ❌ Erro: "connect ECONNREFUSED" (FTP Connection Refused)

**Sintoma:**
```
Error: connect ECONNREFUSED 15.235.50.240:21
code: 'ECONNREFUSED'
syscall: 'connect'
Deploy via FTP falha ao tentar conectar
```

**Causa:** O servidor FTP está recusando a conexão. Pode ser:
1. cPanel usa FTPS (FTP com SSL) em vez de FTP puro
2. Porta incorreta (cPanel pode usar porta diferente de 21)
3. Firewall bloqueando conexões do GitHub Actions
4. Servidor ou hostname incorreto

---

**Solução 1: Configurar FTPS (Mais Comum para cPanel)** ⭐

cPanel geralmente usa FTPS (FTP com SSL/TLS) por padrão:

```
GitHub → Settings → Secrets and variables → Actions

Adicionar novo secret:
Name: FTP_PROTOCOL
Value: ftps

✅ Salvar e re-run do workflow
```

---

**Solução 2: Tentar FTP Puro (Se FTPS não funcionar)**

```
GitHub → Settings → Secrets and variables → Actions

Atualizar FTP_PROTOCOL:
Name: FTP_PROTOCOL
Value: ftp

✅ Salvar e re-run do workflow
```

---

**Solução 3: Usar SFTP (SSH File Transfer)**

Se seu cPanel tem SSH habilitado:

```
GitHub → Settings → Secrets and variables → Actions

Secret 1:
Name: FTP_PROTOCOL
Value: sftp

Secret 2:
Name: FTP_PORT
Value: 22

✅ Salvar e re-run do workflow
```

---

**Solução 4: Verificar Porta Customizada**

Alguns hosts usam portas não-padrão:

```
1. Entre em contato com suporte do hosting
2. Pergunte: "Qual porta usar para FTP/FTPS?"
3. Adicione no GitHub:

Name: FTP_PORT
Value: [porta fornecida pelo host]
```

---

**Solução 5: Verificar Hostname FTP**

```
Tente diferentes formatos de FTP_SERVER:

Opção 1: ftp.seudominio.com
Opção 2: seudominio.com
Opção 3: IP direto (15.235.50.240)
Opção 4: Hostname do cPanel

Verifique em: cPanel → FTP Accounts → FTP Server
```

---

**Solução 6: Firewall/IP Whitelist**

Alguns hosts bloqueiam IPs desconhecidos:

```
1. Acesse cPanel → Security → IP Blocker
2. Verifique se IPs do GitHub Actions estão bloqueados
3. Entre em contato com hosting para whitelist GitHub Actions IPs:
   - https://api.github.com/meta (lista de IPs do GitHub)
```

---

**Solução 7: Teste de Conexão Manual**

Teste conexão FTP localmente primeiro:

```bash
# Testar FTP puro
ftp ftp.seudominio.com

# Testar FTPS com curl
curl -v ftps://ftp.seudominio.com --user usuario:senha

# Testar SFTP
sftp usuario@seudominio.com
```

Se funcionar localmente mas falhar no GitHub, é firewall/IP blocker.

---

**Configuração Recomendada para cPanel:**

```yaml
# Configuração mais comum que funciona:
FTP_SERVER: seudominio.com
FTP_PORT: 21
FTP_PROTOCOL: ftps
FTP_USERNAME: usuario@seudominio.com
FTP_PASSWORD: sua_senha
FTP_SERVER_DIR: /public_html/
```

---

### ❌ Erro: "server-dir should be a folder (must end with /)"

**Sintoma:**
```
Error: server-dir should be a folder (must end with /)
Deploy via FTP falha no Stage 7
```

**Causa:** O secret `FTP_SERVER_DIR` não termina com `/` (barra final)

**Soluções:**

**Opção 1: Workflow agora corrige automaticamente** ✅
- O workflow foi atualizado para adicionar `/` automaticamente
- Apenas re-rode o workflow que falhou: **Actions → Re-run all jobs**

**Opção 2: Atualizar o Secret (Recomendado)**
```
1. GitHub → Settings → Secrets and variables → Actions
2. Clique em FTP_SERVER_DIR
3. Clique em "Update secret"
4. Valor correto: /public_html/  (com / no final)
5. Salve
6. Re-rode o workflow
```

**Formatos Corretos:**
```
✅ /public_html/
✅ /home/usuario/public_html/
✅ /
✅ /domains/seudominio.com/public_html/

❌ /public_html
❌ /home/usuario/public_html
❌ /domains/seudominio.com/public_html
```

---

### ❌ Erro: "Rotas retornam 404 ao atualizar"

**Sintoma:**
```
Página funciona ao navegar, mas retorna 404 ao dar F5 (refresh)
Exemplo: /admin, /inscricoes retornam "Not Found"
```

**Causa:** `.htaccess` ausente ou mod_rewrite desabilitado

**Soluções:**

```apache
# 1. Verificar se .htaccess existe em public_html/

# 2. Conteúdo mínimo necessário:
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Validação:**

```bash
# Teste local
curl -I https://seudominio.com/admin
# Deve retornar 200, não 404
```

---

### ❌ Erro: "Assets falham ao carregar (CSS/JS 404)"

**Sintoma:**
```
Página carrega sem estilos
Console mostra: GET /assets/index-abc123.js 404
```

**Causa:** Caminhos incorretos ou pasta `assets/` ausente

**Soluções:**

```bash
# 1. Verificar estrutura
public_html/
├── index.html  ✅
└── assets/     ✅ Deve existir!
    ├── index-[hash].js
    └── index-[hash].css

# 2. Verificar permissões
chmod 755 assets/
chmod 644 assets/*

# 3. Limpar cache
# Browser: Ctrl+Shift+R (hard reload)
# cPanel: Nenhum cache de servidor por padrão
```

---

### ❌ Erro: "HTTPS redirect não funciona"

**Sintoma:**
```
Site acessível via HTTP, mas não redireciona para HTTPS
```

**Causa:** Regras de rewrite faltando ou SSL não configurado

**Soluções:**

```apache
# Adicionar no topo do .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

**Verificar SSL:**

```
cPanel → SSL/TLS Status
✅ Certificado válido e ativo
✅ AutoSSL habilitado (Let's Encrypt)
```

---

### ❌ Erro: "Webhook Stripe não dispara"

**Sintoma:**
```
Pagamento completa no Stripe, mas nada acontece no banco de dados
Sem registro criado, sem email enviado
```

**Causa:** URL incorreta, secret inválido, ou função com erro

**Soluções:**

```bash
# 1. Verificar URL no Stripe Dashboard
# Deve ser EXATAMENTE:
https://wdkeqxfglmritghmakma.supabase.co/functions/v1/stripe-webhook

# 2. Verificar eventos selecionados
✅ checkout.session.completed
✅ payment_intent.succeeded
✅ charge.succeeded

# 3. Verificar Webhook Secret
# Supabase Dashboard → Edge Functions → Settings
STRIPE_WEBHOOK_SECRET=whsec_...

# 4. Testar localmente com Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

**Logs:**

```
Supabase Dashboard → Edge Functions → stripe-webhook → Logs
Verificar erros em tempo real
```

---

### ❌ Erro: "Imagens não carregam do Supabase Storage"

**Sintoma:**
```
Imagens aparecem como "broken image" icon
Console: CORS error ou 403 Forbidden
```

**Causa:** Políticas RLS ou configuração CORS

**Soluções:**

```sql
-- 1. Verificar política de leitura pública
-- SQL Editor no Supabase:

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-civeni');

-- 2. Verificar se bucket é público
-- Storage → site-civeni → Settings → Public bucket: ON
```

**CORS:**

```
Supabase Dashboard → Storage → Configuration → CORS
Allowed Origins: *
(ou seu domínio específico)
```

---

### ❌ Erro: "Login admin falha"

**Sintoma:**
```
Credenciais corretas, mas retorna erro de autenticação
Console: "Unauthorized" ou "Session expired"
```

**Causa:** RLS policy, função RPC ausente, ou sessão inválida

**Soluções:**

```sql
-- 1. Verificar se usuário existe
SELECT * FROM admin_users WHERE email = 'seu@email.com';

-- 2. Verificar função RPC
SELECT * FROM pg_proc WHERE proname = 'check_user_role_secure';

-- 3. Resetar senha (se necessário)
UPDATE admin_users
SET password_hash = crypt('nova_senha', gen_salt('bf'))
WHERE email = 'seu@email.com';
```

**Frontend:**

```javascript
// Limpar localStorage
localStorage.removeItem('adminSession');
// Tentar login novamente
```

---

### 🐌 Performance: Carregamento Lento

**Sintomas:**
- Página demora > 3s para carregar
- Baixo score no PageSpeed Insights

**Soluções:**

#### 1. Compressão (`.htaccess`)

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml
  AddOutputFilterByType DEFLATE text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>
```

#### 2. Cache (`.htaccess`)

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

#### 3. Otimização de Imagens

```bash
# Converter para WebP (menor tamanho)
# Usar ferramentas como Squoosh.app ou ImageOptim
```

#### 4. Análise de Bundle

```bash
# Verificar tamanho do bundle
npm run build -- --analyze

# Considerar lazy loading de componentes pesados
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

---

### 🐌 Performance: Queries de Banco Lentas

**Sintoma:**
```
Dashboard demora > 5s para carregar dados
Timeout em queries complexas
```

**Soluções:**

```sql
-- 1. Adicionar índices
CREATE INDEX idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_registrations_status ON event_registrations(status);
CREATE INDEX idx_registrations_created ON event_registrations(created_at);

-- 2. Usar views materializadas
CREATE MATERIALIZED VIEW registrations_summary AS
SELECT
  event_id,
  COUNT(*) as total_registrations,
  SUM(amount_paid) as total_revenue
FROM event_registrations
GROUP BY event_id;

-- 3. Refresh periódico
REFRESH MATERIALIZED VIEW registrations_summary;
```

---

## 📊 Monitoramento e Manutenção

### 🔍 Ferramentas de Monitoramento

```
┌──────────────────────────────────────────────────────┐
│  MONITORAMENTO CONTÍNUO                              │
└──────────────────────────────────────────────────────┘

📊 Google Analytics
   └─ Tráfego, conversões, comportamento

📈 Supabase Dashboard
   ├─ Edge Function logs
   ├─ Database metrics
   └─ Storage usage

🐛 Browser DevTools
   ├─ Network tab (tempos de carregamento)
   ├─ Console (erros JavaScript)
   └─ Application (Service Worker)

🔔 Uptime Monitoring
   └─ UptimeRobot, Pingdom, ou similar
```

### 📅 Checklist de Manutenção Mensal

- [ ] 🔄 Atualizar dependências (`npm update`)
- [ ] 🔐 Verificar vulnerabilidades (`npm audit`)
- [ ] 💾 Backup manual do banco de dados
- [ ] 📊 Revisar logs de erros (Supabase + cPanel)
- [ ] 🚀 Verificar performance (PageSpeed)
- [ ] 🔍 Validar SSL (renovação automática)
- [ ] 📈 Analisar métricas de uso
- [ ] 🧹 Limpar dados antigos (se aplicável)

---

## 🎯 Estratégia de Backup

### 💾 Backup Automatizado

```
┌─────────────────────────────────────────────┐
│  POLÍTICA DE BACKUP                         │
└─────────────────────────────────────────────┘

DIÁRIO (Automático)
├─ Supabase: Backup automático do banco
└─ Retenção: 7 dias (plano gratuito)

SEMANAL (Manual recomendado)
├─ Download backup do banco via CLI
├─ Backup de Storage crítico
└─ Retenção: 4 semanas

MENSAL (Deploy releases)
├─ Snapshot completo do sistema
├─ Documentação de configuração
└─ Retenção: 6 meses
```

### 📥 Backup Manual

```bash
# Banco de Dados
supabase db dump -f backup-$(date +%Y%m%d).sql \
  --project-ref wdkeqxfglmritghmakma

# Storage (via Supabase Dashboard)
# Storage → site-civeni → Download bucket

# Arquivos Frontend (antes de deploy)
cd public_html
tar -czf ../backup-frontend-$(date +%Y%m%d).tar.gz .
```

---

## 📚 Recursos Adicionais

### 🔗 Links Úteis

| Recurso | URL |
|---------|-----|
| 🗄️ Supabase Dashboard | https://supabase.com/dashboard/project/wdkeqxfglmritghmakma |
| 📚 Supabase Docs | https://supabase.com/docs |
| 💳 Stripe Dashboard | https://dashboard.stripe.com |
| 📖 cPanel Docs | https://docs.cpanel.net |
| 🎨 Shadcn/ui | https://ui.shadcn.com |

### 📞 Suporte

```
🐛 Issues: GitHub Issues
📧 Email: suporte@civeni.com
📖 Documentação: ./docs/
```

---

## ✅ Checklist Final de Deploy

```
┌──────────────────────────────────────────────────────┐
│  VALIDAÇÃO PRÉ-PRODUÇÃO                              │
└──────────────────────────────────────────────────────┘
```

### 🏗️ Build e Pacote

- [ ] ✅ Build de produção completo sem erros
- [ ] ✅ Pacote ZIP criado com sucesso
- [ ] ✅ Checksum SHA256 gerado
- [ ] ✅ Tamanho do pacote razoável (< 50MB)

### 🌐 Configuração

- [ ] ✅ Domínio configurado no Supabase
- [ ] ✅ SSL ativo e válido
- [ ] ✅ `.htaccess` presente e configurado
- [ ] ✅ Variáveis de ambiente corretas

### 🧪 Funcionalidades

- [ ] ✅ Todas as rotas acessíveis
- [ ] ✅ Login admin funcional
- [ ] ✅ CRUD operations funcionam
- [ ] ✅ Stripe checkout completa
- [ ] ✅ Certificados geram corretamente

### 🚀 Performance

- [ ] ✅ PageSpeed Score > 90
- [ ] ✅ Core Web Vitals no verde
- [ ] ✅ Sem erros no console
- [ ] ✅ Service Worker registrado

### 🔒 Segurança

- [ ] ✅ HTTPS forçado
- [ ] ✅ Headers de segurança presentes
- [ ] ✅ Proteções XSS/CSRF ativas
- [ ] ✅ Admin routes protegidas

---

<div align="center">

## 🎉 Deploy Completo!

**Última Atualização:** 2025-12-01
**Versão:** 2.1
**Pipeline:** 7 Stages Sequenciais

---

💡 **Dica:** Mantenha este documento atualizado após cada mudança significativa no processo de deploy.

</div>
