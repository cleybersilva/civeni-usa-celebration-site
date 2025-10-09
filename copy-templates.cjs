#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configurações
const templateSrcDir = path.resolve(__dirname, 'public/templates');
const templateDestDir = path.resolve(__dirname, 'dist/templates');
const assetsSrcDir = path.resolve(__dirname, 'public/assets');
const assetsDestDir = path.resolve(__dirname, 'dist/assets');

// Mapeamento de arquivos de template
const fileMappings = [
  { src: 'template_em_Português.doc', dest: 'template em Português.doc' },
  { src: 'Template_-_English.docx', dest: 'Template - English.docx' },
  { src: 'MODELO_DE_SLIDES_em_Português.ppt', dest: 'MODELO DE SLIDES em Português.ppt' },
  { src: 'TEMPLATE_FOR_SLIDES.pptx', dest: 'TEMPLATE FOR SLIDES.pptx' }
];

// Função para copiar templates
function copyTemplates() {
  console.log('🔄 Copiando templates...');
  
  // Criar diretório de destino se não existir
  if (!fs.existsSync(templateDestDir)) {
    fs.mkdirSync(templateDestDir, { recursive: true });
    console.log('📁 Pasta dist/templates criada');
  }
  
  // Copiar cada arquivo de template
  fileMappings.forEach(({ src, dest }) => {
    const srcPath = path.join(templateSrcDir, src);
    const destPath = path.join(templateDestDir, dest);
    
    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Template copiado: ${src} -> ${dest}`);
      } catch (error) {
        console.error(`❌ Erro ao copiar template ${src}:`, error.message);
      }
    } else {
      console.warn(`⚠️  Template não encontrado: ${src}`);
    }
  });
}

// Função para copiar assets (imagens)
function copyAssets() {
  console.log('🖼️ Copiando assets...');
  
  // Criar diretório de destino se não existir
  if (!fs.existsSync(assetsDestDir)) {
    fs.mkdirSync(assetsDestDir, { recursive: true });
    console.log('📁 Pasta dist/assets criada');
  }
  
  if (fs.existsSync(assetsSrcDir)) {
    const files = fs.readdirSync(assetsSrcDir);
    files.forEach(file => {
      const srcPath = path.join(assetsSrcDir, file);
      const destPath = path.join(assetsDestDir, file);
      
      if (fs.statSync(srcPath).isFile()) {
        try {
          fs.copyFileSync(srcPath, destPath);
          console.log(`✅ Asset copiado: ${file}`);
        } catch (error) {
          console.error(`❌ Erro ao copiar asset ${file}:`, error.message);
        }
      }
    });
  } else {
    console.warn('⚠️  Pasta public/assets não encontrada');
  }
}

// Função para copiar .htaccess
function copyHtaccess() {
  const htaccessSrc = path.resolve(__dirname, 'public/.htaccess');
  const htaccessDest = path.resolve(__dirname, 'dist/.htaccess');
  
  if (fs.existsSync(htaccessSrc)) {
    try {
      fs.copyFileSync(htaccessSrc, htaccessDest);
      console.log('✅ .htaccess copiado');
    } catch (error) {
      console.error('❌ Erro ao copiar .htaccess:', error.message);
    }
  }
}

// Função principal
function copyAllAssets() {
  copyTemplates();
  copyAssets();
  copyHtaccess();
  console.log('✨ Todos os arquivos copiados com sucesso!');
}

// Executar se chamado diretamente
if (require.main === module) {
  copyAllAssets();
}

module.exports = {
  copyTemplates,
  copyAssets,
  copyHtaccess,
  copyAllAssets
};