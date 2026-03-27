"use client";

import { StorePreview } from "@/components/dashboard/store/StorePreview";
import { ShareLinks } from "@/components/dashboard/store/ShareLinks";
import { StoreControls } from "@/components/dashboard/store/StoreControls";
import { StoreReadiness } from "@/components/dashboard/store/StoreReadiness";
import { useLocale } from "@kbouffe/module-core/ui";

export default function StorePage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.store.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.store.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <StorePreview />
                    <StoreReadiness />
                </div>
                <div className="space-y-6">
                    <StoreControls />
                    <ShareLinks />
                </div>
            </div>
        </>
    );
}
