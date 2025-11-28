# 🎓 Sistema de Certificados

> Geração, emissão e verificação de certificados de participação

---

## ✨ Funcionalidades

### Geração Automática
- Templates multilíngue (PT, EN, ES, TR)
- Personalização por tipo de participação
- Carga horária automática
- QR Code de verificação

### Emissão
- E-mail automático com PDF anexo
- Download direto da plataforma
- Código único de verificação

### Verificação Pública
- Portal: `/certificados/verify`
- Validação por código ou QR Code
- Exibição de dados do certificado

---

## 📋 Tipos de Certificado

### Participante
- Presença confirmada em ≥75% das sessões
- Carga horária: Variável

### Palestrante
- Apresentação de trabalho
- Carga horária: 2-4h

### Organizador/Comissão
- Participação na organização
- Carga horária: Variável

---

## 🔒 Código de Verificação

Formato: `CIVENI-2025-ABCD1234`

Estrutura:
- Prefixo: CIVENI
- Ano: 2025
- Hash: 8 caracteres alfanuméricos

---

## 🎨 Template

Templates editáveis via admin em:
`/admin` → Certificados → Configurar Template

Variáveis disponíveis:
- `{{participantName}}`
- `{{eventName}}`
- `{{eventDate}}`
- `{{hours}}`
- `{{verificationCode}}`

---

**Autor**: Cleyber Silva | ICMC - USP | cleyber.silva@usp.br
