'use client';
import '@/lib/i18n';
import i18n from 'i18next';
import { useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'mesa-lang';

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Sync html[lang] whenever language changes
    const sync = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', sync);

    // Apply saved preference, or detect via IP on first visit.
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (saved !== i18n.language) i18n.changeLanguage(saved);
      else sync(i18n.language);
    } else {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then((data: { country_code?: string }) => {
          const lang = data.country_code === 'GE' ? 'ka' : 'en';
          localStorage.setItem(STORAGE_KEY, lang);
          i18n.changeLanguage(lang);
        })
        .catch(() => {
          sync(i18n.language);
        });
    }

    return () => { i18n.off('languageChanged', sync); };
  }, []);

  return <>{children}</>;
}
