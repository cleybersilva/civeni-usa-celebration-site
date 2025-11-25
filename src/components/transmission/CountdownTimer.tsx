import { useState, useEffect } from 'react';
import { useCMS } from '@/contexts/CMSContext';

interface CountdownTimerProps {
  targetDate?: Date;
  className?: string;
}

const CountdownTimer = ({ targetDate, className = '' }: CountdownTimerProps) => {
  const { content } = useCMS();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    let target: number;
    
    if (targetDate) {
      target = targetDate.getTime();
    } else {
      // Use event config as fallback
      const eventDate = content.eventConfig.eventDate;
      if (!eventDate) return;

      const rawTime = content.eventConfig.startTime || '00:00:00';
      const time = /\d{2}:\d{2}:\d{2}/.test(rawTime) ? rawTime : `${rawTime}:00`;
      target = new Date(`${eventDate}T${time}`).getTime();
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = target - now;

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
  }, [targetDate, content.eventConfig.eventDate, content.eventConfig.startTime]);

  return (
    <div className={`bg-gradient-to-br from-civeni-blue/20 to-civeni-red/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 md:p-6 ${className}`}>
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <div className="text-center">
          <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white animate-pulse">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-xs md:text-sm text-white/80 uppercase mt-1">Dias</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white animate-pulse">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs md:text-sm text-white/80 uppercase mt-1">Horas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white animate-pulse">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs md:text-sm text-white/80 uppercase mt-1">Minutos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs md:text-sm text-white/80 uppercase mt-1">Segundos</div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
