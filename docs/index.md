# 📚 Documentação Técnica CIVENI — Central de Conhecimento

> Hub centralizado para toda a documentação técnica, arquitetural e operacional da Plataforma CIVENI

---

## 🎯 Bem-vindo

Esta é a **Central de Documentação** completa da Plataforma CIVENI (Congresso Internacional da Violência na Infância). Aqui você encontrará toda a informação necessária para desenvolver, implantar, manter e expandir o sistema.

### 🗂️ Organização da Documentação

A documentação está organizada em **5 categorias principais** para facilitar a navegação e o aprendizado progressivo:

---

## 🏗️ Arquitetura

Compreenda a estrutura fundamental e decisões de design do sistema.

### 📁 [arquitetura/](arquitetura/)

- **[overview.md](arquitetura/overview.md)** — Visão geral da arquitetura do sistema
  - Diagrama de componentes
  - Hierarquia de providers
  - Fluxo de dados
  - Padrões de design

- **[supabase.md](arquitetura/supabase.md)** — Banco de dados e Edge Functions
  - Esquema do PostgreSQL
  - Row Level Security (RLS)
  - Edge Functions (Deno)
  - Storage buckets

- **[stripe.md](arquitetura/stripe.md)** — Integração de pagamentos
  - Fluxo de checkout
  - Webhooks
  - Analytics financeiras
  - Gestão de produtos

---

## 💻 Desenvolvimento

Padrões, convenções e melhores práticas para desenvolvimento.

### 📁 [desenvolvimento/](desenvolvimento/)

- **[padroes_frontend.md](desenvolvimento/padroes_frontend.md)** — Padrões React/TypeScript
  - Estrutura de componentes
  - Custom hooks
  - Gerenciamento de estado
  - Estilização com Tailwind

- **[padroes_backend.md](desenvolvimento/padroes_backend.md)** — Padrões Supabase/RPC
  - Queries otimizadas
  - Funções RPC admin
  - Upload de imagens
  - Políticas de segurança

- **[multilingue_i18n.md](desenvolvimento/multilingue_i18n.md)** — Sistema de tradução
  - Estrutura i18next
  - Convenções de tradução
  - Campos de banco multilíngue
  - Fallback de idiomas

---

## 🎨 Design System

Paletas de cores, logos, componentes UI e identidade visual.

### 📁 [design_system/](design_system/)

- **[cores.md](design_system/cores.md)** — Paleta de cores
  - Cores primárias e secundárias
  - Variantes Tailwind
  - Uso semântico
  - Acessibilidade

- **[logos.md](design_system/logos.md)** — Logos e branding
  - Logos CIVENI e VCCU
  - Variantes e formatos
  - Diretrizes de uso
  - Assets disponíveis

- **[componentes_ui.md](design_system/componentes_ui.md)** — Biblioteca shadcn/ui
  - Componentes disponíveis
  - Customizações
  - Padrões de uso
  - Acessibilidade

---

## 🚀 Operações

Guias práticos para deploy, manutenção e monitoramento.

### 📁 [operacoes/](operacoes/)

- **[deploy.md](operacoes/deploy.md)** — Guia de deploy cPanel
  - Build de produção
  - Upload e configuração
  - Headers de segurança (.htaccess)
  - Verificação pós-deploy

- **[edge_functions.md](operacoes/edge_functions.md)** — Deploy de Edge Functions
  - Comandos Supabase CLI
  - Configuração de secrets
  - Logs e debugging
  - Versionamento

---

## 🎓 Fluxo de Eventos

Processos específicos do ecossistema acadêmico.

### 📁 [fluxo_eventos/](fluxo_eventos/)

- **[inscricoes.md](fluxo_eventos/inscricoes.md)** — Sistema de inscrições
  - Fluxo de registro
  - Categorias e lotes
  - Cupons e descontos
  - Confirmação de pagamento

- **[artigos.md](fluxo_eventos/artigos.md)** — Submissão de trabalhos
  - Upload de PDFs
  - Metadata e autoria
  - Áreas temáticas
  - Sistema de avaliação

- **[consorcios.md](fluxo_eventos/consorcios.md)** — Parcerias institucionais
  - Formulário de parceria
  - Níveis de patrocínio
  - Benefícios e visibilidade
  - Aprovação e gestão

- **[certificados.md](fluxo_eventos/certificados.md)** — Geração e verificação
  - Templates multilíngue
  - Geração automática (PDF)
  - Sistema de verificação
  - E-mail com anexo

- **[transmissao_ao_vivo.md](fluxo_eventos/transmissao_ao_vivo.md)** — YouTube Live integration
  - Configuração de streams
  - Agenda em tempo real
  - Salas virtuais (Meet/Zoom)
  - FAQ dinâmico

---

