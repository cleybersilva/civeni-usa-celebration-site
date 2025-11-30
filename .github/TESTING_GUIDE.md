# Guia de Teste das Pipelines

Este guia explica como testar cada pipeline e validar que os stages executam sequencialmente.

## 🔍 Pipeline Acionada Agora

**Commit:** `a4cbcf7`
**Trigger:** Push to main
**Pipeline:** Main Pipeline

### Verificar Execução

**URL:** https://github.com/cleybersilva/civeni-usa-celebration-site/actions

**O que você deve ver:**

1. **Main Pipeline** executando ou concluída
2. **8 jobs** listados
3. Execução **sequencial** (um após o outro)

---

## ✅ Teste 1: Main Pipeline - EXECUTANDO AGORA

### Como Verificar

1. Acesse: https://github.com/cleybersilva/civeni-usa-celebration-site/actions
2. Clique no workflow mais recente "Main Pipeline"
3. Observe a execução dos stages

### Stages Esperados

```
✅ Stage 1: Validation
   └─ Deve completar primeiro (lint + typecheck)
       ↓ (aguarda Stage 1)
✅ Stage 2: Build
   └─ Só inicia após Stage 1 completar
       ↓ (aguarda Stage 2)
✅ Stage 3: Security (paralelo)
✅ Stage 3: Quality (paralelo)
   └─ Ambos iniciam ao mesmo tempo após Stage 2
       ↓ (aguarda Stage 3)
✅ Stage 4: Package
   └─ Só inicia após Security e Quality completarem
       ↓ (aguarda Stage 4)
⏭️ Stage 5: Deploy Staging
   └─ SKIP (só executa em branch develop)
       ↓
⏭️ Stage 6: Deploy Production
   └─ SKIP (aguardando configuração de environment)
       ↓
✅ Final: Pipeline Complete
   └─ Gera summary com status de todos stages
```

### Validações

- [ ] Stage 1 completa antes de Stage 2 iniciar
- [ ] Stage 2 completa antes de Stage 3 iniciar
- [ ] Security e Quality rodam em paralelo
- [ ] Stage 4 espera ambos Stage 3 completarem
- [ ] Stages 5 e 6 são pulados (condicionais)
- [ ] Pipeline Complete gera summary table

### Artifacts Gerados

Verifique na página do workflow:
- `civeni-saas-build-{SHA}` (7 dias)
- `cpanel-deployment-{SHA}` (30 dias)

---

## 🧪 Teste 2: Supabase Functions Pipeline

### Como Executar

```bash
# Via GitHub UI:
1. Actions → Supabase Functions Pipeline
2. Run workflow
3. Branch: main
4. Function name: (deixe vazio)
5. Skip staging: false
6. Click "Run workflow"
```

### Stages Esperados

```
✅ Stage 1: Validate Functions
   └─ Deno check em 37 functions
       ↓
✅ Stage 2: Lint Functions
   └─ Deno lint
       ↓
⏸️ Stage 3: Deploy Staging
   └─ VAI FALHAR (environment não configurado)
       ↓
⏭️ Stage 4: Test Staging
   └─ SKIP (depende de Stage 3)
       ↓
⏭️ Stage 5: Deploy Production
   └─ SKIP (depende de Stage 4)
```

### Validações

- [ ] Validação lista todas as 37 functions
- [ ] Lint executa para todas
- [ ] Deploy staging falha com erro de environment
- [ ] Stages subsequentes são pulados

### Como Corrigir

Configure environment `supabase-staging`:
```
Settings → Environments → New environment
Name: supabase-staging
(sem protection rules)
```

---

## 🚀 Teste 3: Release Pipeline

### Como Executar

```bash
# Via terminal:
git tag v0.0.1-test
git push origin v0.0.1-test
```

### Stages Esperados

```
✅ Stage 1: Validate Release
   └─ Extrai versão: v0.0.1-test
   └─ Identifica como pre-release (beta/rc/test)
       ↓
✅ Stage 2: Build Frontend (paralelo)
✅ Stage 2: Validate Functions (paralelo)
   └─ Ambos executam simultaneamente
       ↓
✅ Stage 3: Package
   └─ Cria civeni-saas-cpanel-v0.0.1-test.zip
       ↓
⏭️ Stage 4: Deploy Functions
   └─ SKIP (apenas para releases stable)
       ↓
⏸️ Stage 5: Create GitHub Release
   └─ VAI FALHAR (environment não configurado)
```

