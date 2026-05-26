'use client';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('ka') ? 'ka' : 'en';

  function toggle() {
    const next = current === 'en' ? 'ka' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('mesa-lang', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.3rem 0.625rem',
        fontSize: '0.8125rem',
        fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        border: '1px solid rgba(196,65,12,0.25)',
        borderRadius: '6px',
        cursor: 'pointer',
        background: 'transparent',
        color: '#c4410c',
        transition: 'all 0.15s',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#fef2ec';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <span style={{ opacity: current === 'en' ? 1 : 0.45 }}>EN</span>
      <span style={{ opacity: 0.35, fontSize: '0.7rem' }}>|</span>
      <span style={{ opacity: current === 'ka' ? 1 : 0.45 }}>KA</span>
    </button>
  );
}
