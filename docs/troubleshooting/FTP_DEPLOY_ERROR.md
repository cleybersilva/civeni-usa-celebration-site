# 🔧 Solução: Erro FTP Deploy - ECONNREFUSED

## ❌ Erro Recebido

```
Error: connect ECONNREFUSED 15.235.50.240:21
```

**O que significa:** A conexão FTP na porta 21 foi recusada. O servidor não está respondendo ou a porta está inacessível.

---

## 🔍 Diagnóstico

### 1. Verificar Conectividade ao Servidor

```bash
# Teste porta FTP (21)
nc -zv 15.235.50.240 21

# Teste porta SFTP (22)
nc -zv 15.235.50.240 22

# Teste com curl
curl -v ftp://15.235.50.240

# Teste com ping
ping -c 3 15.235.50.240
```

### 2. Verificar Secrets no GitHub

Vá em: **Settings → Secrets and variables → Actions**

Verifique se existem:
- ✅ `FTP_SERVER` = `15.235.50.240` (ou hostname cPanel)
- ✅ `FTP_USERNAME` = seu usuário
- ✅ `FTP_PASSWORD` = sua senha
- ⚠️ `FTP_PORT` (opcional, padrão: 21)
- ⚠️ `FTP_PROTOCOL` (opcional, padrão: ftps)
- ⚠️ `FTP_SERVER_DIR` (opcional, padrão: /public_html/)

---

## 🛠️ Soluções Possíveis

### Solução 1: Porta FTP Bloqueada (Mais Provável)

**Causa:** cPanel geralmente desabilita FTP direto. Use SFTP (SSH) em vez disso.

**Ação:**
1. Contate sua hospedagem para confirmar se FTP está habilitado
2. Se não, use SFTP (porta 22) que é mais seguro

**No GitHub Settings → Secrets, adicione:**
```
SSH_PRIVATE_KEY = sua chave privada SSH (se disponível)
ou
FTP_USERNAME = mesmo usuário (rsync via SSH com senha)
FTP_PASSWORD = mesma senha
```

O workflow detectará automaticamente e usará SFTP.

---

### Solução 2: IP/Hostname Incorreto

**Verificar:**
```bash
# No cPanel, vá a:
# Account Information → Main Domain Information
# Anote o "FTP Host" (pode ser diferente de 15.235.50.240)
```

**Exemplos válidos:**
- `ftp.seudominio.com`
- `seudominio.com`
- `15.235.50.240` (IP)
- `server1234.hosting.com` (hostname real)

**Atualizar Secret:**
```bash
# GitHub Settings → Secrets
FTP_SERVER = seu_dominio_ou_ip_correto
```

---

### Solução 3: Credenciais Incorretas

**Verifique no cPanel:**
1. Login em seu cPanel
2. Vá a **FTP Accounts**
3. Confirme:
   - Nome da conta FTP
   - Senha está correta
   - Conta está ativa (status "Connected" ou ativa)

**Teste Manualmente:**
```bash
# Teste com lftp
lftp -u usuario,senha ftp://15.235.50.240

# Teste com curl
curl -u usuario:senha ftp://15.235.50.240/public_html/
```

---

### Solução 4: Firewall/Bloqueios

**Possíveis causas:**
- 🔒 Firewall da hospedagem bloqueando acesso externo
- 🔒 Firewall do GitHub Actions
- 🔒 IP GitHub Actions não autorizado

**Solução:**
1. Contacte suporte da hospedagem
2. Peça para whitelist IP range do GitHub Actions: `140.82.112.0/20`
3. Ou habilite acesso FTP de qualquer IP

---

## 🚀 Workflow Atualizado (Automático)

O arquivo `.github/workflows/07-deploy-environment.yml` foi atualizado com:

### ✅ Testes Automáticos
```yaml
- name: Test FTP/SFTP connectivity
  # Testa portas 21 (FTP) e 22 (SFTP) automaticamente
  # Seleciona o melhor método disponível
```

### ✅ Fallback Inteligente
1. Tenta SFTP (port 22) se SSH_PRIVATE_KEY estiver configurado
2. Se não, tenta SFTP com senha (sshpass)
3. Se ambos falham, tenta FTP (port 21) como último recurso
4. Relata qual porta/método funcionou

### ✅ Diagnóstico Detalhado
- Mostra qual porta está aberta/fechada
- Sugere solução específica baseada no erro

---

## 📋 Checklist de Solução

- [ ] Confirmar que `FTP_SERVER` está correto (hostname ou IP)
- [ ] Verificar credenciais em `FTP_USERNAME` e `FTP_PASSWORD`
- [ ] Testar conectividade manualmente: `nc -zv FTP_SERVER 21` e `22`
- [ ] Verificar no cPanel se conta FTP está ativa
- [ ] Se porta 21 está fechada, usar SFTP (porta 22)
- [ ] Fazer novo commit para re-executar workflow
- [ ] Monitorar GitHub Actions para logs detalhados

---

## 🔗 Referências Úteis

- [cPanel FTP Documentation](https://documentation.cpanel.net/display/ALD/FTP+Accounts)
- [GitHub Actions - FTP Deploy](https://github.com/SamKirkland/FTP-Deploy-Action)
- [SFTP vs FTP - Segurança](https://www.ssh.com/academy/ssh/sftp-vs-ftp)

---

## 💬 Próximos Passos

1. **Confirme o host FTP correto** no seu cPanel
2. **Teste manualmente** com o comando `curl` acima
3. **Atualize os secrets** no GitHub se necessário
4. **Faça um novo commit** para re-executar o workflow
5. **Monitore os logs** em GitHub Actions → Actions → Último workflow

Se o problema persistir, verifique os logs completos do GitHub Actions para mais detalhes.