### Validações

- [ ] Versão extraída corretamente da tag
- [ ] Pre-release detectado (is-prerelease: true)
- [ ] Build e validate rodam em paralelo
- [ ] Package cria arquivo versionado
- [ ] Deploy functions é pulado (pre-release)
- [ ] GitHub Release aguarda environment

### Artifacts Gerados

- `frontend-build-v0.0.1-test` (90 dias)
- `deployment-package-v0.0.1-test` (365 dias)
- ZIP com nome versionado + SHA256

---

## 📊 Checklist de Validação Completa

### Funcionalidades das Pipelines

**Execução Sequencial:**
- [ ] Jobs executam na ordem definida
- [ ] `needs` funciona corretamente
- [ ] Falha em stage anterior bloqueia próximos

**Execução Paralela:**
- [ ] Security e Quality rodam simultaneamente
- [ ] Build Frontend e Validate Functions rodam juntos

**Condicionais:**
- [ ] Stages pulam baseado em branch
- [ ] Deploy staging só em `develop`
- [ ] Deploy production só em `main`
- [ ] Pre-release vs stable funcionam

**Artifacts:**
- [ ] Upload funciona
- [ ] Download entre stages funciona
- [ ] Retenção configurada corretamente

**Summaries:**
- [ ] Cada stage gera summary
- [ ] Pipeline final gera tabela de status
- [ ] Informações úteis visíveis

**Environments:**
- [ ] Pipelines aguardam configuração
- [ ] Mensagens de erro são claras

---

## 🔧 Próximos Testes

### Depois de Configurar Environments

1. **Testar Deploy Staging:**
```bash
git checkout -b test/staging
echo "test" >> test.txt
git commit -am "test: staging deploy"
git push origin test/staging
# Criar PR para develop e merge
```

2. **Testar Aprovação Manual:**
```bash
# Após merge to main
# Actions → workflow → Review deployments
# Aprovar environment "production"
```

3. **Testar Release Completa:**
```bash
git tag v1.0.0
git push origin v1.0.0
# Aprovar deploy functions
# Aprovar GitHub release
```

---

## 📸 Screenshots Esperados

### Main Pipeline - Job Graph

Você deve ver um gráfico mostrando:
```
[Validation] → [Build] → [Security]
                          [Quality]  → [Package] → [Complete]
```

### Workflow Summary

Deve conter:
- Tabela com status de cada stage
- Métricas (build size, function count)
- Links para artifacts
- SHA256 checksums

---

## ⚠️ Problemas Conhecidos

### "Environment not found"

**Esperado!** Environments ainda não configurados.

**Solução:** Seguir `.github/ENVIRONMENTS.md`

### "Secrets not configured"

**Possível** se secrets não foram adicionados.

**Solução:** Adicionar em Settings → Secrets

### Build falha em WSL

**Conhecido** - Rollup tem issues no WSL.

**Não afeta:** GitHub Actions (usa Ubuntu puro)

---

## 📋 Resultado Esperado Agora

A **Main Pipeline** que está rodando deve:

✅ **Passar:**
- Stage 1: Validation
- Stage 2: Build
- Stage 3: Security & Quality
- Stage 4: Package

⏭️ **Pular:**
- Stage 5: Deploy Staging (não é develop)
- Stage 6: Deploy Production (environment não configurado)

✅ **Completar:**
- Pipeline Complete (com summary)

**Tempo estimado:** 3-5 minutos

**Status:** ✅ SUCCESS (com stages pulados como esperado)

---

## 🎯 Verificação Imediata

Acesse agora:

**https://github.com/cleybersilva/civeni-usa-celebration-site/actions**

Você deve ver:
1. "Main Pipeline" em execução ou concluída
2. Commit: "test: validate Main Pipeline staged execution"
3. Triggered by: push
4. Branch: main

Clique no workflow para ver os stages executando sequencialmente!
