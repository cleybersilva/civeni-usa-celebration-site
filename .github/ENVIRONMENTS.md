# Configuração de Environments

Guia rápido para configurar os environments necessários para as pipelines com stages.

## 🎯 Environments Necessários

As pipelines usam 5 environments para controlar deploys e aprovações:

1. **staging** - Deploy automático do branch develop
2. **production** - Deploy manual do branch main
3. **supabase-staging** - Deploy automático de functions para staging
4. **supabase-production** - Deploy manual de functions para production
5. **github-release** - Aprovação para criar releases públicas

---

## 📝 Configuração Passo a Passo

### 1. Acessar Settings

```
Repository → Settings → Environments
```

### 2. Criar Cada Environment

Clique em **"New environment"** para cada um dos 5 environments listados acima.

---

## 🔧 Configuração Detalhada

### Environment: `staging`

**Propósito:** Deploy automático de código do branch `develop`

#### Configuration
- **Deployment branches:** Selected branches
  - Add rule: `develop`
- **Environment secrets:** (mesmo que repository secrets)
- **Protection rules:**
  - ❌ Required reviewers: **Off** (deploy automático)
  - ❌ Wait timer: **Off**
- **Environment URL:** `https://staging.civeni.com` (opcional)

---

### Environment: `production`

**Propósito:** Deploy controlado para produção

#### Configuration
- **Deployment branches:** Selected branches
  - Add rule: `main`
- **Protection rules:**
  - ✅ **Required reviewers:** **On**
    - Add reviewers: `cleybersilva` (e outros admins)
    - Prevent self-review: ✅ **On** (recomendado)
  - ⏱️ **Wait timer:** 0 minutes (ou configure delay se desejar)
- **Environment secrets:**
  - Mesmos que repository, ou específicos de produção se diferentes
- **Environment URL:** `https://civeni.com` (opcional)

---

### Environment: `supabase-staging`

**Propósito:** Deploy automático de Edge Functions para staging

#### Configuration
- **Deployment branches:** All branches (ou `develop`)
- **Protection rules:**
  - ❌ Required reviewers: **Off**
- **Environment secrets:**
  - `SUPABASE_STAGING_PROJECT_REF` (opcional, usa main se não definido)
  - `SUPABASE_ACCESS_TOKEN` (mesmo token, aponta para projeto diferente)

---

### Environment: `supabase-production`

**Propósito:** Deploy controlado de Edge Functions para produção

#### Configuration
- **Deployment branches:** Selected branches
  - Add rule: `main`
- **Protection rules:**
  - ✅ **Required reviewers:** **On**
    - Add reviewers: `cleybersilva` (e outros que podem aprovar)
- **Environment secrets:**
  - `SUPABASE_PROJECT_REF` (ID do projeto production)
  - `SUPABASE_ACCESS_TOKEN` (Personal access token)

**Onde encontrar:**
- Project REF: Supabase Dashboard → Settings → General → Reference ID
- Access Token: https://supabase.com/dashboard/account/tokens

---

### Environment: `github-release`

**Propósito:** Aprovação final antes de criar release pública

#### Configuration
- **Deployment branches:** All branches
- **Protection rules:**
  - ✅ **Required reviewers:** **On**
    - Add reviewers: Maintainers/Admins que aprovam releases
  - ⏱️ **Wait timer:** 0 minutes
- **Environment secrets:** Nenhum necessário
- **Environment URL:** Deixe vazio

---

## 🔐 Secrets Necessários

### Repository Secrets (Global)

**Settings → Secrets and variables → Actions → Repository secrets**

```
VITE_SUPABASE_URL=https://wdkeqxfglmritghmakma.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_REF=wdkeqxfglmritghmakma
```

### Environment Secrets (Específicos)

**Settings → Environments → [environment] → Environment secrets**

#### `supabase-staging` (opcional)
```
SUPABASE_STAGING_PROJECT_REF=id-do-projeto-staging
```

#### `supabase-production` (opcional, sobrescreve repository)
```
SUPABASE_PROJECT_REF=wdkeqxfglmritghmakma
SUPABASE_ACCESS_TOKEN=sbp_...
```

