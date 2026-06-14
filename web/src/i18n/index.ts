import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import bn from "./bn.json";

export const LANGUAGES = {
  en: { label: "English", nativeLabel: "English" },
  bn: { label: "Bengali", nativeLabel: "বাংলা" },
} as const;

export type Language = keyof typeof LANGUAGES;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
