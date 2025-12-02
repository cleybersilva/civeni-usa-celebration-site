# 🔐 Configuração de Deploy via SSH/SFTP

> **Solução DEFINITIVA para erro `ECONNREFUSED` no deploy FTP**

Este guia mostra como configurar deploy via SSH/SFTP, que é **mais seguro, confiável e rápido** que FTP tradicional.

---

## 🎯 Por Que Usar SSH ao Invés de FTP?

| Aspecto | FTP/FTPS | SSH/SFTP |
|---------|:--------:|:--------:|
| **Segurança** | ⚠️ Moderada | ✅ Alta |
| **Firewall** | ❌ Frequentemente bloqueado | ✅ Raramente bloqueado |
| **Velocidade** | 🐢 Lento | 🚀 Rápido (rsync) |
| **Confiabilidade** | ⚠️ Variável | ✅ Alta |
| **cPanel Support** | ✅ Sim | ✅ Sim |
| **Erro ECONNREFUSED** | ❌ Comum | ✅ Raro |

---

## 📋 Pré-requisitos

- ✅ Acesso ao cPanel
- ✅ SSH habilitado no seu hosting (verificar com suporte se necessário)
- ✅ Acesso ao GitHub repository settings

---

## 🔧 Passo a Passo Completo

### **Passo 1: Gerar Chave SSH no seu Computador**

#### No Linux/Mac:

```bash
# 1. Gerar par de chaves SSH
ssh-keygen -t ed25519 -C "deploy-civeni" -f ~/.ssh/civeni_deploy_key

# Quando perguntar por senha, deixe VAZIO (apenas pressione Enter)

# 2. Ver a chave PRIVADA (você vai copiar isso para o GitHub)
cat ~/.ssh/civeni_deploy_key

# 3. Ver a chave PÚBLICA (você vai adicionar no cPanel)
cat ~/.ssh/civeni_deploy_key.pub
```

#### No Windows (PowerShell):

```powershell
# 1. Gerar par de chaves SSH
ssh-keygen -t ed25519 -C "deploy-civeni" -f $env:USERPROFILE\.ssh\civeni_deploy_key

# Quando perguntar por senha, deixe VAZIO (apenas pressione Enter)

# 2. Ver a chave PRIVADA
type $env:USERPROFILE\.ssh\civeni_deploy_key

# 3. Ver a chave PÚBLICA
type $env:USERPROFILE\.ssh\civeni_deploy_key.pub
```

**Resultado esperado:**

```
Chave PRIVADA (civeni_deploy_key):
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz...
(várias linhas)
-----END OPENSSH PRIVATE KEY-----

Chave PÚBLICA (civeni_deploy_key.pub):
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB... deploy-civeni
```

---

### **Passo 2: Adicionar Chave Pública no cPanel**

```
1. 🔐 Login no cPanel
2. 🔍 Procure por "SSH Access" ou "Terminal"
3. 📝 Clique em "Manage SSH Keys"
4. ➕ Clique em "Import Key"
5. 📋 Cole a chave PÚBLICA no campo apropriado
   - Name: civeni-deploy
   - Public Key: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB... deploy-civeni
6. ✅ Clique em "Import"
7. ⚡ Clique em "Manage" → "Authorize" para ativar a chave
```

**Caminho alternativo se não encontrar "SSH Access":**

```
cPanel → Advanced → Terminal
Após abrir o terminal, execute:

mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3Nza... deploy-civeni" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

### **Passo 3: Adicionar Chave Privada no GitHub**

```
1. 🌐 Acesse: https://github.com/[seu-usuario]/[seu-repo]/settings/secrets/actions
2. 🔐 Clique em "New repository secret"
3. 📝 Preencha:
   - Name: SSH_PRIVATE_KEY
   - Secret: [Cole toda a chave PRIVADA, incluindo as linhas BEGIN e END]

   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz...
   (todas as linhas)
   -----END OPENSSH PRIVATE KEY-----

