
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, Facebook, Youtube, Lock, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCMS } from '@/contexts/CMSContext';

const Footer = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  
  const quickLinks = [
    { name: t('footer.about'), href: '/sobre' },
    { name: t('footer.schedule'), href: '/cronograma-presencial' },
    { name: t('footer.speakers'), href: '/palestrantes' },
    { name: t('footer.liveStream'), href: '/transmissao-ao-vivo' },
    { name: t('footer.registration'), href: '/inscricoes' },
    { name: t('footer.contact'), href: '/contato' }
  ];

  return (
    <footer className="bg-civeni-blue text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-6 md:gap-8">
          <div className="md:col-span-2 text-center md:text-left">
            <div className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 font-poppins">
              III CIVENI <span className="text-civeni-red">2025</span>
            </div>
            <p className="text-base md:text-lg opacity-90 mb-4 md:mb-6 leading-relaxed">
              {t('footer.eventTitle')}<br/>
              {t('footer.eventDates')}
            </p>
            <div className="flex items-center justify-center md:justify-start space-x-3 md:space-x-4 mb-3 md:mb-4">
              <a 
                href="https://www.instagram.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Instagram size={20} className="md:w-6 md:h-6" />
              </a>
              <a 
                href="https://www.facebook.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Facebook size={20} className="md:w-6 md:h-6" />
              </a>
              <a 
                href="https://www.youtube.com/@veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Youtube size={20} className="md:w-6 md:h-6" />
              </a>
              <a 
                href="https://www.linkedin.com/company/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Linkedin size={20} className="md:w-6 md:h-6" />
              </a>
            </div>
            <div className="mt-3 md:mt-4 flex justify-center md:justify-start">
              <Link 
                to="/admin" 
                className="inline-flex items-center space-x-1.5 md:space-x-2 bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:opacity-90 transition-colors transform hover:scale-105"
              >
                <Lock size={14} className="md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium">{t('header.adminArea')}</span>
              </Link>
            </div>
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 font-poppins">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 md:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('/') ? (
                    <Link
                      to={link.href}
                      className="text-sm md:text-base opacity-90 hover:opacity-100 hover:text-civeni-red transition-all duration-300"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm md:text-base opacity-90 hover:opacity-100 hover:text-civeni-red transition-all duration-300"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 font-poppins">{t('footer.contactInfo')}</h3>
            <div className="space-y-2 md:space-y-3 opacity-90 text-sm md:text-base">
              <p>📧 contact@civeni.com</p>
              <p>📞 {content.siteTexts.contactPhone}</p>
              <p>📍 Celebration, FL 34747</p>
              <p>🌐 <a 
                href="https://www.veniuniversity.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-civeni-red transition-colors"
              >
                www.veniuniversity.net
              </a></p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-20 mt-8 md:mt-12 pt-6 md:pt-8 text-center">
          <div className="grid md:grid-cols-3 gap-3 md:gap-4 items-center text-center">
            <div className="text-xs md:text-sm opacity-75">
              {content.siteTexts.footerCopyright || t('footer.copyright')}
            </div>
            <div className="text-xs md:text-sm opacity-75">
              {t('footer.poweredBy')}
            </div>
            <div className="text-xs md:text-sm opacity-75">
              <Link 
                to="/politicas-de-privacidade" 
                className="hover:text-civeni-red transition-colors underline"
              >
                {t('footer.privacyPolicy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
