# 🎨 Paleta de Cores

> Cores do sistema de design CIVENI baseadas em Tailwind CSS

---

## 🎯 Cores Primárias

### Primary (Azul)
- `primary`: `hsl(221.2 83.2% 53.3%)` — Azul principal
- `primary-foreground`: `hsl(210 40% 98%)` — Texto sobre azul

### Secondary (Cinza)
- `secondary`: `hsl(210 40% 96.1%)` — Cinza claro
- `secondary-foreground`: `hsl(222.2 47.4% 11.2%)` — Texto sobre cinza

---

## 📊 Cores de Status

### Success (Verde)
- `success`: `hsl(142 76% 36%)` — Verde sucesso
- Uso: Confirmações, pagamentos aprovados

### Warning (Amarelo)
- `warning`: `hsl(38 92% 50%)` — Amarelo alerta
- Uso: Avisos, pendências

### Error (Vermelho)
- `destructive`: `hsl(0 84.2% 60.2%)` — Vermelho erro
- Uso: Erros, cancelamentos

---

## 🔗 Uso no Código

```tsx
<div className="bg-primary text-primary-foreground">
  Texto em azul
</div>

<Button variant="destructive">Cancelar</Button>
```

---

**Autor**: Cleyber Silva | ICMC - USP | cleyber.silva@usp.br
