
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { Category } from '@/types/registration';
import { formatPrice } from '@/utils/registrationUtils';

interface PriceSummaryProps {
  selectedCategory: Category;
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
        {selectedCategory.is_exempt ? t('registration.free') : formatPrice(selectedCategory.price_brl, i18n.language)}
      </div>
      {selectedCategory.requires_proof && (
        <p className="text-sm text-amber-600 mt-2">
          {t('registration.proofRequired')}
        </p>
      )}
    </div>
  );
};

export default PriceSummary;
