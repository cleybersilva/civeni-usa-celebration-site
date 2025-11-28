# 🚨 CORREÇÃO RÁPIDA - Erro de ZIP no cPanel

## Problema: "The File Manager does not support extracting this type of archive"

### ✅ SOLUÇÃO MAIS SIMPLES (Recomendada)

**Upload Manual - Sem ZIP:**

1. Execute o build: `npm run build`
2. Abra a pasta `dist/` no seu computador
3. **Selecione TODOS os arquivos e pastas** dentro de `dist/`
4. No cPanel File Manager, vá para `public_html/`
5. **Arraste e solte** todos os arquivos
6. Aguarde upload completar

### ✅ ALTERNATIVA 1 - Script Python

1. Execute: `python3 create-cpanel-zip.py`
2. Upload do arquivo `civeni-saas-cpanel.zip` gerado
3. Extrair no cPanel

### ✅ ALTERNATIVA 2 - Bash Script Corrigido

1. Execute: `./build-cpanel.sh`
2. Upload do arquivo ZIP otimizado
3. Se ainda der erro, use upload manual

### ✅ ALTERNATIVA 3 - FTP

1. Use FileZilla ou outro cliente FTP
2. Conecte ao seu hosting
3. Upload direto para `public_html/`

## ⚠️ IMPORTANTE

**Arquivos obrigatórios em public_html/:**
- ✅ `index.html`
- ✅ `.htaccess`
- ✅ `service-worker.js`
- ✅ `manifest.webmanifest`
- ✅ Pasta `assets/`

## 🎯 DEPOIS DO UPLOAD

1. Configurar permissões: arquivos 644, pastas 755
2. Testar: `https://seudominio.com`
3. Verificar rotas: `/admin`, `/inscricoes`

---

💡 **Upload manual é 100% confiável e evita problemas de ZIP!**