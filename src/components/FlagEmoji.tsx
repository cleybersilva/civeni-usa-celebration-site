import React from 'react';

interface FlagEmojiProps {
  countryCode: string;
  size?: 'sm' | 'md' | 'lg';
}

const FlagEmoji: React.FC<FlagEmojiProps> = ({ countryCode, size = 'md' }) => {
  const flags: Record<string, string> = {
    'en': '🇺🇸',
    'pt': '🇧🇷',
    'es': '🇪🇸',
    'tr': '🇹🇷'
  };

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <span 
      className={`${sizeClasses[size]} inline-block`}
      style={{ 
        fontFamily: '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Emoji", sans-serif',
        fontVariantEmoji: 'emoji'
      }}
      role="img"
      aria-label={`Flag ${countryCode}`}
    >
      {flags[countryCode] || flags['en']}
    </span>
  );
};

export default FlagEmoji;
