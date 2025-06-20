
export const getCurrency = (language: string) => {
  switch (language) {
    case 'en': return 'USD';
    case 'es': return 'USD';
    default: return 'BRL';
  }
};

export const formatPrice = (price: number, language: string) => {
  const currency = getCurrency(language);
  const locale = language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es-ES';
  
  let convertedPrice = price;
  if (currency === 'USD') {
    convertedPrice = price / 5.5;
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(convertedPrice);
};

export const getCategoryName = (categoryName: string, t: (key: string) => string) => {
  const translations: Record<string, string> = {
    'vccu_student_presentation': t('registration.categories.vccuStudentPresentation'),
    'vccu_student_listener': t('registration.categories.vccuStudentListener'),
    'vccu_professor_partner': t('registration.categories.vccuProfessorPartner'),
    'general_participant': t('registration.categories.generalParticipant')
  };
  return translations[categoryName] || categoryName;
};

export const getBatchStatusInfo = (daysRemaining: number, t: (key: string) => string, i18n: any) => {
  const currentBatchText = t('registration.currentBatch');
  
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
