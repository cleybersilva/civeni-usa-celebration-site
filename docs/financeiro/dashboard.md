# 📊 Dashboard Financeiro

> Analytics em tempo real de receita e participantes

---

## 📈 KPIs Principais

### Receita Total
- Soma de todos os pagamentos confirmados
- Atualização em tempo real via Stripe

### Total de Participantes
- Inscrições com `payment_status = 'paid'`
- Filtros por categoria

### Ticket Médio
- `receita_total / total_participantes`
- Comparação por lote

### Taxa de Conversão
- `(pagamentos_completos / checkouts_iniciados) * 100`
- Funil de abandono

---

## 📉 Gráficos

### Série Temporal
- Receita por dia/semana/mês
- Comparação com períodos anteriores

### Breakdown por Categoria
- Estudante vs Profissional vs Parceiro
- Pizza ou barras

### Por Método de Pagamento
- Cartão, Boleto, PIX
- Tempo médio de confirmação

---

## 🔗 Acesso

Dashboard disponível em:
`/admin` → Financeiro → Dashboard

Permissões necessárias: `admin_root` ou `admin`

---

**Autor**: Cleyber Silva | ICMC - USP | cleyber.silva@usp.br
