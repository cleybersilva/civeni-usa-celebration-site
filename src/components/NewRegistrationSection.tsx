
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewRegistrationSectionProps } from '@/types/registration';
import { useLotes } from '@/hooks/useLotes';
import { usePublicEventCategories } from '@/hooks/usePublicEventCategories';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { useParticipantTypes } from '@/hooks/useParticipantTypes';
import { getCategoryName } from '@/utils/registrationUtils';
import LoteInfo from './registration/LoteInfo';
import VCCUFields from './registration/VCCUFields';
import PriceSummary from './registration/PriceSummary';

const NewRegistrationSection = ({ registrationType }: NewRegistrationSectionProps) => {
  const { t, i18n } = useTranslation();
  const { loteVigente, loading: loteLoading } = useLotes();
  const { categories } = usePublicEventCategories();
  const { participantTypes } = useParticipantTypes();
  const { formData, setFormData, loading, error, handleSubmit } = useRegistrationForm(registrationType);

  if (loteLoading) {
    return (
      <section id="registration" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
          </div>
        </div>
      </section>
    );
  }

  // Se não há lote vigente, mostrar aviso
  if (!loteVigente) {
    return (
      <section id="registration" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Card>
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold text-orange-600 mb-2">
                Inscrições Temporariamente Indisponíveis
              </h3>
              <p className="text-muted-foreground">
                Não há lotes de inscrição disponíveis no momento. 
                Entre em contato conosco ou tente novamente mais tarde.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, { 
      id: loteVigente.id, 
      batch_number: 1, // Compatibilidade 
      start_date: loteVigente.dt_inicio,
      end_date: loteVigente.dt_fim,
      days_remaining: 0 // Será calculado no backend
    });
  };

  // Filtrar categorias baseadas no tipo de participante
  const getFilteredCategories = () => {
    if (!formData.participantType) return [];
    
    return categories.filter(category => {
      // Para professores, mostrar APENAS a categoria gratuita VCCU
      if (formData.participantType === 'Professor(a)') {
        return category.is_free && category.slug === 'professor-vccu-gratuito';
      }
      
      // Para palestrantes, mostrar APENAS a categoria gratuita de palestrantes
      if (formData.participantType === 'Palestrantes') {
        return category.is_free && category.slug === 'palestrantes-vccu-gratuito';
      }
      
      // Para sorteados, mostrar APENAS a categoria gratuita VCCU (mesmo comportamento que Professor)
      if (formData.participantType === 'Sorteados') {
        return category.is_free && category.slug === 'professor-vccu-gratuito';
      }
      
      // Para participante externo, mostrar APENAS a categoria específica de externo
      if (formData.participantType === 'Participante Externo') {
        return category.slug === 'participante-externo';
      }
      
      // Para convidado, mostrar APENAS a categoria específica de convidado
      if (formData.participantType === 'guest') {
        return category.slug === 'convidado';
      }
      
      // Para outros tipos de participante (aluno), mostrar apenas categorias pagas do lote vigente (exceto externo e convidado)
      return !category.is_free && category.slug !== 'participante-externo' && category.slug !== 'convidado';
    });
  };

  const filteredCategories = getFilteredCategories();
  const selectedCategory = filteredCategories.find(cat => cat.id === formData.categoryId);
  const isVCCUStudent = formData.participantType === 'vccu_student';

  return (
    <section id="registration" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {registrationType === 'presencial' 
              ? t('registration.presentialFormTitle', 'Formulário de Inscrição Presencial')
              : registrationType === 'online'
              ? t('registration.onlineFormTitle', 'Formulário de Inscrição Online')
              : 'Inscrições III Civeni 2025'
            }
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Informações do Lote - Lado Esquerdo */}
          <div className="lg:order-1">
            {/* Botão Vagas Limitadas */}
            <div className="text-center mb-4">
              <div className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold animate-pulse cursor-default">
                Vagas Limitadas
              </div>
            </div>
            <div className="sticky top-8">
              <LoteInfo lote={loteVigente} />
            </div>
            
            {/* Aviso de Atenção */}
            <div className="mt-6 space-y-2">
              <p className="text-orange-600 font-medium text-center" style={{ fontSize: '1rem' }}>
                ⚠️ Atenção antes de prosseguir com sua inscrição
              </p>
              <p className="text-gray-700 text-center lg:text-left" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                Antes de clicar em <strong>"Inscrever-se Agora"</strong>, verifique com atenção se o <strong>Nome Completo e o E-mail informados estão corretos.</strong>
              </p>
              <p className="text-gray-700 text-center lg:text-left" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                Esses dados serão usados para gerar sua <strong>inscrição oficial</strong>, exibir a mensagem confirmação da inscrição e do pagamento e o link de acesso à programação do <strong>III Civeni 2025 no dia 10/12/2025 - 24h antes do início do evento.</strong>
              </p>
              <p className="text-red-600 font-semibold text-center lg:text-left" style={{ fontSize: '0.95rem' }}>
                Alterações após o envio podem causar atrasos ou inconsistências na validação da sua participação.
              </p>
            </div>
          </div>

          {/* Formulário - Lado Direito */}
          <div className="lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Ticket className="w-5 h-5" />
                  {t('registration.formTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">{t('registration.fullName')}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('registration.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="participantType">Tipo de Participante</Label>
                  <Select value={formData.participantType} onValueChange={(value) => setFormData({...formData, participantType: value, cursoId: '', turmaId: '', categoryId: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de participante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vccu_student">Aluno(a) VCCU</SelectItem>
                      <SelectItem value="guest">Convidado(a)</SelectItem>
                      {participantTypes.filter(pt => pt.is_active && pt.type_name !== 'Aluno(a) VCCU').map((pt) => (
                        <SelectItem key={pt.id} value={pt.type_name}>
                          {pt.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isVCCUStudent && (
                  <VCCUFields formData={formData} setFormData={setFormData} />
                )}

                <div>
                  <Label htmlFor="category">{t('registration.category')}</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('registration.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex justify-between w-full">
                            <span>{category.title_pt}</span>
                            <div className="ml-4 flex flex-col items-end">
                              <span className="font-semibold">
                                {category.is_free 
                                  ? 'GRATUITO' 
                                  : category.slug === 'participante-externo' 
                                    ? 'R$ 200,00'
                                    : category.slug === 'convidado'
                                      ? 'R$ 100,00'
                                      : `R$ ${(loteVigente?.price_cents / 100).toFixed(2)}`
                                }
                              </span>
                              {loteVigente && !category.is_free && category.slug !== 'participante-externo' && category.slug !== 'convidado' && (
                                <span className="text-xs text-green-600 font-medium">
                                  {loteVigente.nome}
                                </span>
                              )}
                              {category.slug === 'participante-externo' && (
                                <span className="text-xs text-blue-600 font-medium">
                                  Valor fixo
                                </span>
                              )}
                              {category.slug === 'convidado' && (
                                <span className="text-xs text-purple-600 font-medium">
                                  Taxa convidado
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && (
                  <div>
                    <Label htmlFor="couponCode">
                      {selectedCategory.is_free ? 'Código do Cupom (obrigatório para categoria gratuita)' : t('registration.couponCode')}
                    </Label>
                    <Input
                      id="couponCode"
                      type="text"  
                      value={formData.couponCode}
                      onChange={(e) => setFormData({...formData, couponCode: e.target.value})}
                      placeholder={selectedCategory.is_free ? 'Digite seu código de professor VCCU' : t('registration.couponPlaceholder')}
                      required={selectedCategory.is_free}
                    />
                    {selectedCategory.is_free && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Para categoria gratuita, o código do cupom é obrigatório para validar sua elegibilidade como professor VCCU.
                      </p>
                    )}
                  </div>
                )}

                {selectedCategory && (
                  <PriceSummary 
                    selectedCategory={selectedCategory} 
                    priceCents={
                      selectedCategory.is_free 
                        ? 0 
                        : selectedCategory.slug === 'participante-externo' 
                          ? 20000 
                          : selectedCategory.slug === 'convidado'
                            ? 10000
                            : loteVigente?.price_cents ?? 0
                    }
                    participantType={formData.participantType}
                  />
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-civeni-red hover:bg-red-700 text-white py-3 text-lg font-semibold"
                    disabled={
                      loading || 
                      !formData.categoryId || 
                      !formData.participantType || 
                      (isVCCUStudent && (!formData.cursoId || !formData.turmaId)) || 
                      (selectedCategory?.is_free && !formData.couponCode) ||
                      ((formData.participantType === 'Professor(a)' || formData.participantType === 'Palestrantes' || formData.participantType === 'Sorteados') && !formData.couponCode)
                    }
                >
                  {loading ? t('registration.processing') : t('registration.registerNow')}
                </Button>
              </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewRegistrationSection;
