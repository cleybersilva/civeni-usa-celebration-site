import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingBarProps {
  progress: number;
  message?: string;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ progress, message }) => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-civeni-blue/10 to-civeni-red/10 backdrop-blur-sm">
      <div className="w-full max-w-md px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-block animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-civeni-blue to-civeni-red flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {message || t('common.loading')}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-civeni-blue to-civeni-red transition-all duration-300 ease-out rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{t('common.loadingProgress')}</span>
              <span className="font-bold text-civeni-blue">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
