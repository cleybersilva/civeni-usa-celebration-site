
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
import { useBatches } from '@/hooks/useBatches';
import { usePublicEventCategories } from '@/hooks/usePublicEventCategories';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { getCategoryName } from '@/utils/registrationUtils';
import BatchInfo from './registration/BatchInfo';
import VCCUFields from './registration/VCCUFields';
import PriceSummary from './registration/PriceSummary';

const NewRegistrationSection = ({ registrationType }: NewRegistrationSectionProps) => {
  const { t, i18n } = useTranslation();
  const { currentBatch, loading: batchLoading } = useBatches();
  const { categories } = usePublicEventCategories();
  const { formData, setFormData, loading, error, handleSubmit } = useRegistrationForm(registrationType);

  if (batchLoading || !currentBatch) {
    return (
      <section id="registration" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          {batchLoading ? (
            <div>Loading...</div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('registration.noBatchActive')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </section>
    );
  }

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const isVCCUStudent = formData.participantType === 'vccu_student';

  return (
    <section id="registration" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block bg-civeni-red text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
            {t('registration.urgent')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {registrationType === 'presencial' 
              ? t('registration.presentialFormTitle', 'Formulário de Inscrição Presencial')
              : registrationType === 'online'
              ? t('registration.onlineFormTitle', 'Formulário de Inscrição Online')
              : t('registration.newTitle')
            }
          </h2>
          
          <BatchInfo currentBatch={currentBatch} />
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                {t('registration.formTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => handleSubmit(e, currentBatch)} className="space-y-6">
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
                  <Select value={formData.participantType} onValueChange={(value) => setFormData({...formData, participantType: value, cursoId: '', turmaId: ''})}>
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
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex justify-between w-full">
                            <span>{category.title_pt}</span>
                            <span className="ml-4 font-semibold">
                              {category.is_free ? t('registration.free') : `R$ ${(category.price_cents / 100).toFixed(2)}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && !selectedCategory.is_free && (
                  <div>
                    <Label htmlFor="couponCode">{t('registration.couponCode')}</Label>
                    <Input
                      id="couponCode"
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({...formData, couponCode: e.target.value})}
                      placeholder={t('registration.couponPlaceholder')}
                    />
                  </div>
                )}

                {selectedCategory && (
                  <PriceSummary selectedCategory={selectedCategory} />
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-civeni-red hover:bg-red-700 text-white py-3 text-lg font-semibold"
                  disabled={loading || !formData.categoryId || !formData.participantType || (isVCCUStudent && (!formData.cursoId || !formData.turmaId))}
                >
                  {loading ? t('registration.processing') : t('registration.registerNow')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default NewRegistrationSection;
