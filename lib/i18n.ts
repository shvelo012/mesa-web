import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import ka from '@/locales/ka.json';

// Always initialise with English so that server-rendered HTML matches the
// initial client render (no hydration mismatch). The I18nProvider reads
// localStorage after hydration and calls changeLanguage() if needed.
i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ka: { translation: ka } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
