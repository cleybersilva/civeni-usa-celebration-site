import react from "@vitejs/plugin-react-swc";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// Plugin customizado para copiar templates
const copyTemplatesPlugin = () => {
  return {
    name: 'copy-templates',
    buildEnd() {
      const templateSrcDir = path.resolve(__dirname, 'public/templates');
      const templateDestDir = path.resolve(__dirname, 'dist/templates');
      
      if (!existsSync(templateDestDir)) {
        mkdirSync(templateDestDir, { recursive: true });
      }
      
      // Copiar arquivos com nomes corretos
      const fileMappings = [
        { src: 'template_em_Português.doc', dest: 'template em Português.doc' },
        { src: 'Template_-_English.docx', dest: 'Template - English.docx' },
        { src: 'MODELO_DE_SLIDES_em_Português.ppt', dest: 'MODELO DE SLIDES em Português.ppt' },
        { src: 'TEMPLATE_FOR_SLIDES.pptx', dest: 'TEMPLATE FOR SLIDES.pptx' }
      ];
      
      fileMappings.forEach(({ src, dest }) => {
        const srcPath = path.join(templateSrcDir, src);
        const destPath = path.join(templateDestDir, dest);
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath);
          console.log(`Copied template: ${src} -> ${dest}`);
        }
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    copyTemplatesPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ['**/*.doc', '**/*.docx', '**/*.ppt', '**/*.pptx'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Manter nomes originais dos arquivos de template
          if (assetInfo.name && /\.(doc|docx|ppt|pptx)$/i.test(assetInfo.name)) {
            return `templates/[name].[ext]`;
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
}));