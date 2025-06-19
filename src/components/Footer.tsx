
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, Facebook, Youtube, Lock } from 'lucide-react';
import { useCMS } from '@/contexts/CMSContext';

const Footer = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  
  const quickLinks = [
    { name: t('footer.about'), href: '#about' },
    { name: t('footer.schedule'), href: '#schedule' },
    { name: t('footer.speakers'), href: '#speakers' },
    { name: t('footer.registration'), href: '#registration' },
    { name: t('footer.contact'), href: '#contact' }
  ];

  return (
    <footer className="bg-civeni-blue text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-3xl font-bold mb-4 font-poppins">
              III CIVENI <span className="text-civeni-red">2025</span>
            </div>
            <p className="text-lg opacity-90 mb-6 leading-relaxed">
              III International Multidisciplinary Congress of VCCU<br/>
              December 8-10, 2025 • Celebration, Florida
            </p>
            <div className="flex items-center space-x-4 mb-4">
              <a 
                href="https://www.instagram.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://www.facebook.com/veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Facebook size={24} />
              </a>
              <a 
                href="https://www.youtube.com/@veniuniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-civeni-red transition-colors transform hover:scale-110"
              >
                <Youtube size={24} />
              </a>
            </div>
            <div className="mt-4">
              <a 
                href="/admin" 
                className="inline-flex items-center space-x-2 bg-civeni-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors transform hover:scale-105"
              >
                <Lock size={16} />
                <span className="text-sm font-medium">{t('header.adminArea')}</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 font-poppins">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="opacity-90 hover:opacity-100 hover:text-civeni-red transition-all duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 font-poppins">{t('footer.contactInfo')}</h3>
            <div className="space-y-3 opacity-90">
              <p>📧 contact@civeni.com</p>
              <p>📞 {content.siteTexts.contactPhone}</p>
              <p>📍 Celebration, FL 34747</p>
              <p>🌐 www.civeni.com</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-20 mt-12 pt-8 text-center">
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="text-sm opacity-75">
              {content.siteTexts.footerCopyright || t('footer.copyright')}
            </div>
            <div className="text-sm opacity-75">
              Organized by VCCU: Veni Creator Christian University
            </div>
            <div className="text-sm opacity-75">
              {content.siteTexts.institutionalLink ? (
                <a 
                  href={content.siteTexts.institutionalLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-civeni-red transition-colors"
                >
                  {t('footer.privacyPolicy')}
                </a>
              ) : (
                t('footer.privacyPolicy')
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
