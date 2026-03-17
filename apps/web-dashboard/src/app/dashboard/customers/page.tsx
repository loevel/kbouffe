"use client";

import { CustomersTable, CustomersStats } from "@kbouffe/module-crm/ui";
import { useLocale } from "@/contexts/locale-context";

export default function CustomersPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.customers.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.customers.subtitle}</p>
            </div>
            <CustomersStats />
            <CustomersTable />
        </>
    );
}
