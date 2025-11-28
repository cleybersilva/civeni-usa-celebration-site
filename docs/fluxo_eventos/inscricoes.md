# 📋 Sistema de Inscrições

> Fluxo completo de inscrição de participantes em eventos

---

## 🎯 Tipos de Inscrição

### Modalidades
- **Presencial**: Participação física no evento
- **Online**: Participação remota via streaming

### Categorias
- **Estudante**: Desconto para estudantes de graduação/pós
- **Profissional**: Inscrição padrão
- **Parceiro**: Vagas cortesia para parceiros institucionais
- **VCCU**: Estudantes e professores da VCCU

---

## 💰 Sistema de Lotes

### Early Bird (1º Lote)
- Período: 60 dias antes do evento
- Desconto: 30-40%
- Vagas limitadas

### Regular (2º Lote)
- Período: 30 dias antes
- Preço padrão

### Last Minute (3º Lote)
- Período: Até 7 dias antes
- Acréscimo de 20%

---

## 🔄 Fluxo de Inscrição

1. Usuário acessa `/inscricoes`
2. Seleciona modalidade (presencial/online)
3. Escolhe categoria e lote
4. Preenche formulário
5. Aplica cupom (opcional)
6. Redireciona para Stripe Checkout
7. Completa pagamento
8. Recebe confirmação por e-mail
9. Acessa certificado após evento

---

## 🎟️ Cupons de Desconto

Formato: `CODIGO2025`

Tipos:
- **Percentual**: 10%, 20%, 30% OFF
- **Valor fixo**: R$ 50, R$ 100 OFF
- **Cortesia**: 100% de desconto

---

**Para mais detalhes, veja**: [Integração Stripe](../arquitetura/stripe.md)

---

**Autor**: Cleyber Silva | ICMC - USP | cleyber.silva@usp.br
