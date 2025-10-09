#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configurações
const templateSrcDir = path.resolve(__dirname, 'public/templates');
const templateDestDir = path.resolve(__dirname, 'dist/templates');

// Mapeamento de arquivos
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
  
  // Copiar cada arquivo
  fileMappings.forEach(({ src, dest }) => {
    const srcPath = path.join(templateSrcDir, src);
    const destPath = path.join(templateDestDir, dest);
    
    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copiado: ${src} -> ${dest}`);
      } catch (error) {
        console.error(`❌ Erro ao copiar ${src}:`, error.message);
      }
    } else {
      console.warn(`⚠️  Arquivo não encontrado: ${src}`);
    }
  });
  
  console.log('✨ Templates copiados com sucesso!');
}

// Executar se chamado diretamente
if (require.main === module) {
  copyTemplates();
}

module.exports = copyTemplates;