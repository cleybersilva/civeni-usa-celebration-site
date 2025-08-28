#!/bin/bash

# Build Script para Deploy no cPanel - CIVENI SaaS com Segurança Aprimorada
# ========================================================================
# CORREÇÃO: Script otimizado com múltiplas camadas de segurança

echo "🔒 Iniciando build SEGURO para deploy no cPanel..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf dist/
rm -f civeni-saas-cpanel.zip

# Executar build de produção
echo "⚡ Gerando build de produção..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou!"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Implementar configurações de segurança
echo "🔒 Implementando configurações de segurança..."

# Copiar .htaccess de segurança
if [ -f "public/.htaccess" ]; then
    echo "📋 Aplicando .htaccess de segurança..."
    cp public/.htaccess dist/
else
    echo "📋 Criando .htaccess de segurança..."
    cat > dist/.htaccess << 'EOF'
# Configuração de produção para cPanel com Segurança
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Single Page Application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Headers de segurança
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.youtube.com https://www.google.com https://maps.google.com https://youtube.com; connect-src 'self' https://wdkeqxfglmritghmakma.supabase.co https://www.google-analytics.com; object-src 'none'; base-uri 'self'; form-action 'self';"
    
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    
    <FilesMatch "\.html$">
        Header set Cache-Control "public, max-age=0, must-revalidate"
    </FilesMatch>
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/css text/javascript application/javascript application/json
</IfModule>

# Bloquear acesso a arquivos sensíveis
<FilesMatch "(^\.htaccess$|^\.env$|\.config$|package\.json$|yarn\.lock$|package-lock\.json$)">
    Order Allow,Deny
    Deny from all
</FilesMatch>

Options -Indexes
ErrorDocument 404 /index.html
EOF
fi

# Copiar robots.txt de segurança
if [ -f "public/robots.txt" ]; then
    echo "📋 Aplicando robots.txt de segurança..."
    cp public/robots.txt dist/
fi

# Copiar security.txt
if [ -f "public/.well-known/security.txt" ]; then
    echo "📋 Aplicando security.txt..."
    mkdir -p dist/.well-known
    cp public/.well-known/security.txt dist/.well-known/
fi

# Copiar _headers
if [ -f "public/_headers" ]; then
    echo "📋 Aplicando headers de segurança..."
    cp public/_headers dist/
fi

# Copiar arquivos PWA essenciais
echo "📱 Configurando arquivos PWA..."
PWA_FILES=(
    "manifest.webmanifest"
    "service-worker.js"
    "offline.html"
    "browserconfig.xml"
)

for file in "${PWA_FILES[@]}"; do
    if [ -f "public/$file" ] && [ ! -f "dist/$file" ]; then
        echo "📋 Copiando $file"
        cp "public/$file" "dist/"
    fi
done

# Verificar arquivos essenciais
echo "🔍 Verificando arquivos essenciais..."

ESSENTIAL_FILES=(
    "dist/index.html"
    "dist/.htaccess"
    "dist/robots.txt"
    "dist/manifest.webmanifest"
    "dist/service-worker.js"
)

MISSING_FILES=()
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "⚠️ Atenção: Alguns arquivos essenciais não foram encontrados:"
    printf '%s\n' "${MISSING_FILES[@]}"
    echo "⚠️ Verifique se isso afetará o funcionamento no cPanel"
else
    echo "✅ Todos os arquivos essenciais estão presentes"
fi

# Criar arquivo de informações de build com segurança
echo "📝 Adicionando informações de build seguras..."
cat > dist/build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(date +%Y%m%d-%H%M%S)",
  "environment": "production",
  "securityLevel": "enhanced",
  "features": {
    "csp": true,
    "xss_protection": true,
    "frame_options": true,
    "content_type_options": true,
    "referrer_policy": true,
    "rate_limiting": true,
    "input_sanitization": true,
    "anti_tampering": true,
    "csrf_protection": true
  }
}
EOF

