import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Language } from './translations';
import { translations, setCurrentLanguage } from './translations';
import { LanguageContext } from './languageContextValue';

const LANGUAGE_KEY = 'poker-timer-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'de';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    setCurrentLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  // Sync on mount
  useEffect(() => {
    setCurrentLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text: string = (translations[language] as Record<string, string>)[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
