import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { HelpCircle, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

interface FAQ {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  order_index: number;
}

const TransmissaoFAQ = () => {
  const { t, i18n } = useTranslation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  const pickLang = (obj: Record<string, string>) => {
    const lang = i18n.language.split('-')[0];
    return obj[lang] || obj['pt'] || obj['en'] || '';
  };

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const { data, error } = await supabase
          .from('transmission_faq')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        
        setFaqs((data || []).map(item => ({
          ...item,
          question: item.question as Record<string, string>,
          answer: item.answer as Record<string, string>
        })));
      } catch (error) {
        console.error('Erro ao carregar FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  return (
    <>
      <Helmet>
        <title>{t('faq.title', 'Perguntas Frequentes')} - CIVENI</title>
        <meta 
          name="description" 
          content={t('faq.description', 'Encontre respostas para as perguntas mais frequentes sobre a transmissão ao vivo do CIVENI')} 
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('faq.title', 'Perguntas Frequentes')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('faq.subtitle', 'Encontre respostas para as dúvidas mais comuns sobre a transmissão ao vivo')}
            </p>
          </div>

          {/* FAQ Content */}
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-card rounded-lg p-6 border">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-2" />
                  </div>
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {t('faq.noFaqs', 'Nenhuma pergunta disponível no momento')}
                </h3>
                <p className="text-muted-foreground">
                  {t('faq.checkLater', 'Verifique novamente mais tarde')}
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={faq.id} 
                    value={`item-${index}`}
                    className="bg-card border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-6">
                      <div className="flex items-start gap-4 w-full pr-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                          <span className="text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-semibold text-base flex-1">
                          {pickLang(faq.question as Record<string, string>)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pl-12 pr-6">
                      <div 
                        className="text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: pickLang(faq.answer as Record<string, string>)
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto border border-primary/20">
              <h3 className="text-2xl font-bold mb-3">
                {t('faq.needHelp', 'Ainda precisa de ajuda?')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('faq.contactUs', 'Entre em contato conosco para mais informações')}
              </p>
              <a 
                href="/contato" 
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
              >
                {t('faq.contact', 'Entrar em Contato')}
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TransmissaoFAQ;
