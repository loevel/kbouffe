"use client";

import { MarketingStats, CouponsTable, CampaignsTable } from "@kbouffe/module-marketing";
import { useLocale } from "@kbouffe/module-core/ui";

export default function MarketingPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {t.marketing.title}
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    {t.marketing.subtitle}
                </p>
            </div>

            <div className="space-y-6">
                <MarketingStats />
                <CouponsTable />
                <CampaignsTable />
            </div>
        </>
    );
}
