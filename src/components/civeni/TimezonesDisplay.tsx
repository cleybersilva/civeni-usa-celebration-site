import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';

interface TimezoneInfo {
  country: string;
  emoji: string;
  timezone: string;
}

interface TimezonesDisplayProps {
  startTime: string;
  endTime?: string;
  className?: string;
}

const TIMEZONES: TimezoneInfo[] = [
  { country: 'EUA', emoji: '🇺🇸', timezone: 'America/New_York' },
  { country: 'Brasil', emoji: '🇧🇷', timezone: 'America/Fortaleza' },
  { country: 'Portugal', emoji: '🇵🇹', timezone: 'Europe/Lisbon' },
  { country: 'Ucrânia', emoji: '🇺🇦', timezone: 'Europe/Kiev' },
  { country: 'Turquia', emoji: '🇹🇷', timezone: 'Europe/Istanbul' },
  { country: 'Índia', emoji: '🇮🇳', timezone: 'Asia/Kolkata' },
  { country: 'Tailândia', emoji: '🇹🇭', timezone: 'Asia/Bangkok' },
];

const TimezonesDisplay: React.FC<TimezonesDisplayProps> = ({ startTime, endTime, className = '' }) => {
  const formatTimeForTimezone = (time: string, timezone: string) => {
    try {
      const date = new Date(time);
      return formatInTimeZone(date, timezone, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  };

  return (
    <div className={`space-y-2 text-sm ${className}`}>
      {TIMEZONES.map((tz) => (
        <div key={tz.country} className="flex items-center gap-2 sm:gap-3">
          <span 
            className="text-3xl sm:text-4xl leading-none flex-shrink-0 w-10 sm:w-12 text-center" 
            role="img" 
            aria-label={tz.country}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {tz.emoji}
          </span>
          <span className="font-medium min-w-[70px] sm:min-w-[90px] text-xs sm:text-sm">{tz.country}</span>
          <span className="font-mono text-muted-foreground text-xs sm:text-sm">
            {formatTimeForTimezone(startTime, tz.timezone)}
            {endTime && ` - ${formatTimeForTimezone(endTime, tz.timezone)}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TimezonesDisplay;
