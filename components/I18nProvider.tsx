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

    // Apply the saved language preference after hydration.
    // Done inside useEffect so the initial server/client render both produce
    // English HTML, eliminating the hydration mismatch.
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    } else {
      sync(i18n.language);
    }

    return () => { i18n.off('languageChanged', sync); };
  }, []);

  return <>{children}</>;
}
