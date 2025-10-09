import react from "@vitejs/plugin-react-swc";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// Plugin customizado para copiar templates e assets
const copyAssetsPlugin = () => {
  return {
    name: 'copy-assets',
    buildEnd() {
      // Copiar templates
      const templateSrcDir = path.resolve(__dirname, 'public/templates');
      const templateDestDir = path.resolve(__dirname, 'dist/templates');
      
      if (!existsSync(templateDestDir)) {
        mkdirSync(templateDestDir, { recursive: true });
      }
      
      // Mapeamento de arquivos de template
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
          console.log(`✅ Template copiado: ${src} -> ${dest}`);
        }
      });
      
      // Copiar assets (imagens)
      const assetsSrcDir = path.resolve(__dirname, 'public/assets');
      const assetsDestDir = path.resolve(__dirname, 'dist/assets');
      
      if (!existsSync(assetsDestDir)) {
        mkdirSync(assetsDestDir, { recursive: true });
      }
      
      if (existsSync(assetsSrcDir)) {
        const files = readdirSync(assetsSrcDir);
        files.forEach(file => {
          const srcPath = path.join(assetsSrcDir, file);
          const destPath = path.join(assetsDestDir, file);
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
            console.log(`✅ Asset copiado: ${file}`);
          }
        });
      }
      
      // Copiar .htaccess
      const htaccessSrc = path.resolve(__dirname, 'public/.htaccess');
      const htaccessDest = path.resolve(__dirname, 'dist/.htaccess');
      if (existsSync(htaccessSrc)) {
        copyFileSync(htaccessSrc, htaccessDest);
        console.log(`✅ .htaccess copiado`);
      }
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
    copyAssetsPlugin()
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