"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { translations, type Locale, type TranslationKeys } from "../i18n";

interface LocaleContextValue {
    locale: Locale;
    t: TranslationKeys;
    setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
    locale: "fr",
    t: translations.fr,
    setLocale: () => { },
});

export function useLocale() {
    return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("fr");

    useEffect(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem("kbouffe-locale") as Locale | null : null;
        if (stored && (stored === "fr" || stored === "en")) {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        if (typeof window !== "undefined") {
            localStorage.setItem("kbouffe-locale", l);
            document.documentElement.lang = l;
        }
    }, []);

    const t = translations[locale];

    return (
        <LocaleContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </LocaleContext.Provider>
    );
}
