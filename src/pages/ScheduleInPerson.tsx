
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScheduleFilters from '@/components/schedule/ScheduleFilters';
import ScheduleDay from '@/components/schedule/ScheduleDay';
import ScheduleEmpty from '@/components/schedule/ScheduleEmpty';
import { useScheduleData } from '@/hooks/useScheduleData';
import { downloadSchedule } from '@/utils/scheduleUtils';
import { useTranslation } from 'react-i18next';

const ScheduleInPerson = () => {
  const { t } = useTranslation();
  const {
    isLoading,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    uniqueDates,
    categories,
    filteredSchedules,
  } = useScheduleData('presencial');

  const handleDownload = () => {
    downloadSchedule(filteredSchedules, 'presencial');
  };

  return (
    <div className="min-h-screen bg-white p-0 m-0">
      <Header />
      
      <main className="pt-20 p-0 m-0">
        <div className="w-full p-0 m-0">
          <div className="text-center mb-8 px-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('schedule.inPersonTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('schedule.inPersonDescription')}
            </p>
          </div>

          <div className="px-6">
            <ScheduleFilters
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              uniqueDates={uniqueDates}
              categories={categories}
              onDownload={handleDownload}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('schedule.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6 px-6">
              {uniqueDates.map(date => {
                const daySchedules = filteredSchedules?.filter(s => s.date === date);
                if (!daySchedules?.length) return null;

                return (
                  <ScheduleDay key={date} date={date} schedules={daySchedules} />
                );
              })}
              
              {!filteredSchedules?.length && <ScheduleEmpty />}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ScheduleInPerson;
