import { fr, type TranslationKeys } from "./fr";
import { en } from "./en";

export type Locale = "fr" | "en";

export const translations: Record<Locale, TranslationKeys> = { fr, en };

export const localeLabels: Record<Locale, string> = {
    fr: "Francais",
    en: "English",
};

export type { TranslationKeys };
