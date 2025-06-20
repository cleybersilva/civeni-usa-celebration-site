import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users, DollarSign, Ticket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCursos, useTurmas } from '@/hooks/useCursos';

interface Batch {
  id: string;
  batch_number: number;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

interface Category {
  id: string;
  category_name: string;
  price_brl: number;
  requires_proof: boolean;
  is_exempt: boolean;
}

interface NewRegistrationSectionProps {
  registrationType?: 'presencial' | 'online';
}

const NewRegistrationSection = ({ registrationType }: NewRegistrationSectionProps) => {
  const { t, i18n } = useTranslation();
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    participantType: '',
    categoryId: '',
    cursoId: '',
    turmaId: '',
    couponCode: ''
  });

  // Hooks para cursos e turmas
  const { cursos } = useCursos();
  const { turmas } = useTurmas(formData.cursoId);

  const getCurrency = () => {
    switch (i18n.language) {
      case 'en': return 'USD';
      case 'es': return 'USD'; // or 'ARS' for Argentina
      default: return 'BRL';
    }
  };

  const formatPrice = (price: number) => {
    const currency = getCurrency();
    const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'en' ? 'en-US' : 'es-ES';
    
    let convertedPrice = price;
    if (currency === 'USD') {
      convertedPrice = price / 5.5; // Simple conversion - use real rates in production
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(convertedPrice);
  };

  const getCategoryName = (categoryName: string) => {
    const translations: Record<string, string> = {
      'vccu_student_presentation': t('registration.categories.vccuStudentPresentation'),
      'vccu_student_listener': t('registration.categories.vccuStudentListener'),
      'vccu_professor_partner': t('registration.categories.vccuProfessorPartner'),
      'general_participant': t('registration.categories.generalParticipant')
    };
    return translations[categoryName] || categoryName;
  };

  const getBatchStatusInfo = (daysRemaining: number) => {
    const currentBatchText = t('registration.currentBatch');
    const daysRemainingText = t('registration.daysRemaining');
    
    if (daysRemaining > 15) {
      return {
        color: 'bg-green-500',
        message: `1º ${currentBatchText.toLowerCase()}`,
        textColor: 'text-green-600',
        animate: 'animate-pulse'
      };
    } else if (daysRemaining > 5) {
      return {
        color: 'bg-yellow-500',
        message: i18n.language === 'pt' ? 'Últimos dias para o encerramento do 1º lote' : 
                i18n.language === 'en' ? 'Last days to close the 1st batch' :
                'Últimos días para el cierre del 1er lote',
        textColor: 'text-yellow-600',
        animate: 'animate-pulse'
      };
    } else if (daysRemaining > 0) {
      return {
        color: 'bg-red-500',
        message: i18n.language === 'pt' ? `Faltam ${daysRemaining} dias para o encerramento do 1º lote` :
                i18n.language === 'en' ? `${daysRemaining} days left to close the 1st batch` :
                `Faltan ${daysRemaining} días para el cierre del 1er lote`,
        textColor: 'text-red-600',
        animate: 'animate-pulse'
      };
    } else {
      return {
        color: 'bg-gray-500',
        message: i18n.language === 'pt' ? '1º lote encerrado' :
                i18n.language === 'en' ? '1st batch closed' :
                '1er lote cerrado',
        textColor: 'text-gray-600',
        animate: ''
      };
    }
  };

  useEffect(() => {
    fetchCurrentBatch();
  }, []);

  useEffect(() => {
    if (currentBatch) {
      fetchCategories();
    }
  }, [currentBatch]);

  const fetchCurrentBatch = async () => {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // First try to get batch 1 if it's still active
      const { data: batch1, error: error1 } = await supabase
        .from('registration_batches')
        .select('*')
        .eq('batch_number', 1)
        .lte('start_date', todayString)
        .gte('end_date', todayString)
        .single();
      
      if (batch1 && !error1) {
        const endDate = new Date(batch1.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        setCurrentBatch({
          id: batch1.id,
          batch_number: batch1.batch_number,
          start_date: batch1.start_date,
          end_date: batch1.end_date,
          days_remaining: Math.max(0, daysRemaining)
        });
        return;
      }
      
      // If batch 1 is not active, try batch 2
      const { data: batch2, error: error2 } = await supabase
        .from('registration_batches')
        .select('*')
        .eq('batch_number', 2)
        .lte('start_date', todayString)
        .gte('end_date', todayString)
        .single();
      
      if (batch2 && !error2) {
        const endDate = new Date(batch2.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        setCurrentBatch({
          id: batch2.id,
          batch_number: batch2.batch_number,
          start_date: batch2.start_date,
          end_date: batch2.end_date,
          days_remaining: Math.max(0, daysRemaining)
        });
        return;
      }
      
      // No active batch found
      setCurrentBatch(null);
    } catch (error) {
      console.error('Error fetching current batch:', error);
      setError('Erro ao carregar informações do lote atual');
    }
  };

  const fetchCategories = async () => {
    if (!currentBatch) return;
    
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('batch_id', currentBatch.id);
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Erro ao carregar categorias de inscrição');
    }
  };

  const validateCoupon = async (couponCode: string) => {
    if (!couponCode) return null;
    
    try {
      // Use raw SQL query since the function might not be in the types yet
      const { data, error } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      
      // Check usage limit
      if (data && (data.usage_limit === null || (data.used_count || 0) < data.usage_limit)) {
        return { is_valid: true, coupon_id: data.id, category_id: data.category_id };
      }
      
      return { is_valid: false };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { is_valid: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBatch || !formData.categoryId) return;
    
    // Validar campos obrigatórios para alunos VCCU
    if (formData.participantType === 'vccu_student' && (!formData.cursoId || !formData.turmaId)) {
      setError('Para alunos da VCCU, os campos Curso e Turma são obrigatórios.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Validate coupon if provided
      let validCoupon = null;
      if (formData.couponCode) {
        validCoupon = await validateCoupon(formData.couponCode);
        if (!validCoupon?.is_valid) {
          throw new Error(t('registration.errors.invalidCoupon'));
        }
      }

      const { data, error } = await supabase.functions.invoke('create-registration-payment', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          categoryId: formData.categoryId,
          batchId: currentBatch.id,
          couponCode: formData.couponCode,
          cursoId: formData.cursoId || null,
          turmaId: formData.turmaId || null,
          participantType: formData.participantType,
          registrationType: registrationType || 'geral',
          currency: getCurrency()
        }
      });

      if (error) throw error;

      if (data.payment_required === false) {
        // Free registration completed
        alert(t('registration.success.freeRegistration'));
        setFormData({ 
          email: '', 
          fullName: '', 
          participantType: '',
          categoryId: '', 
          cursoId: '',
          turmaId: '',
          couponCode: '' 
        });
      } else if (data.url) {
        // Redirect to Stripe checkout
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || t('registration.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  if (!currentBatch) {
    return (
      <section id="registration" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('registration.noBatchActive')}
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  const statusInfo = getBatchStatusInfo(currentBatch.days_remaining);
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
          
          {/* Batch Info with Status Light */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color} ${statusInfo.animate}`}></div>
                <Calendar className="w-5 h-5" />
                {statusInfo.message}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                <span className={`text-lg font-semibold ${statusInfo.textColor}`}>
                  {currentBatch.days_remaining} {t('registration.daysRemaining')}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {t('registration.validUntil')}: {new Date(currentBatch.end_date).toLocaleDateString(
                  i18n.language === 'pt' ? 'pt-BR' : 
                  i18n.language === 'en' ? 'en-US' : 'es-ES'
                )}
              </p>
            </CardContent>
          </Card>
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
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Tipo de Participante */}
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

                {/* Campos condicionais para alunos VCCU */}
                {isVCCUStudent && (
                  <>
                    <div>
                      <Label htmlFor="curso">Curso *</Label>
                      <Select value={formData.cursoId} onValueChange={(value) => setFormData({...formData, cursoId: value, turmaId: ''})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome_curso}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">Campo obrigatório para alunos da VCCU</p>
                    </div>

                    <div>
                      <Label htmlFor="turma">Turma *</Label>
                      <Select 
                        value={formData.turmaId} 
                        onValueChange={(value) => setFormData({...formData, turmaId: value})}
                        disabled={!formData.cursoId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.cursoId ? "Selecione sua turma" : "Primeiro selecione um curso"} />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome_turma}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">Campo obrigatório para alunos da VCCU</p>
                    </div>
                  </>
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
                            <span>{getCategoryName(category.category_name)}</span>
                            <span className="ml-4 font-semibold">
                              {category.is_exempt ? t('registration.free') : formatPrice(category.price_brl)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory?.is_exempt && (
                  <div>
                    <Label htmlFor="couponCode">{t('registration.couponCode')}</Label>
                    <Input
                      id="couponCode"
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({...formData, couponCode: e.target.value})}
                      placeholder={t('registration.couponPlaceholder')}
                      required
                    />
                  </div>
                )}

                {selectedCategory && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-civeni-blue" />
                      <span className="font-semibold">{t('registration.totalAmount')}</span>
                    </div>
                    <div className="text-2xl font-bold text-civeni-blue">
                      {selectedCategory.is_exempt ? t('registration.free') : formatPrice(selectedCategory.price_brl)}
                    </div>
                    {selectedCategory.requires_proof && (
                      <p className="text-sm text-amber-600 mt-2">
                        {t('registration.proofRequired')}
                      </p>
                    )}
                  </div>
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