#### `production` (opcional, se diferentes de dev)
```
VITE_SUPABASE_URL=https://production.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

---

## ✅ Checklist de Configuração

### Fase 1: Criar Environments
- [ ] Criar environment `staging`
- [ ] Criar environment `production`
- [ ] Criar environment `supabase-staging`
- [ ] Criar environment `supabase-production`
- [ ] Criar environment `github-release`

### Fase 2: Configurar Protection Rules
- [ ] `production` - Adicionar required reviewers
- [ ] `supabase-production` - Adicionar required reviewers
- [ ] `github-release` - Adicionar required reviewers
- [ ] Configurar deployment branches para cada environment

### Fase 3: Configurar Secrets
- [ ] Adicionar repository secrets
- [ ] (Opcional) Adicionar environment-specific secrets
- [ ] Verificar `SUPABASE_ACCESS_TOKEN` válido
- [ ] Verificar `SUPABASE_PROJECT_REF` correto

### Fase 4: Testar
- [ ] Testar deploy automático para staging (push to develop)
- [ ] Testar aprovação manual para production (push to main)
- [ ] Testar Supabase functions pipeline
- [ ] Testar release pipeline (criar tag de teste)

---

## 🧪 Como Testar Environments

### Testar Staging (Auto-deploy)

```bash
git checkout -b test/staging-deploy
echo "test" > test.txt
git add test.txt
git commit -m "test: staging deploy"
git push origin test/staging-deploy

# Criar PR para develop e merge
# Pipeline deve rodar e deploy automático para staging
```

### Testar Production (Manual approval)

```bash
git checkout main
git merge develop
git push origin main

# Pipeline vai rodar e PARAR no stage de production
# Vá para: Actions → workflow run → Review deployments
# Selecione "production" e "Approve and deploy"
```

### Testar Supabase Functions

```bash
# Via GitHub UI
Actions → Supabase Functions Pipeline → Run workflow
- Branch: main
- Function name: (deixe vazio)
- Skip staging: false
- Run workflow

# Pipeline vai rodar staging automaticamente
# Vai PARAR antes de production
# Aprovar manualmente em "Review deployments"
```

### Testar Release

```bash
git tag v0.0.1-test
git push origin v0.0.1-test

# Release Pipeline vai rodar
# Vai PARAR em duas etapas:
# 1. Antes de deploy functions → Aprovar
# 2. Antes de criar release → Aprovar
```

---

## 🚨 Troubleshooting

### "Environment not found"

**Causa:** Environment não criado ou nome incorreto

**Solução:**
- Verifique nome exato do environment
- Crie se não existir
- Verifique case-sensitive (maiúsculas/minúsculas)

### "Required reviewers not met"

**Causa:** Nenhum reviewer configurado ou reviewer é o próprio autor

**Solução:**
- Adicione reviewers no environment
- Se "Prevent self-review" está on, peça outro usuário para aprovar
- Ou desabilite "Prevent self-review" (não recomendado para production)

### "Deployment branch not allowed"

**Causa:** Branch atual não está na lista de deployment branches permitidas

**Solução:**
- Environment settings → Deployment branches
- Adicione o branch ou selecione "All branches"

### "Secret not found"

**Causa:** Secret não configurado no environment ou repository

**Solução:**
- Verifique se secret existe em Settings → Secrets
- Se usar environment-specific secret, configure no environment
- Verifique nome exato do secret (case-sensitive)

---

## 📊 Fluxo de Aprovação

### Quem pode aprovar?

1. **Required reviewers** configurados no environment
2. Usuários com permissão de **write** ou superior no repositório
3. **Não pode aprovar:** Autor do workflow (se prevent self-review está on)

### Como aprovar?

1. Actions → Selecione workflow run
2. Veja "Review deployments" badge amarelo
3. Clique em "Review deployments"
4. Selecione environments para aprovar
5. (Opcional) Adicione comentário
6. Clique "Approve and deploy"

### Como rejeitar?

1. Mesmo processo
2. Clique "Reject" ao invés de "Approve"
3. Workflow será cancelado

---

## 🎯 Boas Práticas

### Protection Rules

✅ **Sempre use required reviewers para production**
- Evita deploys acidentais
- Garante revisão antes de release
- Permite rollback se necessário

✅ **Use deployment branches**
- `production`: Apenas `main`
- `staging`: Apenas `develop`
- Evita deploys de branches errados

✅ **Separate staging and production secrets**
- Use projetos Supabase diferentes
- Evita acidentes que afetem produção
- Permite testes realistas

### Reviewers

✅ **Múltiplos reviewers**
- Configure 2+ reviewers para production
- Garante disponibilidade
- Permite férias/ausências

✅ **Self-review prevention**
- Habilite "Prevent self-review" em production
- Força code review por outra pessoa
- Melhora qualidade

### Secrets

✅ **Nunca commit secrets**
- Use GitHub Secrets
- Rotate tokens periodicamente
- Audit secret usage

✅ **Environment-specific secrets**
- Diferentes para staging/production
- Minimize impacto de leaks
- Facilita debugging

---

## 📚 Recursos

- [GitHub Environments Docs](https://docs.github.com/en/actions/deployment/targeting-different-environments)
- [Deployment Protection Rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#deployment-protection-rules)
- [Environment Secrets](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-secrets)

---

**Setup completo!** Suas pipelines agora têm controle total de deployment com aprovações manuais. 🎉
