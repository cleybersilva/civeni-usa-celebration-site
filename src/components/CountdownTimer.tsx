
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const CountdownTimer = () => {
  const { t, i18n } = useTranslation();
  const { content } = useCMS();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Always prioritize eventConfig.eventDate for consistency
    const eventDate = content.eventConfig.eventDate;
    console.log('CountdownTimer - eventDate from eventConfig:', eventDate);
    
    if (!eventDate) return;

    // Prefer the configured start time (with seconds if provided)
    const rawTime = content.eventConfig.startTime || '00:00:00';
    const time = /\d{2}:\d{2}:\d{2}/.test(rawTime) ? rawTime : `${rawTime}:00`;

    const targetDate = new Date(`${eventDate}T${time}`).getTime();

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
  }, [content.eventConfig.eventDate, content.eventConfig.startTime]);

  // Atualizar quando evento de configuração é disparado
  useEffect(() => {
    const handleEventUpdate = (event: any) => {
      console.log('CountdownTimer - Event config updated:', event.detail);
      // Força re-render imediato
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceContentReload'));
      }, 100);
    };
    
    const handleEventLoaded = (event: any) => {
      console.log('CountdownTimer - Event config loaded from DB:', event.detail);
      // Força re-render quando dados são carregados do banco
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceContentReload'));
      }, 100);
    };
    
    window.addEventListener('eventConfigUpdated', handleEventUpdate);
    window.addEventListener('eventConfigLoaded', handleEventLoaded);
    
    return () => {
      window.removeEventListener('eventConfigUpdated', handleEventUpdate);
      window.removeEventListener('eventConfigLoaded', handleEventLoaded);
    };
  }, []);

  // Force reload on component mount to get fresh data
  useEffect(() => {
    const forceReload = () => {
      console.log('Forcing content reload for CountdownTimer...');
      window.dispatchEvent(new CustomEvent('forceContentReload'));
    };
    
    // Force reload after component mount
    setTimeout(forceReload, 100);
  }, []);

  // Debug para verificar se está carregando as configurações corretas
  console.log('CountdownTimer - Event config:', content.eventConfig);

  const timeUnits = [
    { label: t('countdown.days'), value: timeLeft.days },
    { label: t('countdown.hours'), value: timeLeft.hours },
    { label: t('countdown.minutes'), value: timeLeft.minutes },
    { label: t('countdown.seconds'), value: timeLeft.seconds }
  ];

  const localeMap: Record<string, string> = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
    tr: 'tr-TR',
  };
  const eventDateStr = content.eventConfig.eventDate;
  const firstDayLabel = eventDateStr
    ? new Date(eventDateStr).toLocaleDateString(localeMap[i18n.language] || i18n.language || 'pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '';

  return (
    <section className="py-20 bg-gradient-to-r from-civeni-blue to-civeni-red">
      <div className="container mx-auto px-4 text-center">
        {/* Logo + 1º dia do evento */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <img
            src={"/uploads/0f616daa-6e2b-4e06-95c9-f2caa84c32d6.png"}
            alt="Logo do evento"
            className="h-16 w-auto mb-3"
          />
          {firstDayLabel && (
            <div className="text-white/90 text-sm font-medium">
              {firstDayLabel}
            </div>
          )}
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-poppins">
          {t('countdown.title')}
        </h2>
        <p className="text-xl text-white mb-12 opacity-90">
          {t('countdown.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10">
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

        <a
          href="/inscricoes"
          className="inline-block bg-civeni-red text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          {t('countdown.registerNow')}
        </a>
      </div>
    </section>
  );
};

export default CountdownTimer;
