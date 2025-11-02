
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { EventCategory } from '@/hooks/useEventCategories';

interface PriceSummaryProps {
  selectedCategory: EventCategory;
  priceCents?: number; // current lote price in cents
  participantType?: string;
}

const PriceSummary = ({ selectedCategory, priceCents = 0, participantType }: PriceSummaryProps) => {
  const { t } = useTranslation();

  const isFree = selectedCategory.is_free;
  const displayPrice = isFree ? t('registration.free') : `R$ ${(priceCents / 100).toFixed(2)}`;

  const getFreeCategoryMessage = () => {
    if (!isFree) return null;
    
    if (participantType === 'Sorteados') {
      return 'Categoria gratuita para Sorteados VCCU com cupom válido.';
    }
    
    if (participantType === 'Palestrantes') {
      return 'Categoria gratuita para Palestrantes VCCU com cupom válido.';
    }
    
    return 'Categoria gratuita para Professor(a) VCCU com cupom válido.';
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-5 h-5 text-civeni-blue" />
        <span className="font-semibold">{t('registration.totalAmount')}</span>
      </div>
      <div className="text-2xl font-bold text-civeni-blue">{displayPrice}</div>
      {isFree && (
        <p className="text-sm text-green-600 mt-2">{getFreeCategoryMessage()}</p>
      )}
    </div>
  );
};

export default PriceSummary;
