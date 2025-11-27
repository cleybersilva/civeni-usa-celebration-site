import React, { useState } from 'react';
import { Instagram, Facebook, Youtube, Settings, Linkedin, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import FlagEmoji from '@/components/FlagEmoji';

const Header = () => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);

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
      title: t('header.thematicAreas'),
      items: []
    },
    {
      title: t('header.congress'),
      items: [
        { name: t('header.presentation'), href: '/congresso/apresentacao' },
        { name: t('header.evaluators'), href: '/congresso/avaliadores' },
        { name: t('header.committee'), href: '/congresso/comite' }
      ]
    },
    {
      title: t('header.events'),
      items: []
    },
    {
      title: t('header.speakers'),
      items: []
    },
    {
      title: t('header.schedule'),
      items: [
        { name: t('header.inPerson'), href: '/programacao-presencial' },
        { name: t('header.online'), href: '/programacao-online' },
        { name: t('header.liveStream'), href: '/transmissao-ao-vivo' }
      ]
    },
    {
      title: t('header.papers'),
      items: [
        { name: t('header.submissionArticleConsortium'), href: '/submissao-trabalhos' },
        { name: t('header.oralPresentation'), href: '/apresentacao-oral' },
        { name: t('header.posterSessions'), href: '/sessoes-poster' },
        { name: t('header.manuscripts'), href: '/manuscritos' },
        { name: t('header.templatesArticlesSlides'), href: '/templates-artigos-slides' }
      ]
    }
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-civeni-blue py-1.5 md:py-2">
        <div className="container mx-auto px-3 md:px-4 flex justify-between items-center">
          <div>
            <Link 
              to="/admin" 
              className="flex items-center gap-1.5 md:gap-2 text-white hover:text-civeni-red transition-colors"
            >
              <Settings size={14} className="md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">{t('header.adminArea')}</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="flex space-x-2 md:space-x-4">
              <a 
                href="https://www.instagram.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Instagram size={16} className="md:w-5 md:h-5" />
              </a>
              <a 
                href="https://www.facebook.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Facebook size={16} className="md:w-5 md:h-5" />
              </a>
              <a 
                href="https://www.youtube.com/@veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Youtube size={16} className="md:w-5 md:h-5" />
              </a>
              <a 
                href="https://www.linkedin.com/company/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors"
              >
                <Linkedin size={16} className="md:w-5 md:h-5" />
              </a>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
                className="flex items-center space-x-1 md:space-x-2 text-white hover:opacity-90 transition-colors bg-gradient-to-r from-civeni-blue to-civeni-red px-2 py-1 md:px-3 rounded-md"
              >
                <FlagEmoji countryCode={selectedLanguage} size="md" />
                <span className="text-xs md:text-sm font-medium hidden sm:inline">{languages.find(l => l.code === selectedLanguage)?.name}</span>
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openDropdown === 'language' && (
                <div className="absolute right-0 mt-2 w-48 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-xl shadow-2xl border border-white/20 z-[99999] overflow-hidden">
                  <div className="py-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-3 text-left text-white flex items-center space-x-3 transition-all duration-200 border-b border-white/10 last:border-b-0 hover:bg-white/20 ${
                          selectedLanguage === lang.code ? 'bg-white/20 font-semibold' : 'font-medium'
                        }`}
                      >
                        <FlagEmoji countryCode={lang.code} size="md" />
                        <span className="text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-3 md:px-4 py-2 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Link to="/">
                <img 
                  src={resolveAssetUrl("/lovable-uploads/0f616daa-6e2b-4e06-95c9-f2caa84c32d6.png")} 
                  alt="III Civeni 2025 Logo" 
                  className="h-10 md:h-14 w-auto"
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
                  ) : item.title === t('header.events') ? (
                    <Link
                      to="/eventos"
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
                    <div className="absolute top-full left-0 mt-2 w-64 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-xl shadow-2xl border border-white/20 z-50 overflow-hidden">
                      <div className="py-2">
                        {item.items.map((subItem, index) => (
                          subItem.href.startsWith('#') ? (
                            <a
                              key={subItem.name}
                              href={subItem.href}
                              className="block px-5 py-3 text-white font-medium hover:bg-white/20 transition-all duration-200 border-b border-white/10 last:border-b-0"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {subItem.name}
                            </a>
                          ) : (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className="block px-5 py-3 text-white font-medium hover:bg-white/20 transition-all duration-200 border-b border-white/10 last:border-b-0"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {subItem.name}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                to="/inscricoes"
                className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-colors font-poppins"
              >
                {t('header.registration')}
              </Link>
              <Link
                to="/contato"
                className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-colors font-poppins"
              >
                {t('header.contact')}
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-1.5 md:p-2 text-civeni-blue hover:text-civeni-red transition-colors">
                  <Menu size={24} className="md:w-7 md:h-7" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 border-l-0 bg-gradient-to-br from-civeni-blue via-[#4a1a5e] to-civeni-red overflow-y-auto">
                {/* Header with logo */}
                <div className="px-6 pt-8 pb-6 border-b border-white/20">
                  <div className="flex items-center justify-center">
                    <img 
                      src={resolveAssetUrl("/lovable-uploads/0f616daa-6e2b-4e06-95c9-f2caa84c32d6.png")} 
                      alt="III Civeni 2025 Logo" 
                      className="h-12 w-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                      style={{ filter: 'drop-shadow(0 0 6px white) drop-shadow(0 0 12px rgba(255,255,255,0.7))' }}
                    />
                  </div>
                  <p className="text-white/70 text-xs text-center mt-2 font-medium tracking-wide">
                    Menu de Navegação
                  </p>
                </div>

                <div className="flex flex-col px-4 py-6">
                  {/* Mobile Menu Items */}
                  {menuItems.map((item, index) => (
                    <div key={item.title} className="mb-1">
                      {item.title === t('header.speakers') ? (
                        <Link
                          to="/palestrantes"
                          className="flex items-center px-4 py-3.5 text-white font-semibold text-base hover:bg-white/15 transition-all duration-200 rounded-xl group"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="w-2 h-2 rounded-full bg-white/40 mr-3 group-hover:bg-white transition-colors"></span>
                          {item.title}
                        </Link>
                      ) : item.title === t('header.thematicAreas') ? (
                        <Link
                          to="/area-tematica"
                          className="flex items-center px-4 py-3.5 text-white font-semibold text-base hover:bg-white/15 transition-all duration-200 rounded-xl group"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="w-2 h-2 rounded-full bg-white/40 mr-3 group-hover:bg-white transition-colors"></span>
                          {item.title}
                        </Link>
                      ) : item.title === t('header.events') ? (
                        <Link
                          to="/eventos"
                          className="flex items-center px-4 py-3.5 text-white font-semibold text-base hover:bg-white/15 transition-all duration-200 rounded-xl group"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="w-2 h-2 rounded-full bg-white/40 mr-3 group-hover:bg-white transition-colors"></span>
                          {item.title}
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={() => setMobileSubmenuOpen(mobileSubmenuOpen === item.title ? null : item.title)}
                            className="flex items-center justify-between w-full px-4 py-3.5 text-white font-semibold text-base hover:bg-white/15 transition-all duration-200 rounded-xl group"
                          >
                            <span className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-white/40 mr-3 group-hover:bg-white transition-colors"></span>
                              {item.title}
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform duration-300 ${mobileSubmenuOpen === item.title ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {item.items.length > 0 && mobileSubmenuOpen === item.title && (
                            <div className="mt-1 ml-4 mr-2 overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 animate-fade-in">
                              <div className="py-1">
                                {item.items.map((subItem) => (
                                  <Link
                                    key={subItem.name}
                                    to={subItem.href}
                                    className="block px-4 py-3 text-sm text-white/90 font-medium hover:bg-white/15 hover:text-white transition-all duration-200 border-b border-white/10 last:border-b-0"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  
                  {/* Divider */}
                  <div className="my-4 border-t border-white/20"></div>
                  
                  {/* Mobile Action Buttons */}
                  <div className="space-y-3 px-2">
                    <Link
                      to="/inscricoes"
                      className="block w-full bg-green-500 text-white px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all duration-200 text-center shadow-lg shadow-green-500/30"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.registration')}
                    </Link>
                    <Link
                      to="/contato"
                      className="block w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-white/30 transition-all duration-200 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.contact')}
                    </Link>
                  </div>

                  {/* Social Links */}
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <p className="text-white/60 text-xs text-center mb-4 font-medium">Siga-nos nas redes sociais</p>
                    <div className="flex justify-center space-x-4">
                      <a 
                        href="https://www.instagram.com/veniuniversity/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all duration-200"
                      >
                        <Instagram size={18} />
                      </a>
                      <a 
                        href="https://www.facebook.com/veniuniversity/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all duration-200"
                      >
                        <Facebook size={18} />
                      </a>
                      <a 
                        href="https://www.youtube.com/@veniuniversity/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all duration-200"
                      >
                        <Youtube size={18} />
                      </a>
                      <a 
                        href="https://www.linkedin.com/company/veniuniversity/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all duration-200"
                      >
                        <Linkedin size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
