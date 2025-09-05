import { supabase } from '@/integrations/supabase/client';

// Função para diagnosticar e corrigir URLs de imagens de palestrantes do Supabase
export async function diagnoseAndFixSpeakerImages() {
  console.group('🔍 Diagnosing Speaker Images from Database');
  
  try {
    // Buscar todos os palestrantes do banco
    const { data: speakers, error } = await supabase
      .from('cms_speakers')
      .select('id, name, image_url, is_active')
      .eq('is_active', true)
      .order('order_index');
    
    if (error) {
      console.error('Error fetching speakers:', error);
      return;
    }
    
    if (!speakers || speakers.length === 0) {
      console.warn('No speakers found in database');
      return;
    }
    
    console.log(`Found ${speakers.length} active speakers in database:`);
    
    for (const speaker of speakers) {
      console.group(`📍 Speaker: ${speaker.name}`);
      console.log('Original URL:', speaker.image_url);
      
      if (!speaker.image_url) {
        console.warn('❌ No image URL found');
        console.groupEnd();
        continue;
      }
      
      // Testar a URL original
      const originalWorks = await testImageLoad(speaker.image_url);
      console.log('Original URL works:', originalWorks ? '✅' : '❌');
      
      if (!originalWorks) {
        // Tentar corrigir a URL
        const fixedUrls = generateFixedUrls(speaker.image_url);
        console.log('Trying fixed URLs:', fixedUrls);
        
        let workingUrl = null;
        for (const url of fixedUrls) {
          const works = await testImageLoad(url);
          console.log(`Testing ${url}:`, works ? '✅' : '❌');
          if (works) {
            workingUrl = url;
            break;
          }
        }
        
        if (workingUrl) {
          console.log('🎉 Found working URL:', workingUrl);
          // Aqui poderíamos atualizar o banco se necessário
        } else {
          console.warn('😞 No working URL found for this speaker');
        }
      }
      
      console.groupEnd();
    }
    
  } catch (error) {
    console.error('Error in diagnosis:', error);
  }
  
  console.groupEnd();
}

function testImageLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout após 5 segundos
    setTimeout(() => resolve(false), 5000);
  });
}

function generateFixedUrls(originalUrl: string): string[] {
  const fixes: string[] = [];
  
  if (originalUrl.includes('supabase.co')) {
    // Converter signed para public
    const publicUrl = originalUrl.replace('/object/sign/', '/object/public/').split('?')[0];
    fixes.push(publicUrl);
    
    // Extrair caminho do arquivo
    const pathMatch = originalUrl.match(/\/site-civeni\/(.+?)(?:\?|$)/);
    if (pathMatch) {
      const filePath = pathMatch[1];
      const sdkUrl = supabase.storage.from('site-civeni').getPublicUrl(filePath).data.publicUrl;
      fixes.push(sdkUrl);
    }
  }
  
  // URLs de fallback conhecidas (do defaultContent)
  const fallbacks = [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
  ];
  
  fixes.push(...fallbacks);
  
  return [...new Set(fixes)];
}

// Função para executar no console do navegador
declare global {
  interface Window {
    diagnoseSpeakers: () => Promise<void>;
  }
}

if (typeof window !== 'undefined') {
  window.diagnoseSpeakers = diagnoseAndFixSpeakerImages;
}