import React, { useState } from 'react';
import { Instagram, Facebook, Youtube, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Header = () => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'es', flag: '🇪🇸', name: 'Español' }
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
        { name: t('header.presentation'), href: '#presentation' },
        { name: t('header.committee'), href: '#committee' }
      ]
    },
    {
      title: t('header.schedule'),
      items: [
        { name: t('header.inPerson'), href: '#in-person' },
        { name: t('header.online'), href: '#online' }
      ]
    },
    {
      title: t('header.papers'),
      items: [
        { name: t('header.oralPresentation'), href: '#oral' },
        { name: t('header.posterSessions'), href: '#poster' },
        { name: t('header.manuscripts'), href: '#manuscripts' }
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
          <div className="flex space-x-4">
            <a href="#" className="text-white hover:text-civeni-red transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-white hover:text-civeni-red transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-white hover:text-civeni-red transition-colors">
              <Youtube size={20} />
            </a>
            <Link 
              to="/admin" 
              className="flex items-center gap-2 text-white hover:text-civeni-red transition-colors ml-4"
            >
              <Settings size={16} />
              <span className="text-sm">Área Administrativa</span>
            </Link>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
              className="flex items-center space-x-2 text-white hover:text-civeni-red transition-colors"
            >
              <span className="text-xl">{languages.find(l => l.code === selectedLanguage)?.flag}</span>
              <span className="text-sm font-medium">{languages.find(l => l.code === selectedLanguage)?.name}</span>
            </button>
            
            {openDropdown === 'language' && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-civeni-blue font-bold text-2xl font-poppins">
              CIVENI USA <span className="text-civeni-red">2025</span>
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              {menuItems.map((item) => (
                <div key={item.title} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                    className="text-civeni-blue font-semibold hover:text-civeni-red transition-colors py-2 font-poppins"
                  >
                    {item.title}
                  </button>
                  
                  {item.items.length > 0 && openDropdown === item.title && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border z-50">
                      {item.items.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-civeni-red transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {subItem.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="#registration"
              className="bg-civeni-green text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition-colors font-poppins"
            >
              {t('header.registration')}
            </a>
            <a
              href="#contact"
              className="bg-civeni-red text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors font-poppins"
            >
              {t('header.contact')}
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
