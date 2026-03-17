"use client";

import { ordersUi } from "@kbouffe/module-orders";
const { OrdersTable, OrdersStats } = ordersUi;
import { useLocale } from "@/contexts/locale-context";

export default function OrdersPage() {
    const { t } = useLocale();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.orders.title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{t.orders.subtitle}</p>
            </div>
            <OrdersStats />
            <OrdersTable />
        </>
    );
}