4. ✅ Clique em "Add secret"
```

**⚠️ IMPORTANTE:**
- ✅ Cole a chave **PRIVADA** (arquivo sem .pub)
- ✅ Inclua as linhas `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`
- ✅ Não adicione espaços extras no início ou fim
- ❌ NUNCA compartilhe ou commite a chave privada!

---

### **Passo 4: Verificar Secrets Existentes**

Certifique-se que você tem estes secrets configurados:

| Secret | Valor | Necessário para SSH? |
|--------|-------|:--------------------:|
| `SSH_PRIVATE_KEY` | -----BEGIN OPENSSH PRIVATE KEY----- ... | ✅ **SIM** |
| `FTP_SERVER` | `seudominio.com` | ✅ **SIM** |
| `FTP_USERNAME` | `usuario_cpanel` | ✅ **SIM** |
| `FTP_SERVER_DIR` | `/public_html/` | ✅ **SIM** |
| `SSH_PORT` | `22` (padrão) | ❌ Opcional |
| `FTP_PASSWORD` | `sua_senha` | ❌ Não usado no SSH |

> 💡 **Dica:** O `FTP_USERNAME` para SSH é apenas o nome de usuário do cPanel (sem @dominio.com)

---

### **Passo 5: Testar Deploy**

#### **Opção A: Re-run do Workflow Existente**

```
1. GitHub → Actions
2. Clique no último workflow que falhou
3. Clique em "Re-run all jobs"
4. ✅ Agora deve usar SSH automaticamente!
```

#### **Opção B: Novo Commit**

```bash
git commit --allow-empty -m "ci: Switch to SSH deploy"
git push origin main
```

---

## 🔍 Como Saber se Está Funcionando?

Nos logs do GitHub Actions (Stage 7), você verá:

### ✅ **Deploy via SSH (Sucesso):**

```
📁 Diretório de destino: /public_html/
🔐 Método detectado: SSH/SFTP (recomendado)
✅ SSH key configurada
🚀 Iniciando deploy via SFTP...
sending incremental file list
index.html
assets/index-abc123.js
assets/index-abc123.css
...
✅ Deploy via SFTP concluído!
```

### ❌ **Deploy via FTP (Fallback):**

```
📁 Diretório de destino: /public_html/
📡 Método detectado: FTP/FTPS
🚀 Deploying to production...
[FTP Deploy Action inicia...]
```

---

## 🐛 Troubleshooting

### ❌ Erro: "Permission denied (publickey)"

**Causa:** Chave pública não autorizada no cPanel

**Solução:**
```bash
# Via cPanel Terminal:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys  # Verificar se sua chave está lá
```

---

### ❌ Erro: "Host key verification failed"

**Causa:** Servidor não está no known_hosts

**Solução:** O workflow já resolve isso automaticamente com:
```bash
ssh-keyscan -H ${{ secrets.FTP_SERVER }} >> ~/.ssh/known_hosts
```

Se ainda falhar, adicione secret:
```
Name: SSH_STRICT_HOST_KEY_CHECKING
Value: no
```

---

### ❌ Erro: "Connection refused" na porta 22

**Causa:** SSH não habilitado no hosting

**Solução:**
1. Contate o suporte do seu hosting
2. Pergunte: "Como habilitar SSH access no meu cPanel?"
3. Alguns hosts exigem upgrade de plano para SSH

**Alternativa:** Use FTP/FTPS configurando os secrets apropriados (veja documentação principal)

---

### ❌ Erro: "rsync: command not found"

**Causa:** rsync não instalado no servidor (raro)

**Solução:** O workflow automaticamente fará fallback para SCP:
```bash
scp -r -i ~/.ssh/deploy_key ./cpanel-package/* usuario@servidor:/public_html/
```

---

## 🔄 Fallback Automático para FTP

Se você **não** configurar `SSH_PRIVATE_KEY`, o workflow automaticamente usa FTP/FTPS:

```yaml
# Detecção automática no workflow:
if [ -n "${{ secrets.SSH_PRIVATE_KEY }}" ]; then
  echo "🔐 Usando SSH/SFTP"
else
  echo "📡 Usando FTP/FTPS"
fi
```

**Secrets para FTP (se SSH não disponível):**
```
FTP_SERVER=seudominio.com
FTP_USERNAME=usuario@seudominio.com
FTP_PASSWORD=sua_senha
FTP_PROTOCOL=ftps
FTP_PORT=21
FTP_SERVER_DIR=/public_html/
```

---

## 🎯 Configuração Recomendada Final

### ✅ **Opção 1: SSH/SFTP (Melhor)** ⭐

```
Secrets necessários:
✅ SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
✅ FTP_SERVER=seudominio.com
✅ FTP_USERNAME=usuario_cpanel
✅ FTP_SERVER_DIR=/public_html/
```

### ⚠️ **Opção 2: FTP/FTPS (Fallback)**

```
Secrets necessários:
✅ FTP_SERVER=seudominio.com
✅ FTP_USERNAME=usuario@seudominio.com
✅ FTP_PASSWORD=sua_senha
✅ FTP_PROTOCOL=ftps
✅ FTP_SERVER_DIR=/public_html/
```

---

## 📊 Comparativo de Performance

| Operação | FTP | SSH/rsync |
|----------|:---:|:---------:|
| **Deploy inicial (500 arquivos)** | ~5 min | ~2 min |
| **Deploy incremental (10 arquivos alterados)** | ~5 min | ~10 seg |
| **Uso de banda** | Alto | Baixo |
| **Retomada em falha** | ❌ Recomeça | ✅ Continua |

> 💡 **rsync** só transfere arquivos que mudaram, economizando tempo e banda!

---

## 🔐 Segurança

### ✅ **Boas Práticas:**

- ✅ Use chaves SSH diferentes para cada projeto
- ✅ Nunca commite chaves privadas no Git
- ✅ Revogue chaves antigas periodicamente
- ✅ Use chaves ed25519 (mais seguras que RSA)
- ✅ Monitore logs de acesso SSH no cPanel

### ❌ **Evite:**

- ❌ Reutilizar chaves SSH entre projetos
- ❌ Compartilhar chaves privadas
- ❌ Usar senhas fracas em chaves SSH
- ❌ Deixar chaves não autorizadas no servidor

---

## 🆘 Precisa de Ajuda?

### **Verificar se SSH está habilitado:**

```bash
# Do seu computador, teste:
ssh usuario@seudominio.com

# Se pedir senha, SSH está OK!
# Se recusar conexão, SSH não está habilitado
```

### **Verificar chave pública no servidor:**

```bash
# Login via SSH:
ssh usuario@seudominio.com

# Ver chaves autorizadas:
cat ~/.ssh/authorized_keys

# Sua chave deve aparecer lá!
```

### **Contato com Suporte:**

Se SSH não estiver disponível, pergunte ao suporte do hosting:

```
Assunto: Habilitar SSH Access para Deploy Automático

Olá,

Preciso habilitar SSH access na minha conta para configurar
deploy automático via GitHub Actions.

Podem me ajudar a:
1. Habilitar SSH access
2. Confirmar a porta SSH (padrão: 22)
3. Adicionar minha chave pública SSH

Chave pública:
ssh-ed25519 AAAAC3Nza... deploy-civeni

Obrigado!
```

---

## ✅ Checklist Final

Antes de fazer deploy, confirme:

- [ ] ✅ Par de chaves SSH gerado (privada + pública)
- [ ] ✅ Chave pública adicionada e autorizada no cPanel
- [ ] ✅ Chave privada adicionada como `SSH_PRIVATE_KEY` no GitHub
- [ ] ✅ Secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_SERVER_DIR` configurados
- [ ] ✅ Testado conexão SSH manualmente (opcional)
- [ ] ✅ Workflow executado com sucesso

---

## 🎉 Pronto!

Agora seu deploy será:
- ✅ **Mais rápido** (rsync incremental)
- ✅ **Mais seguro** (SSH encryption)
- ✅ **Mais confiável** (sem erros de firewall)
- ✅ **Mais eficiente** (só transfere alterações)

**Próximo deploy será automático e instantâneo!** 🚀

---

**Documentação:** v1.0 - 2025-12-01
**Suporte:** Ver `docs/operacoes/deploy.md` para mais detalhes
