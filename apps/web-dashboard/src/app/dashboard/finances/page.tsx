"use client";

import { FinanceSummaryCards } from "@/components/dashboard/finances/FinanceSummaryCards";
import { TransactionsTable } from "@/components/dashboard/finances/TransactionsTable";
import { PayoutsList } from "@kbouffe/module-hr/ui";
import { useLocale } from "@kbouffe/module-core/ui";

export default function FinancesPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.finances.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.finances.subtitle}</p>
            </div>
            <div className="space-y-6">
                <FinanceSummaryCards />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <TransactionsTable />
                    </div>
                    <PayoutsList />
                </div>
            </div>
        </>
    );
}
