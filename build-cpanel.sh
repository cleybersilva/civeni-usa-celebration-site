#!/bin/bash

# Build Script para Deploy no cPanel - CIVENI SaaS
# =================================================
# CORREÇÃO: Script otimizado para evitar erros de ZIP no cPanel

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

# Criar arquivo ZIP compatível com cPanel
if command -v zip &> /dev/null; then
    echo "📦 Criando arquivo ZIP compatível com cPanel..."
    cd dist
    
    # Criar ZIP com parâmetros compatíveis com cPanel
    # -r: recursivo, -9: máxima compressão, -X: sem atributos extras
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
    
    echo ""
    echo "📋 Instruções de upload para cPanel:"
    echo "   1. Acesse o File Manager no cPanel"
    echo "   2. Navegue até public_html/"
    echo "   3. Faça upload do arquivo civeni-saas-cpanel.zip"
    echo "   4. Clique com o botão direito no arquivo e selecione 'Extract'"
    echo "   5. Se der erro, tente upload manual dos arquivos da pasta dist/"
else
    echo "💡 Comando zip não encontrado - upload manual necessário"
    echo "📋 Para upload manual:"
    echo "   1. Selecione todos os arquivos dentro da pasta dist/"
    echo "   2. Faça upload diretamente para public_html/ via File Manager"
    echo "   3. Mantenha a estrutura de pastas original"
fi

echo ""
echo "🚀 Deploy pronto! Boa sorte! 🍀"