
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Batch } from '@/types/registration';
import { getBatchStatusInfo } from '@/utils/registrationUtils';

interface BatchInfoProps {
  currentBatch: Batch;
}

const BatchInfo = ({ currentBatch }: BatchInfoProps) => {
  const { t, i18n } = useTranslation();
  const statusInfo = getBatchStatusInfo(currentBatch.days_remaining, t, i18n);

  return (
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
  );
};

export default BatchInfo;
