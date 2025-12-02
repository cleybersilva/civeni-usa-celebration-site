# CI/CD Pipelines com Stages Sequenciais

Este documento descreve as pipelines de CI/CD com stages e jobs sequenciais implementadas para o projeto CIVENI.

## 🏗️ Arquitetura de Pipelines

O projeto utiliza **3 pipelines principais** com stages bem definidos e execução sequencial controlada:

1. **Main Pipeline** - CI/CD completo para branches principais
2. **Supabase Functions Pipeline** - Deploy de Edge Functions com validação
3. **Release Pipeline** - Release completa com tags

---

## 📊 Pipeline 1: Main Pipeline

**Arquivo:** `.github/workflows/pipeline-main.yml`

**Triggers:**
- Push para `main` ou `develop`
- Pull requests para `main`

### Stages e Jobs

```
Stage 1: Validation
  └─ job: stage-validate
      ├─ ESLint
      ├─ TypeScript type check
      └─ Output: lint-status, typecheck-status
          ↓
Stage 2: Build
  └─ job: stage-build [needs: stage-validate]
      ├─ npm run build (production/dev based on branch)
      ├─ Check build size
      └─ Upload artifacts
          ↓
Stage 3: Security & Quality (parallel)
  ├─ job: stage-security [needs: stage-build]
  │   └─ npm audit
  └─ job: stage-quality [needs: stage-build]
      └─ Bundle analysis
          ↓
Stage 4: Package
  └─ job: stage-package [needs: stage-security, stage-quality]
      ├─ Download build artifacts
      ├─ Create cPanel ZIP
      ├─ Generate SHA256
      └─ Upload deployment package
          ↓
Stage 5: Deploy Staging (auto)
  └─ job: stage-deploy-staging [needs: stage-package]
      ├─ Only on: develop branch
      ├─ Environment: staging
      └─ Auto-deploy to staging
          ↓
Stage 6: Deploy Production (manual approval)
  └─ job: stage-deploy-production [needs: stage-package]
      ├─ Only on: main branch
      ├─ Environment: production (requires approval)
      └─ Deploy to production
          ↓
Final: Pipeline Summary
  └─ job: pipeline-complete [needs: all stages]
      └─ Generate execution summary
```

### Dependências entre Jobs

- **Sequential:** Cada stage depende do anterior usando `needs`
- **Parallel:** Security e Quality rodam em paralelo após Build
- **Conditional:** Deploy stages rodam apenas em branches específicos

### Outputs

Os jobs produzem outputs que são usados por stages posteriores:
- `lint-status`, `typecheck-status` (Validation)
- `build-status`, `build-size` (Build)
- Artifacts são passados entre stages via `upload-artifact`/`download-artifact`

---

## 🔧 Pipeline 2: Supabase Functions Pipeline

**Arquivo:** `.github/workflows/pipeline-supabase.yml`

**Triggers:**
- Workflow manual (workflow_dispatch)
- Push em `supabase/functions/**`
- Push para `main` ou `develop`

### Stages e Jobs

```
Stage 1: Validate Functions
  └─ job: stage-validate-functions
      ├─ List functions to deploy
      ├─ Deno syntax check
      └─ Output: functions-list, functions-count
          ↓
Stage 2: Lint Functions
  └─ job: stage-lint-functions [needs: stage-validate-functions]
      └─ Deno lint all functions
          ↓
Stage 3: Deploy Staging
  └─ job: stage-deploy-staging [needs: stage-validate, stage-lint]
      ├─ Only on: develop or manual
      ├─ Environment: supabase-staging
      ├─ Link Supabase staging project
      └─ Deploy functions to staging
          ↓
Stage 4: Test Staging
  └─ job: stage-test-staging [needs: stage-deploy-staging]
      └─ Smoke tests on deployed functions
          ↓
Stage 5: Deploy Production (manual approval)
  └─ job: stage-deploy-production [needs: all previous]
      ├─ Only on: main or manual with skip_staging
      ├─ Environment: supabase-production (requires approval)
      ├─ Link Supabase production project
      └─ Deploy all functions
          ↓
Final: Pipeline Summary
  └─ job: pipeline-complete [needs: key stages]
      └─ Generate execution summary
```

