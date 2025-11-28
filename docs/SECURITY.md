# Guia de Segurança - CIVENI 2025

## Implementações de Segurança

Este documento descreve as medidas de segurança implementadas no sistema CIVENI 2025 para proteger contra ataques de injeção, XSS, CSRF e outras vulnerabilidades.

### 1. Sanitização e Validação de Entrada

#### Frontend
- **`securityValidator`**: Classe principal para validação e sanitização de inputs
- **DOMPurify**: Biblioteca para sanitização de HTML
- **Validação rigorosa**: Email, telefone, URLs e texto geral
- **Rate Limiting**: Proteção contra ataques de força bruta

#### Backend (Supabase)
- **Triggers de sanitização**: Aplicados em todas as entradas de dados
- **Validação de SQL**: Detecção de tentativas de injeção SQL
- **Filtros de conteúdo**: Remoção de scripts maliciosos e HTML perigoso

### 2. Headers de Segurança

```
Content-Security-Policy: Controla recursos que podem ser carregados
X-Frame-Options: Previne clickjacking
X-Content-Type-Options: Previne MIME sniffing
X-XSS-Protection: Proteção nativa contra XSS
Referrer-Policy: Controla informações de referência
```

### 3. Proteção Anti-Tampering

- **Detecção de DevTools**: Monitora uso de ferramentas de desenvolvedor
- **Proteção contra debugger**: Detecta tentativas de debugging não autorizado
- **Monitoramento DOM**: Previne injeção de elementos maliciosos
- **Proteção de funções críticas**: Bloqueia eval() e Function constructor

### 4. Componentes de Segurança

#### `SecurityProvider`
- Gerencia tokens CSRF
- Controla rate limiting
- Sanitiza dados de formulários

#### `SecureForm`
- Wrapper seguro para formulários
- Validação automática de entrada
- Proteção CSRF integrada

#### `SecurityMonitor`
- Monitora atividades suspeitas
- Detecta tentativas de manipulação
- Log de eventos de segurança

### 5. Configurações de Produção

#### Apache/Nginx (.htaccess)
```apache
# Headers de segurança
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"

# Content Security Policy
Header always set Content-Security-Policy "default-src 'self'; ..."

# Compressão e cache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/css application/javascript
</IfModule>
```

#### Robots.txt
- Bloqueia acesso a diretórios sensíveis
- Previne indexação de arquivos de configuração
- Rate limiting para crawlers

### 6. Monitoramento de Segurança

#### Logs de Segurança
- Tentativas de injeção detectadas
- Uso de ferramentas de desenvolvedor
- Requisições suspeitas
- Modificações não autorizadas

#### Alertas Automáticos
- Email para administradores
- SMS para eventos críticos
- Log centralizado de incidentes

### 7. Boas Práticas de Uso

#### Para Administradores
1. **Senhas fortes**: Mínimo 8 caracteres com maiúsculas, minúsculas e números
2. **Autenticação 2FA**: Habilitada para todas as contas admin
3. **Sessões limitadas**: Timeout automático após inatividade
4. **IPs autorizados**: Restrição de acesso por localização

#### Para Usuários
1. **Navegadores atualizados**: Use sempre a versão mais recente
2. **HTTPS obrigatório**: Conexões sempre criptografadas  
3. **Não compartilhar tokens**: Nunca compartilhe links de sessão
4. **Desconfie de phishing**: Verifique sempre o domínio oficial

### 8. Implantação Segura no cPanel

#### Checklist Pré-Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Headers de segurança aplicados
- [ ] Robots.txt atualizado
- [ ] Service Worker configurado
- [ ] CSP policies definidas

#### Configuração do Servidor
1. **SSL/TLS**: Certificado válido instalado
2. **Firewall**: Regras de acesso configuradas
3. **Backup**: Sistema de backup automático
4. **Monitoramento**: Logs de acesso habilitados

### 9. Resposta a Incidentes

#### Em caso de tentativa de ataque:
1. **Não entrar em pânico**: Mantenha a calma
2. **Documentar**: Capture evidências do incidente
3. **Isolar**: Desconecte sistemas afetados se necessário
4. **Notificar**: Informe a equipe de segurança
5. **Investigar**: Analise logs e determine a causa
6. **Remediar**: Aplique correções necessárias
7. **Monitorar**: Acompanhe por atividades contínuas

### 10. Atualizações de Segurança

#### Cronograma de Revisão
- **Diário**: Monitoramento de logs
- **Semanal**: Verificação de alertas de segurança
- **Mensal**: Atualização de dependências
- **Trimestral**: Auditoria completa de segurança

#### Contatos de Emergência
- **Suporte Técnico**: suporte@civeni.com
- **Segurança**: security@civeni.com
- **Administrador**: admin@civeni.com

---

## Avisos Importantes

⚠️ **NUNCA** desabilite as proteções de segurança em produção
⚠️ **SEMPRE** teste mudanças em ambiente de desenvolvimento primeiro
⚠️ **MANTENHA** logs de segurança por pelo menos 90 dias
⚠️ **NOTIFIQUE** incidentes de segurança imediatamente

Este documento deve ser revisado regularmente e atualizado conforme novas ameaças são identificadas.