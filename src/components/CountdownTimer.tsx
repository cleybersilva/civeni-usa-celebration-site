
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const CountdownTimer = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!content.eventConfig.eventDate) return;
    
    const targetDate = new Date(content.eventConfig.eventDate + 'T00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [content.eventConfig.eventDate]);

  const timeUnits = [
    { label: t('countdown.days'), value: timeLeft.days },
    { label: t('countdown.hours'), value: timeLeft.hours },
    { label: t('countdown.minutes'), value: timeLeft.minutes },
    { label: t('countdown.seconds'), value: timeLeft.seconds }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-civeni-blue to-civeni-red">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-poppins">
          {t('countdown.title')}
        </h2>
        <p className="text-xl text-white mb-12 opacity-90">
          {t('countdown.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {timeUnits.map((unit, index) => (
            <div
              key={unit.label}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 animate-float"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="text-4xl md:text-6xl font-bold text-white mb-2 font-poppins">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="text-lg text-white font-semibold opacity-90">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CountdownTimer;
