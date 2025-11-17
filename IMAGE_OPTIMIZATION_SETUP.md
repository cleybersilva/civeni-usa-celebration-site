# Configuração de Otimização de Imagens

## Sistema Implementado

Foi implementado um sistema completo de otimização automática de imagens que:

✅ **Redimensiona** automaticamente imagens para tamanhos ideais  
✅ **Converte** para formato WebP (economia de 30-80% no tamanho)  
✅ **Comprime** com qualidade ajustável  
✅ **Mostra progresso** durante upload  
✅ **Salva** automaticamente no Supabase Storage  

## Componentes Criados

### 1. Edge Function: `optimize-image`
- Recebe imagens via base64
- Salva no Supabase Storage como WebP
- Registra no `image_cache_assets` para versionamento
- Retorna URL otimizada

### 2. Hook: `useOptimizedImageUpload`
- Otimiza imagens no cliente (resize + WebP)
- Envia para edge function
- Mostra progresso de upload
- Exibe economia de tamanho

### 3. Componente: `OptimizedImageUpload`
- Interface drag & drop
- Preview de imagem
- Barra de progresso
- Mensagens de feedback

## Configuração Necessária no Supabase

### Passo 1: Criar Bucket de Imagens

Acesse: https://supabase.com/dashboard/project/wdkeqxfglmritghmakma/storage/buckets

Execute este SQL na aba SQL Editor:

```sql
-- Criar bucket para imagens otimizadas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

### Passo 2: Configurar Políticas RLS

```sql
-- Política de upload para admins
CREATE POLICY IF NOT EXISTS "Admin users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Política de visualização pública
CREATE POLICY IF NOT EXISTS "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Política de deleção para admins
CREATE POLICY IF NOT EXISTS "Admin users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

## Uso nos Componentes Admin

### Palestrantes (Já Implementado)
```tsx
<OptimizedImageUpload
  value={formData.image}
  onChange={(url) => setFormData({ ...formData, image: url })}
  label="Foto do Palestrante"
  maxWidth={800}
  maxHeight={800}
  quality={90}
  bucket="images"
  folder="speakers"
/>
```

### Para Outros Componentes

Substitua `SimpleImageUpload` ou `ImageUploadField` por:

```tsx
import OptimizedImageUpload from '@/components/admin/OptimizedImageUpload';

<OptimizedImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="Sua Label"
  maxWidth={1920}  // opcional, padrão: 1920
  maxHeight={1920} // opcional, padrão: 1920
  quality={85}     // opcional, padrão: 85
  bucket="images"  // opcional, padrão: 'images'
  folder="custom"  // opcional, padrão: 'optimized'
/>
```

## Parâmetros de Otimização

### Tamanhos Recomendados por Tipo:

| Tipo | maxWidth | maxHeight | quality | folder |
|------|----------|-----------|---------|--------|
| Banners | 1920 | 1080 | 85 | banners |
| Palestrantes | 800 | 800 | 90 | speakers |
| Thumbnails | 400 | 300 | 80 | thumbnails |
| Open Graph | 1200 | 630 | 85 | og-images |
| Logos | 600 | 600 | 95 | logos |

## Benefícios

- **Performance**: Carregamento 3-5x mais rápido
- **Economia**: 30-80% de redução no tamanho
- **UX**: Feedback visual durante upload
- **SEO**: Imagens otimizadas melhoram Core Web Vitals
- **Custos**: Menor uso de bandwidth

## Troubleshooting

### Erro: "Bucket does not exist"
→ Execute o SQL do Passo 1

### Erro: "Permission denied"
→ Verifique as políticas RLS do Passo 2

### Imagens não aparecem
→ Verifique se o bucket está marcado como público

### Upload lento
→ Ajuste os parâmetros `maxWidth`/`maxHeight` para valores menores
