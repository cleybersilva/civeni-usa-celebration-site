# Guia de Deploy CIVENI SaaS para cPanel

Este guia explica como fazer o deploy completo do sistema CIVENI (site + SaaS) em um servidor cPanel.

## Pré-requisitos

### Servidor/Hospedagem
- ✅ Hospedagem com cPanel
- ✅ Suporte a Apache (.htaccess)
- ✅ PHP 8.0+ (para compatibilidade geral)
- ✅ Certificado SSL ativo
- ✅ Domínio configurado

### Configurações Supabase
- ✅ Projeto Supabase configurado
- ✅ Database com todas as tabelas
- ✅ Edge Functions deployed
- ✅ Storage configurado
- ✅ RLS policies ativas

## Passo a Passo do Deploy

### 1. Preparar o Build de Produção

```bash
# No seu ambiente local
npm run build
```

Isso criará a pasta `dist/` com todos os arquivos otimizados.

### 2. Configurar Domínio no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/wdkeqxfglmritghmakma)
2. Vá em **Settings > API**
3. Adicione seu domínio na lista de **Site URL**:
   - `https://seudominio.com`
   - `https://www.seudominio.com`

### 3. Upload dos Arquivos

#### Via File Manager do cPanel:

1. **Acesse o cPanel** do seu servidor
2. **Abra o File Manager**
3. **Navegue até a pasta public_html** (ou pasta do seu domínio)
4. **Delete todos os arquivos existentes** (se houver)
5. **Upload da pasta dist/**:
   - Selecione todos os arquivos da pasta `dist/`
   - Faça upload para `public_html/`
   - Extraia se necessário

#### Via FTP:

```bash
# Usando FTP client (FileZilla, WinSCP, etc.)
# Conecte ao servidor e upload todos os arquivos de dist/ para public_html/
```

### 4. Verificar Arquivos Essenciais

Certifique-se que estes arquivos estão na raiz do seu domínio:

```
public_html/
├── index.html
├── .htaccess
├── manifest.webmanifest
├── service-worker.js
├── browserconfig.xml
├── robots.txt
├── sitemap.xml
├── assets/ (pasta com CSS, JS, imagens)
└── lovable-uploads/ (pasta com imagens)
```

### 5. Configurar Permissões

No File Manager ou via FTP, configure as permissões:

```
- Arquivos: 644
- Pastas: 755
- .htaccess: 644
```

### 6. Testar a Aplicação

1. **Acesse seu domínio**: `https://seudominio.com`
2. **Teste as rotas principais**:
   - `/` (página inicial)
   - `/admin` (dashboard admin)
   - `/inscricoes` (inscrições)
   - `/cronograma` (cronograma)

3. **Teste as funcionalidades**:
   - ✅ Login admin
   - ✅ Cadastro de inscrições
   - ✅ Upload de imagens
   - ✅ Geração de relatórios
   - ✅ Modo PWA (instalação no mobile)

### 7. Configurações de SSL

Se o SSL não estiver funcionando:

1. **No cPanel**, vá em **SSL/TLS**
2. **Force HTTPS Redirect** (ativar)
3. **Certificate**: usar Let's Encrypt (gratuito) ou certificado próprio

### 8. Configurações de Email (Opcional)

Para funcionalidades de email (recuperação de senha, notificações):

1. **No cPanel**, configure contas de email
2. **No Supabase**, configure SMTP settings:
   - Settings > Auth > SMTP Settings

## Solução de Problemas Comuns

### ❌ Erro: "The File Manager does not support extracting this type of archive"

**Problema**: cPanel não consegue extrair o arquivo ZIP

**Soluções Alternativas**:

#### Solução 1: Script Python (Recomendado)
```bash
# Execute o script Python alternativo
python3 create-cpanel-zip.py
```

#### Solução 2: Upload Manual (Mais Confiável)
1. **Não use ZIP** - faça upload direto dos arquivos
2. Abra a pasta `dist/` no seu computador
3. Selecione **todos** os arquivos e pastas dentro de `dist/`
4. No cPanel File Manager, navegue até `public_html/`
5. Arraste e solte todos os arquivos selecionados
6. Aguarde o upload completar

#### Solução 3: Use .tar.gz (Linux/Mac)
```bash
# Na pasta do projeto, execute:
cd dist
tar -czf ../civeni-saas-cpanel.tar.gz .
cd ..
```
Depois faça upload do arquivo `.tar.gz` que é mais compatível.

#### Solução 4: FTP/SFTP
Se o File Manager continuar com problemas:
1. Use um cliente FTP como FileZilla
2. Conecte via FTP/SFTP no seu hosting
3. Navegue até `public_html/`
4. Upload todos os arquivos da pasta `dist/`

**Verificação Pós-Upload**: Confirme que estes arquivos estão em `public_html/`:
- `index.html` ✅
- `.htaccess` ✅  
- `assets/` (pasta) ✅
- `service-worker.js` ✅
- `manifest.webmanifest` ✅

### ❌ Erro 404 nas rotas internas

**Problema**: Rotas como `/admin`, `/inscricoes` retornam 404

**Solução**: 
- Verifique se o arquivo `.htaccess` está presente
- Confirme que o mod_rewrite está ativo no servidor

### ❌ Arquivos CSS/JS não carregam

**Problema**: Página aparece sem estilos

**Solução**:
- Verifique permissões da pasta `assets/`
- Confirme que não há cache antigo
- Teste em modo incógnito

### ❌ Erro de CORS/CSP

**Problema**: Funcionalidades não funcionam

**Solução**:
- Verifique URLs no Supabase (Site URL)
- Ajuste Content Security Policy no `.htaccess`
- Confirme domínio HTTPS

### ❌ Service Worker não funciona

**Problema**: PWA não funciona offline

**Solução**:
- Confirme que `service-worker.js` está na raiz
- Verifique se HTTPS está ativo
- Limpe cache do browser

### ❌ Upload de imagens falha

**Problema**: Uploads não funcionam no admin

**Solução**:
- Verifique permissões de escrita
- Confirme configuração do Supabase Storage
- Teste com imagens menores

## Manutenção e Atualizações

### Para atualizar o sistema:

1. **Baixe a nova versão**
2. **Faça backup dos arquivos atuais**
3. **Execute novo build**: `npm run build`
4. **Substitua arquivos** (mantenha `.htaccess` se não mudou)
5. **Teste todas as funcionalidades**

### Monitoramento:

- **Analytics**: Verificar acessos e performance
- **Logs**: Monitorar erros no cPanel
- **Supabase**: Dashboard de usage e performance
- **SSL**: Renovação automática ou manual

## Recursos Adicionais

- [Supabase Dashboard](https://supabase.com/dashboard/project/wdkeqxfglmritghmakma)
- [Documentação Supabase](https://supabase.com/docs)
- [Suporte cPanel](https://docs.cpanel.net/)

## Checklist Final

- [ ] Build de produção gerado
- [ ] Domínio configurado no Supabase
- [ ] Arquivos uploadados para public_html
- [ ] .htaccess configurado
- [ ] SSL ativo e funcionando
- [ ] Todas as rotas funcionando
- [ ] Funcionalidades admin testadas
- [ ] PWA instalável no mobile
- [ ] Performance otimizada

---

**Sucesso!** Seu sistema CIVENI SaaS está agora rodando em produção no cPanel.

Para suporte adicional, consulte a documentação ou entre em contato com o desenvolvedor.