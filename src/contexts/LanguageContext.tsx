'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, languageNames } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  languageNames: typeof languageNames;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read from localStorage on mount
    const stored = localStorage.getItem('language') as Language | null;
    if (stored && (stored === 'en' || stored === 'es' || stored === 'fr' || stored === 'pt' || stored === 'ar')) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem('language', lang);
    }
  };

  // Always provide the context, but use default language until mounted
  const currentLanguage = mounted ? language : 'en';

  return (
    <LanguageContext.Provider
      value={{
        language: currentLanguage,
        setLanguage,
        t: translations[currentLanguage],
        languageNames,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
