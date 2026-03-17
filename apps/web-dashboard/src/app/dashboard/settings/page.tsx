"use client";

import { SettingsNav } from "@/components/dashboard/settings/SettingsNav";
import { RestaurantInfoForm } from "@/components/dashboard/settings/RestaurantInfoForm";
import { useLocale } from "@/contexts/locale-context";

export default function SettingsPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.settings.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.settings.subtitle}</p>
            </div>
            <SettingsNav />
            <RestaurantInfoForm />
        </>
    );
}