### Inputs (Manual Workflow)

- `function_name` (optional): Deploy specific function or all
- `skip_staging` (boolean): Skip staging and go direct to production

### Function Deployment Strategy

1. **Validate:** Deno check syntax
2. **Lint:** Code quality
3. **Staging:** Deploy and test
4. **Production:** Manual approval required

---

## 🚀 Pipeline 3: Release Pipeline

**Arquivo:** `.github/workflows/pipeline-release.yml`

**Triggers:**
- Push de tags: `v*.*.*`, `v*.*.*-rc.*`, `v*.*.*-beta.*`

### Stages e Jobs

```
Stage 1: Validate Release
  └─ job: stage-validate-release
      ├─ Extract version from tag
      ├─ Check if pre-release
      ├─ Generate changelog
      └─ Output: version, is-prerelease, changelog
          ↓
Stage 2: Build & Test (parallel)
  ├─ job: stage-build-frontend [needs: stage-validate-release]
  │   ├─ npm ci
  │   ├─ ESLint + TypeScript check
  │   ├─ npm run build (production)
  │   └─ Upload build artifacts
  └─ job: stage-validate-functions [needs: stage-validate-release]
      └─ Validate all Supabase functions
          ↓
Stage 3: Package
  └─ job: stage-package [needs: stage-build-frontend, stage-validate-functions]
      ├─ Download frontend build
      ├─ Create versioned cPanel ZIP
      ├─ Generate SHA256
      └─ Upload deployment package (365 days retention)
          ↓
Stage 4: Deploy Functions (production only)
  └─ job: stage-deploy-functions [needs: stage-package]
      ├─ Only for stable releases (not pre-release)
      ├─ Environment: supabase-production (requires approval)
      └─ Deploy all Edge Functions
          ↓
Stage 5: Create GitHub Release
  └─ job: stage-create-release [needs: stage-package, stage-deploy-functions]
      ├─ Environment: github-release (requires approval)
      ├─ Generate release notes
      ├─ Attach deployment packages
      └─ Create GitHub Release
          ↓
Final: Release Complete
  └─ job: release-complete [needs: all stages]
      ├─ Summary table
      └─ Fail if any stage failed
```

### Tag Formats

- **Stable:** `v1.0.0`, `v2.1.3`
- **RC:** `v1.0.0-rc.1`
- **Beta:** `v1.0.0-beta.1`

### Release Process

1. Create and push tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Pipeline validates tag and extracts version
3. Builds and tests all components
4. Creates deployment packages
5. **Manual approval required** for production deploy
6. Deploys Supabase functions
7. **Manual approval required** for GitHub release
8. Creates release with changelog and artifacts

---

## 🔐 Environments e Aprovações

Configure environments no GitHub para controlar deploys:

### Settings → Environments

#### 1. `staging`
- **Protection:** None (auto-deploy)
- **URL:** https://staging.civeni.com
- **Secrets:** Same as repository

#### 2. `production`
- **Protection:** Required reviewers (1-6 pessoas)
- **URL:** https://civeni.com
- **Deployment branches:** Only `main`
- **Secrets:** Production values

#### 3. `supabase-staging`
- **Protection:** None (auto-deploy)
- **Secrets:**
  - `SUPABASE_STAGING_PROJECT_REF` (optional, falls back to main)

#### 4. `supabase-production`
- **Protection:** Required reviewers
- **Secrets:**
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ACCESS_TOKEN`

#### 5. `github-release`
- **Protection:** Required reviewers
- **Purpose:** Final approval before creating public release

### Configurar Aprovadores

1. Settings → Environments → [environment name]
2. Check "Required reviewers"
3. Add reviewers (GitHub usernames)
4. Save protection rules

---

## 🎯 Uso das Pipelines

### Desenvolvimento Normal (Feature/Fix)

```bash
# Work on feature branch
git checkout -b feature/nova-funcionalidade

