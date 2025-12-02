import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' }
  ];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setSelectedLanguage(langCode);
    setOpenDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenDropdown(!openDropdown);
        }}
        className="flex items-center space-x-2 text-white hover:text-white transition-colors bg-[#0a3d62] px-3 py-2 rounded-md hover:bg-[#0d4a75] border border-white/20"
      >
        <span className="text-base font-semibold">{languages.find(l => l.code === selectedLanguage)?.flag}</span>
        <span className="text-sm font-medium">{languages.find(l => l.code === selectedLanguage)?.name}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {openDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-md shadow-xl z-[99999] overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                changeLanguage(lang.code);
              }}
              className={`w-full px-4 py-3 text-left text-white hover:bg-white/20 flex items-center space-x-3 transition-colors ${
                selectedLanguage === lang.code ? 'bg-white/30 font-semibold' : ''
              }`}
            >
              <span className="text-lg font-semibold">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;