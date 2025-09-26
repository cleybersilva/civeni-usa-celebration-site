
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
import { getCategoryName } from '@/utils/registrationUtils';
import LoteInfo from './registration/LoteInfo';
import VCCUFields from './registration/VCCUFields';
import PriceSummary from './registration/PriceSummary';

const NewRegistrationSection = ({ registrationType }: NewRegistrationSectionProps) => {
  const { t, i18n } = useTranslation();
  const { loteVigente, loading: loteLoading } = useLotes();
  const { categories } = usePublicEventCategories();
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
    if (!formData.participantType) return categories;
    
    return categories.filter(category => {
      // Se é categoria gratuita para professor VCCU, só mostrar para professores
      if (category.is_free && category.slug === 'professor-vccu-gratuito') {
        return formData.participantType === 'professor';
      }
      
      // Para outros tipos de participante (aluno, convidado, externo), mostrar apenas categorias pagas do lote vigente
      if (formData.participantType !== 'professor') {
        return !category.is_free;
      }
      
      // Para professores, mostrar todas as categorias
      return true;
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
                      <SelectItem value="external">Participante Externo</SelectItem>
                      <SelectItem value="professor">Professor(a)</SelectItem>
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
                                {category.is_free ? 'GRATUITO' : `R$ ${(loteVigente?.price_cents / 100).toFixed(2)}`}
                              </span>
                              {loteVigente && !category.is_free && (
                                <span className="text-xs text-green-600 font-medium">
                                  {loteVigente.nome}
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
                  <PriceSummary selectedCategory={selectedCategory} priceCents={loteVigente?.price_cents ?? 0} />
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-civeni-red hover:bg-red-700 text-white py-3 text-lg font-semibold"
                  disabled={loading || !formData.categoryId || !formData.participantType || (isVCCUStudent && (!formData.cursoId || !formData.turmaId)) || (selectedCategory?.is_free && !formData.couponCode)}
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
