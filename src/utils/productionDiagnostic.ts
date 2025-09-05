// Diagnóstico específico para problemas de produção
import { isProduction, testImageUrlForProduction } from './productionImageUtils';

interface ProductionDiagnosticResult {
  environment: 'development' | 'production';
  serviceWorkerActive: boolean;
  cacheCleared: boolean;
  speakerImagesStatus: Array<{
    name: string;
    originalUrl: string;
    workingUrl: string | null;
    loadTime: number;
    error?: string;
  }>;
}

export const runProductionDiagnostic = async (): Promise<ProductionDiagnosticResult> => {
  console.group('🔍 Diagnóstico de Produção - Imagens dos Palestrantes');
  
  const result: ProductionDiagnosticResult = {
    environment: isProduction() ? 'production' : 'development',
    serviceWorkerActive: false,
    cacheCleared: false,
    speakerImagesStatus: []
  };

  // Verificar Service Worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    result.serviceWorkerActive = !!registration?.active;
    console.log('Service Worker ativo:', result.serviceWorkerActive);
  }

  // Verificar e limpar cache
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log('Caches encontrados:', cacheNames);
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('civeni')) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          for (const request of requests) {
            if (request.url.includes('supabase.co') && request.url.includes('storage')) {
              await cache.delete(request);
              console.log('Cache removido:', request.url);
            }
          }
        }
      }
      result.cacheCleared = true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  // Testar imagens dos palestrantes (simulado - você precisa passar os dados reais)
  const testUrls = [
    'https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/site-civeni/speakers/test.jpg',
    // Adicione URLs reais aqui
  ];

  for (const url of testUrls) {
    const startTime = Date.now();
    try {
      const works = await testImageUrlForProduction(url);
      const loadTime = Date.now() - startTime;
      
      result.speakerImagesStatus.push({
        name: 'Teste',
        originalUrl: url,
        workingUrl: works ? url : null,
        loadTime,
        error: works ? undefined : 'Falha no carregamento'
      });
      
      console.log(`${works ? '✅' : '❌'} ${url} (${loadTime}ms)`);
    } catch (error) {
      result.speakerImagesStatus.push({
        name: 'Teste',
        originalUrl: url,
        workingUrl: null,
        loadTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  console.groupEnd();
  return result;
};

// Função para executar no console do navegador
declare global {
  interface Window {
    runProductionDiagnostic: () => Promise<ProductionDiagnosticResult>;
    clearAllImageCaches: () => Promise<void>;
  }
}

// Tornar disponível globalmente para debug
if (typeof window !== 'undefined') {
  window.runProductionDiagnostic = runProductionDiagnostic;
  
  window.clearAllImageCaches = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      console.log('🗑️ Todos os caches removidos');
      window.location.reload();
    }
  };
}