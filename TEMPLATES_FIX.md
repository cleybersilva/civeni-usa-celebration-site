# Correção de Templates - Documentação

## Problema Identificado
Os arquivos de template (DOC, DOCX, PPT, PPTX) não estavam abrindo corretamente após o download em produção devido a:

1. **Discrepância nos nomes dos arquivos**: Os caminhos hardcoded não correspondiam aos arquivos reais
2. **Caracteres especiais**: Nomes com espaços e acentos não eram tratados corretamente  
3. **MIME types incorretos**: Servidor não estava servindo com Content-Type correto
4. **Método de download inadequado**: Blob handling estava corrompendo arquivos Office

## Soluções Implementadas

### 1. Correção dos Nomes de Arquivos
- Atualizados os arrays `articleTemplates` e `slideTemplates` em `TemplatesArtigosSlides.tsx`
- Corrigidos os caminhos para corresponder exatamente aos arquivos existentes:
  - `template_em_Português.doc` → `template em Português.doc`
  - `Template_-_English.docx` → `Template - English.docx`
  - `MODELO_DE_SLIDES_em_Português.ppt` → `MODELO DE SLIDES em Português.ppt`
  - `TEMPLATE_FOR_SLIDES.pptx` → `TEMPLATE FOR SLIDES.pptx`

### 2. Melhorias no Método de Download
- Implementado encoding correto de URLs com `encodeURI()`
- Adicionado tratamento adequado de Content-Type
- Implementado fallback para download direto em caso de erro
- Adicionado cleanup adequado de blob URLs

### 3. Configuração do Apache (.htaccess)
Criado arquivo `.htaccess` em `public/` com:
- MIME types corretos para arquivos Office
- Headers adequados para download
- Configurações CORS
- Otimizações de cache

### 4. Configuração do Vite
- Adicionado plugin customizado para copiar templates durante build
- Configurado `assetsInclude` para arquivos Office
- Implementado mapeamento correto de nomes de arquivos

### 5. Script de Automação
Criado `copy-templates.cjs` para:
- Copiar automaticamente templates com nomes corretos
- Validar existência de arquivos
- Criar estrutura de diretórios necessária

## Comandos para Deploy

### Build Completo
\`\`\`bash
# 1. Copiar templates
node copy-templates.cjs

# 2. Build do projeto
npm run build

# 3. Verificar arquivos copiados
ls -la dist/templates/
\`\`\`

### Estrutura Final
\`\`\`
dist/
├── templates/
│   ├── template em Português.doc
│   ├── Template - English.docx
│   ├── MODELO DE SLIDES em Português.ppt
│   └── TEMPLATE FOR SLIDES.pptx
├── assets/
├── index.html
└── .htaccess
\`\`\`

## Verificação em Produção

### 1. Teste de URLs
Verificar se os arquivos são acessíveis:
- `/templates/template em Português.doc`
- `/templates/Template - English.docx`
- `/templates/MODELO DE SLIDES em Português.ppt`
- `/templates/TEMPLATE FOR SLIDES.pptx`

### 2. Teste de Headers
Verificar se retornam headers corretos:
\`\`\`
Content-Type: application/vnd.ms-word
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Type: application/vnd.ms-powerpoint
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
\`\`\`

### 3. Teste de Funcionalidade
- Download deve funcionar sem corrupção
- Arquivos devem abrir corretamente no Word/PowerPoint
- Preview online deve funcionar (quando possível)

## Manutenção

### Adicionando Novos Templates
1. Adicionar arquivo em `public/templates/`
2. Atualizar arrays em `TemplatesArtigosSlides.tsx`
3. Atualizar mapeamento em `copy-templates.cjs`
4. Executar build completo

### Alterando Nomes
1. Renomear arquivo em `public/templates/`
2. Atualizar caminho no código
3. Atualizar script de cópia
4. Testar em desenvolvimento

## Considerações Importantes

- **Caracteres especiais**: Sempre usar encoding adequado
- **MIME types**: Garantir configuração correta no servidor
- **Cache**: Arquivos Office não devem ser cacheados por muito tempo
- **Fallbacks**: Sempre ter método alternativo de download
- **Testes**: Verificar em diferentes navegadores e dispositivos

## Troubleshooting

### Arquivo não encontrado (404)
- Verificar se arquivo existe em `dist/templates/`
- Confirmar nome exato do arquivo (case-sensitive)
- Verificar configuração do servidor

### Arquivo corrompido após download
- Verificar MIME type no servidor
- Confirmar que blob é criado corretamente
- Testar download direto sem blob

### Preview não funciona
- Verificar URL absoluta
- Confirmar acesso público ao arquivo
- Testar viewers alternativos