# Make changes, commit
git add .
git commit -m "feat: nova funcionalidade"

# Push and create PR
git push origin feature/nova-funcionalidade
# Create PR to main
```

**O que acontece:**
- Main Pipeline roda em modo PR check
- Valida código, build, testes
- Não faz deploy

### Deploy para Staging

```bash
# Merge to develop
git checkout develop
git merge feature/nova-funcionalidade
git push origin develop
```

**O que acontece:**
1. Main Pipeline executa
2. Passa por todos os stages
3. **Auto-deploy para staging** (Stage 5)
4. Production deploy é pulado (só em main)

### Deploy para Production

```bash
# Merge develop to main
git checkout main
git merge develop
git push origin main
```

**O que acontece:**
1. Main Pipeline executa
2. Passa por todos os stages
3. Staging deploy é pulado (só em develop)
4. **Aguarda aprovação manual** para production (Stage 6)
5. Após aprovação, deploy para production

### Release Completa

```bash
# Create release tag
git tag v1.0.0
git push origin v1.0.0
```

**O que acontece:**
1. Release Pipeline executa
2. Valida tag e versão
3. Build completo
4. **Aguarda aprovação** para deploy de functions
5. Deploy de Edge Functions
6. **Aguarda aprovação** para criar release
7. Cria GitHub Release com artifacts

### Deploy Manual de Supabase Functions

```bash
# Via GitHub UI:
# Actions → Supabase Functions Pipeline → Run workflow
```

**Opções:**
- Function name: (deixe vazio para todas)
- Skip staging: false (recomendado)

**O que acontece:**
1. Valida e lint functions
2. Deploy para staging
3. Testa staging
4. **Aguarda aprovação** para production
5. Deploy para production

---

## 📊 Monitoramento de Pipelines

### Ver Status

**GitHub UI:**
- Repository → Actions
- Selecione pipeline
- Veja stages e jobs

### Job Summary

Cada stage gera um summary visível no GitHub:
- Status de cada etapa
- Métricas (build size, function count, etc.)
- Links e outputs

### Artifacts

**Localização:** Actions → Workflow run → Artifacts

**Disponíveis:**
- Build artifacts (7 dias)
- Deployment packages (30 dias para main, 365 para releases)
- Com SHA256 checksums

---

## 🔧 Troubleshooting

### Pipeline falha no Stage 1 (Validation)

**Problema:** ESLint ou TypeScript errors

**Solução:**
```bash
npm run lint
npx tsc --noEmit
# Fix errors and commit
```

### Pipeline falha no Stage 2 (Build)

**Problema:** Build errors ou missing secrets

**Solução:**
- Check build logs
- Verify secrets are configured
- Test locally: `npm run build`

### Pipeline falha no Deploy

**Problema:** Deployment errors

**Solução:**
- Check environment secrets
- Verify environment protection rules
- Check deployment logs

### Aprovação pendente por muito tempo

**Problema:** Workflow esperando aprovação

**Solução:**
- Repository → Settings → Environments
- Add reviewers se necessário
- Reviewer: Actions → [workflow] → Review deployments

---

## 🚦 Status Badges

Adicione ao README.md:

```markdown
![Main Pipeline](https://github.com/USER/REPO/actions/workflows/pipeline-main.yml/badge.svg)
![Supabase Pipeline](https://github.com/USER/REPO/actions/workflows/pipeline-supabase.yml/badge.svg)
![Release Pipeline](https://github.com/USER/REPO/actions/workflows/pipeline-release.yml/badge.svg)
```

---

## 📋 Checklist de Setup

- [ ] Configure environments (staging, production, etc.)
- [ ] Add required reviewers to production environments
- [ ] Configure all required secrets
- [ ] Test Main Pipeline with PR
- [ ] Test Staging deployment (merge to develop)
- [ ] Test Production approval flow (merge to main)
- [ ] Test Supabase Functions Pipeline (manual trigger)
- [ ] Test Release Pipeline (create tag v0.0.1-test)
- [ ] Add status badges to README
- [ ] Document deployment process for team

---

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Using Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**Última atualização:** 2025-11-30
