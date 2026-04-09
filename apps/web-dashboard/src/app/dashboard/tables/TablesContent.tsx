"use client";

import { useLocale } from "@kbouffe/module-core/ui";
import { TablesManager } from "@/components/dashboard/tables/TablesManager";
import { OperatorBar } from "@/components/pos/OperatorBar";

export default function TablesPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.tables.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.tables.subtitle}</p>
            </div>

            {/* PDV operator identification bar */}
            <div className="mb-4">
                <OperatorBar />
            </div>

            <TablesManager />
        </>
    );
}
