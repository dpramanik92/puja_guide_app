import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "../i18n";

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language as Language;

  const toggleLanguage = useCallback(() => {
    const next = currentLang === "en" ? "bn" : "en";
    i18n.changeLanguage(next);
  }, [currentLang, i18n]);

  const setLanguage = useCallback(
    (lang: Language) => {
      i18n.changeLanguage(lang);
    },
    [i18n]
  );

  return { currentLang, toggleLanguage, setLanguage };
}
