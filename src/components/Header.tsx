
import React, { useState } from 'react';
import { Instagram, Facebook, Youtube, Settings, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '@/utils/assetUrl';

const Header = () => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' }
  ];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setSelectedLanguage(langCode);
    setOpenDropdown(null);
  };

  const menuItems = [
    {
      title: t('header.congress'),
      items: [
        { name: t('header.presentation'), href: '/congresso/apresentacao' },
        { name: t('header.committee'), href: '/congresso/comite' }
      ]
    },
    {
      title: t('header.schedule'),
      items: [
        { name: t('header.inPerson'), href: '/programacao-presencial' },
        { name: t('header.online'), href: '/programacao-online' }
      ]
    },
    {
      title: t('header.papers'),
      items: [
        { name: t('header.submission'), href: '/submissao-trabalhos' },
        { name: t('header.oralPresentation'), href: '/apresentacao-oral' },
        { name: t('header.posterSessions'), href: '/sessoes-poster' },
        { name: t('header.manuscripts'), href: '/manuscritos' }
      ]
    },
    {
      title: t('header.thematicAreas'),
      items: []
    },
    {
      title: t('header.speakers'),
      items: []
    }
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-civeni-blue py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <Link 
              to="/admin" 
              className="flex items-center gap-2 text-white hover:text-civeni-red transition-colors"
            >
              <Settings size={16} />
              <span className="text-sm">{t('header.adminArea')}</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.youtube.com/@veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Youtube size={20} />
              </a>
              <a 
                href="https://www.linkedin.com/company/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Linkedin size={20} />
              </a>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
                className="flex items-center space-x-2 text-white hover:text-civeni-red transition-colors bg-white bg-opacity-10 px-3 py-1 rounded-md hover:bg-opacity-20"
              >
                <span className="text-xl">{languages.find(l => l.code === selectedLanguage)?.flag}</span>
                <span className="text-sm font-medium">{languages.find(l => l.code === selectedLanguage)?.name}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openDropdown === 'language' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-gray-200 z-[99999] overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                        selectedLanguage === lang.code ? 'bg-gray-100 font-medium' : ''
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Link to="/">
                <img 
                  src={resolveAssetUrl("/lovable-uploads/0f616daa-6e2b-4e06-95c9-f2caa84c32d6.png")} 
                  alt="III Civeni 2025 Logo" 
                  className="h-14 w-auto"
                  onError={(e) => {
                    console.warn('Failed to load header logo');
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjU2IiB2aWV3Qm94PSIwIDAgMTAwIDU2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjU2IiBmaWxsPSIjMEQzQjY2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSI+Q0lWRU5JPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
              </Link>
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              {menuItems.map((item) => (
                <div key={item.title} className="relative">
                  {item.title === t('header.speakers') ? (
                    <Link
                      to="/palestrantes"
                      className="text-civeni-blue font-semibold hover:text-civeni-red transition-colors py-2 font-poppins"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {item.title}
                    </Link>
                  ) : item.title === t('header.thematicAreas') ? (
                    <Link
                      to="/area-tematica"
                      className="text-civeni-blue font-semibold hover:text-civeni-red transition-colors py-2 font-poppins"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                      className="text-civeni-blue font-semibold hover:text-civeni-red transition-colors py-2 font-poppins"
                    >
                      {item.title}
                    </button>
                  )}
                  
                  {item.items.length > 0 && openDropdown === item.title && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border z-50">
                      {item.items.map((subItem) => (
                        subItem.href.startsWith('#') ? (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-civeni-red transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {subItem.name}
                          </a>
                        ) : (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-civeni-red transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {subItem.name}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/inscricoes"
              className="bg-civeni-green text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition-colors font-poppins"
            >
              {t('header.registration')}
            </Link>
            <Link
              to="/contato"
              className="bg-civeni-red text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors font-poppins"
            >
              {t('header.contact')}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
