# 🌍 Sistema Multilíngue e i18n

> Implementação de internacionalização com suporte a 4 idiomas: Português, Inglês, Espanhol e Turco

---

## 📋 Idiomas Suportados

- 🇧🇷 **Português (Brasil)** — `pt` — Idioma padrão
- 🇺🇸 **Inglês (Estados Unidos)** — `en`
- 🇪🇸 **Espanhol (Espanha)** — `es`
- 🇹🇷 **Turco** — `tr`

---

## 🏗️ Estrutura i18next

### Arquivos de Tradução

Localizados em `src/i18n/locales/`:

```
src/i18n/locales/
├── index.ts          # Exporta todos os idiomas
├── pt.ts             # Português (padrão)
├── en.ts             # Inglês
├── es.ts             # Espanhol
└── tr.ts             # Turco
```

### Exemplo de Arquivo de Tradução

`src/i18n/locales/pt.ts`:

```typescript
export default {
  common: {
    welcome: "Bem-vindo",
    loading: "Carregando...",
    error: "Erro",
    success: "Sucesso"
  },
  navigation: {
    home: "Início",
    speakers: "Palestrantes",
    schedule: "Programação",
    registration: "Inscrições"
  },
  registration: {
    title: "Inscrição para o Evento",
    form: {
      name: "Nome completo",
      email: "E-mail",
      phone: "Telefone",
      submit: "Finalizar Inscrição"
    }
  }
};
```

### Uso no Código

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('registration.form.submit')}</button>

      {/* Trocar idioma */}
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
    </div>
  );
}
```

---

## 🗄️ Campos Multilíngue no Banco de Dados

### Padrão de Nomenclatura

Campos de texto têm variantes para cada idioma:

```sql
CREATE TABLE speakers (
  id uuid PRIMARY KEY,
  name text,              -- Nome (não traduzido)
  bio text,               -- Biografia em português (padrão)
  bio_en text,            -- Biografia em inglês
  bio_es text,            -- Biografia em espanhol
  bio_tr text             -- Biografia em turco
);
```

### Consulta com Idioma Específico

```typescript
function getSpeakerBio(speaker: Speaker, language: string): string {
  switch (language) {
    case 'en':
      return speaker.bio_en || speaker.bio;
    case 'es':
      return speaker.bio_es || speaker.bio;
    case 'tr':
      return speaker.bio_tr || speaker.bio;
    default:
      return speaker.bio;  // Fallback para português
  }
}
```

---

## 🔄 Fallback de Idiomas

Hierarquia de fallback: **Solicitado → Português → Inglês**

```typescript
function getTranslatedField(item: any, field: string, language: string): string {
  // 1. Tentar idioma solicitado
  const langField = `${field}_${language}`;
  if (item[langField]) {
    return item[langField];
  }

  // 2. Fallback para campo base (português)
  if (item[field]) {
    return item[field];
  }

  // 3. Fallback para inglês
  if (item[`${field}_en`]) {
    return item[`${field}_en`];
  }

  // 4. Retornar vazio se nada disponível
  return '';
}
```

---

## 🎯 Detecção Automática de Idioma

Configuração em `src/i18n/config.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)  // Detecta idioma do navegador
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: ptTranslations },
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      tr: { translation: trTranslations },
    },
    fallbackLng: 'pt',  // Fallback para português
    detection: {
      order: ['localStorage', 'navigator'],  // Ordem de detecção
      caches: ['localStorage'],  // Persistir no localStorage
    },
  });
```

---

## 📝 Convenções de Tradução

### Estrutura de Chaves

Use namespaces hierárquicos:

```typescript
{
  "pageName": {
    "section": {
      "subsection": {
        "key": "valor"
      }
    }
  }
}
```

### Pluralização

```typescript
{
  "itemsCount": "{{count}} item",
  "itemsCount_plural": "{{count}} itens"
}
```

Uso:

```typescript
t('itemsCount', { count: 1 });  // "1 item"
t('itemsCount', { count: 5 });  // "5 itens"
```

### Interpolação

```typescript
{
  "greeting": "Olá, {{name}}!"
}
```

Uso:

```typescript
t('greeting', { name: 'João' });  // "Olá, João!"
```

---

## 🎨 Componente de Seleção de Idioma

`src/components/admin/LanguageSelector.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/select';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  ];

  return (
    <Select
      value={i18n.language}
      onValueChange={(lang) => i18n.changeLanguage(lang)}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </Select>
  );
}
```

---

## 🔗 Links Relacionados

- [Padrões Frontend](padroes_frontend.md) — Componentes React
- [Arquitetura Supabase](../arquitetura/supabase.md) — Campos multilíngue no banco

---

**Autor**: Cleyber Silva
**Instituição**: ICMC - USP
**Contato**: cleyber.silva@usp.br
**Última Atualização**: 2025-11-28