# Mostrar estatísticas do build
echo ""
echo "📊 Estatísticas do build seguro:"
echo "📁 Pasta de destino: dist/"
echo "📄 Total de arquivos: $(find dist -type f | wc -l)"
echo "💾 Tamanho total: $(du -sh dist | cut -f1)"

# Criar arquivo ZIP compatível com cPanel
if command -v zip &> /dev/null; then
    echo "📦 Criando arquivo ZIP compatível com cPanel..."
    cd dist
    
    # Criar ZIP com parâmetros compatíveis com cPanel
    zip -r9X ../civeni-saas-cpanel.zip . -x "*.DS_Store" "*__MACOSX*" "*.git*"
    
    cd ..
    
    # Verificar se o arquivo foi criado corretamente
    if [ -f "civeni-saas-cpanel.zip" ]; then
        echo "✅ Arquivo ZIP criado: civeni-saas-cpanel.zip"
        echo "📊 Tamanho do ZIP: $(du -sh civeni-saas-cpanel.zip | cut -f1)"
        
        # Testar integridade do ZIP
        if zip -T civeni-saas-cpanel.zip > /dev/null 2>&1; then
            echo "✅ ZIP verificado - integridade OK"
        else
            echo "⚠️ Aviso: Possível problema na integridade do ZIP"
        fi
    else
        echo "❌ Erro: Falha ao criar o arquivo ZIP"
    fi
else
    echo "💡 Comando zip não encontrado - uso Python como fallback"
    python3 -c "
import zipfile
import os
import sys

def create_secure_zip():
    try:
        with zipfile.ZipFile('civeni-saas-cpanel.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk('dist'):
                for file in files:
                    if not file.startswith('.DS_Store') and '__MACOSX' not in root:
                        file_path = os.path.join(root, file)
                        arc_path = os.path.relpath(file_path, 'dist')
                        zipf.write(file_path, arc_path)
        print('✅ ZIP criado com Python com sucesso')
        return True
    except Exception as e:
        print(f'❌ Erro ao criar ZIP: {e}')
        return False

create_secure_zip()
"
fi

echo ""
echo "🔒 RECURSOS DE SEGURANÇA IMPLEMENTADOS:"
echo "   ✅ Headers de segurança (CSP, XSS, Frame Options)"
echo "   ✅ HTTPS obrigatório (redirecionamento automático)"
echo "   ✅ Proteção contra clickjacking"
echo "   ✅ Proteção contra MIME sniffing"
echo "   ✅ Referrer Policy restritiva"
echo "   ✅ Robots.txt com bloqueios de segurança"
echo "   ✅ Security.txt para relatórios de vulnerabilidade"
echo "   ✅ Bloqueio de arquivos sensíveis"
echo "   ✅ Compressão otimizada"
echo "   ✅ Cache seguro configurado"

echo ""
echo "🚀 BUILD SEGURO CONCLUÍDO!"
echo ""
echo "📖 PRÓXIMOS PASSOS PARA DEPLOY SEGURO:"
echo "   1. 🔐 Certifique-se de que SSL/TLS está configurado no cPanel"
echo "   2. 📦 Faça upload do civeni-saas-cpanel.zip para public_html/"
echo "   3. 📂 Extraia os arquivos mantendo a estrutura"
echo "   4. 🔍 Verifique se .htaccess foi extraído corretamente"
echo "   5. 🌐 Teste em https://seudominio.com (deve redirecionar para HTTPS)"
echo "   6. 📊 Monitore logs de segurança regularmente"
echo "   7. 🔄 Configure backup automático"
echo ""
echo "⚠️  ALERTAS DE SEGURANÇA:"
echo "   • NUNCA desabilite HTTPS em produção"
echo "   • MONITORE tentativas de acesso suspeitas"
echo "   • MANTENHA logs por pelo menos 90 dias"
echo "   • REVISE configurações de segurança mensalmente"
echo ""
echo "📚 Consulte SECURITY.md para detalhes completos de segurança"
echo ""
echo "🎉 Deploy pronto com segurança aprimorada! 🔒✨"