
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { EventCategory } from '@/hooks/useEventCategories';
import { formatPrice } from '@/utils/registrationUtils';

interface PriceSummaryProps {
  selectedCategory: EventCategory;
}

const PriceSummary = ({ selectedCategory }: PriceSummaryProps) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-5 h-5 text-civeni-blue" />
        <span className="font-semibold">{t('registration.totalAmount')}</span>
      </div>
      <div className="text-2xl font-bold text-civeni-blue">
        {selectedCategory.is_free ? t('registration.free') : `R$ ${((selectedCategory.price_cents || 0) / 100).toFixed(2)}`}
      </div>
      {selectedCategory.is_free && (
        <p className="text-sm text-green-600 mt-2">
          {t('registration.freeCategory')}
        </p>
      )}
    </div>
  );
};

export default PriceSummary;
