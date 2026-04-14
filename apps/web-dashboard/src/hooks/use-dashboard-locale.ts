"use client";

import { useLocale } from "@kbouffe/module-core/ui";
import { translations } from "@/lib/i18n";

export function useDashboardLocale() {
    const { locale } = useLocale();
    const t = translations[locale as "fr" | "en"];

    return { locale, t };
}