## 💰 Financeiro

Dashboards, relatórios e análises de receita.

### 📁 [financeiro/](financeiro/)

- **[dashboard.md](financeiro/dashboard.md)** — Dashboard de analytics
  - KPIs em tempo real
  - Gráficos de receita
  - Breakdown por categoria
  - Funil de conversão

- **[relatorios.md](financeiro/relatorios.md)** — Relatórios e exportação
  - Exportação CSV/Excel
  - Filtros e períodos
  - Métricas personalizadas
  - Agendamento de relatórios

---

## 🔍 Navegação Rápida

### Para Desenvolvedores
1. **Iniciando**: [Início Rápido](#) → [Padrões Frontend](desenvolvimento/padroes_frontend.md)
2. **Backend**: [Arquitetura Supabase](arquitetura/supabase.md) → [Padrões Backend](desenvolvimento/padroes_backend.md)
3. **Deploy**: [Guia de Deploy](operacoes/deploy.md) → [Edge Functions](operacoes/edge_functions.md)

### Para Designers
1. **UI/UX**: [Paleta de Cores](design_system/cores.md) → [Componentes UI](design_system/componentes_ui.md)
2. **Branding**: [Logos e Identidade](design_system/logos.md)

### Para Gestores de Projeto
1. **Visão Geral**: [Arquitetura Overview](arquitetura/overview.md)
2. **Processos**: [Fluxo de Inscrições](fluxo_eventos/inscricoes.md) → [Certificados](fluxo_eventos/certificados.md)
3. **Analytics**: [Dashboard Financeiro](financeiro/dashboard.md)

---

## 🛠️ Troubleshooting

Guias de solução de problemas e correções específicas.

### 📁 [troubleshooting/](troubleshooting/)

- **[FIX-ZIP-ERROR-CPANEL.md](troubleshooting/FIX-ZIP-ERROR-CPANEL.md)** — Correção de erros de ZIP no cPanel
- **[PRODUCTION_IMAGE_FIXES.md](troubleshooting/PRODUCTION_IMAGE_FIXES.md)** — Correções de imagens em produção
- **[SPEAKERS_IMAGES_FIX.md](troubleshooting/SPEAKERS_IMAGES_FIX.md)** — Fix específico para imagens de palestrantes
- **[ROLLBACK_COMPLETO.md](troubleshooting/ROLLBACK_COMPLETO.md)** — Procedimentos completos de rollback

---

## 📖 Documentação Adicional

### Arquivos Especiais

- **[../README.md](../README.md)** — Introdução ao projeto e início rápido
- **[../CLAUDE.md](../CLAUDE.md)** — Diretrizes para desenvolvimento assistido por IA

### Guias Complementares

- **[SECURITY.md](SECURITY.md)** — Políticas e implementações de segurança
- **[deploy-instructions.md](deploy-instructions.md)** — Instruções detalhadas de deploy
- **[STRIPE_DASHBOARD_README.md](STRIPE_DASHBOARD_README.md)** — Dashboard financeiro Stripe
- **[TRANSMISSAO_AO_VIVO_GUIA.md](TRANSMISSAO_AO_VIVO_GUIA.md)** — Guia de transmissão ao vivo

---

## 🆘 Obtendo Ajuda

### Para Dúvidas Técnicas
1. Consulte a seção relevante da documentação
2. Verifique o arquivo `CLAUDE.md` para patterns e convenções
3. Revise issues recentes no repositório
4. Entre em contato com a equipe técnica

### Para Problemas de Segurança
🚨 **IMPORTANTE**: Questões de segurança devem ser reportadas imediatamente à equipe técnica, NUNCA em issues públicas.

### Para Contribuições
1. Leia as convenções em [Padrões Frontend](desenvolvimento/padroes_frontend.md)
2. Siga o fluxo Git descrito em [Padrões Backend](desenvolvimento/padroes_backend.md)
3. Teste minuciosamente antes de submeter PR
4. Documente mudanças significativas

---

## 🔄 Atualizações da Documentação

Esta documentação é viva e evolui com o projeto.

**Última grande atualização**: 2025-11-28

**Próximas melhorias planejadas**:
- [ ] Adicionar diagramas UML de fluxo
- [ ] Expandir exemplos de código
- [ ] Criar vídeos tutoriais
- [ ] Adicionar troubleshooting guides
- [ ] Documentar casos de uso avançados

---

## 📞 Contato Técnico

**Autor da Documentação**: Cleyber Silva
**Cargo**: SER Engineer / Cientista de IA
**Instituição**: ICMC - Universidade de São Paulo (USP)
**Telefone**: 81 98484-5021
**E-mail**: cleyber.silva@usp.br

---

**Desenvolvido com excelência técnica para promover o avanço acadêmico internacional** 🎓✨
