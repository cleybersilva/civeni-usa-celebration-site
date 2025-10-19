
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './locales';

console.log('🌍 Initializing i18n...');
console.log('📦 Resources loaded:', Object.keys(resources));
console.log('🇧🇷 PT translations:', resources.pt);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    lng: 'pt',
    debug: true,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  }).then(() => {
    console.log('✅ i18n initialized successfully');
    console.log('🔤 Current language:', i18n.language);
    console.log('📝 Test translation:', i18n.t('transmission.title'));
  });

export default i18n;
