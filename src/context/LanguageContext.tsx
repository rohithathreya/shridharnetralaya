import React, { createContext, useContext, useEffect, useState } from 'react';

export type SiteLang = 'en' | 'kn';

interface LanguageContextValue {
  lang: SiteLang;
  setLang: (next: SiteLang) => void;
  toggleLang: () => void;
}

const STORAGE_KEY = 'sn_site_lang_v1';
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SiteLang>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'kn' ? 'kn' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('lang-kn', lang === 'kn');
  }, [lang]);

  function setLang(next: SiteLang) {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'kn' : 'en');
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
