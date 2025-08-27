#!/bin/bash

# Build Script para Deploy no cPanel - CIVENI SaaS
# =================================================

echo "🚀 Iniciando build para deploy no cPanel..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf dist/

# Executar build de produção
echo "⚡ Gerando build de produção..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou!"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Verificar arquivos essenciais
echo "🔍 Verificando arquivos essenciais..."

ESSENTIAL_FILES=(
    "dist/index.html"
    "dist/.htaccess"
    "dist/manifest.webmanifest"
    "dist/service-worker.js"
)

MISSING_FILES=()

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

# Copiar .htaccess se não existir no dist
if [ ! -f "dist/.htaccess" ] && [ -f ".htaccess" ]; then
    echo "📋 Copiando .htaccess para dist/"
    cp .htaccess dist/
fi

# Copiar arquivos de configuração PWA se necessário
if [ -f "public/manifest.webmanifest" ] && [ ! -f "dist/manifest.webmanifest" ]; then
    echo "📋 Copiando manifest.webmanifest"
    cp public/manifest.webmanifest dist/
fi

if [ -f "public/service-worker.js" ] && [ ! -f "dist/service-worker.js" ]; then
    echo "📋 Copiando service-worker.js"
    cp public/service-worker.js dist/
fi

# Verificar arquivos após cópia
FINAL_MISSING=()
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        FINAL_MISSING+=("$file")
    fi
done

if [ ${#FINAL_MISSING[@]} -gt 0 ]; then
    echo "⚠️ Atenção: Alguns arquivos essenciais não foram encontrados:"
    printf '%s\n' "${FINAL_MISSING[@]}"
    echo "⚠️ Verifique se isso afetará o funcionamento no cPanel"
else
    echo "✅ Todos os arquivos essenciais estão presentes"
fi

# Mostrar estatísticas do build
echo ""
echo "📊 Estatísticas do build:"
echo "📁 Pasta de destino: dist/"
echo "📄 Total de arquivos: $(find dist -type f | wc -l)"
echo "💾 Tamanho total: $(du -sh dist | cut -f1)"

# Listar arquivos principais
echo ""
echo "📋 Arquivos principais:"
ls -la dist/ | head -20

echo ""
echo "🎉 Build preparado para cPanel!"
echo ""
echo "📖 Próximos passos:"
echo "   1. Compactar a pasta dist/ em um arquivo ZIP"
echo "   2. Fazer upload para public_html/ via File Manager"
echo "   3. Extrair os arquivos"
echo "   4. Configurar permissões (arquivos: 644, pastas: 755)"
echo "   5. Testar o site em seu domínio"
echo ""
echo "📚 Consulte deploy-instructions.md para detalhes completos"

# Criar arquivo ZIP para facilitar o upload
if command -v zip &> /dev/null; then
    echo "📦 Criando arquivo ZIP para upload..."
    cd dist
    zip -r ../civeni-saas-cpanel.zip .
    cd ..
    echo "✅ Arquivo criado: civeni-saas-cpanel.zip"
    echo "💡 Upload este arquivo para o cPanel e extraia na pasta public_html/"
else
    echo "💡 Compacte manualmente a pasta dist/ para fazer upload no cPanel"
fi

echo ""
echo "🚀 Deploy pronto! Boa sorte! 🍀"