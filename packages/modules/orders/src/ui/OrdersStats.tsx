"use client";

import { ClipboardList, CircleDashed, Wallet, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/locale-context";
import { useDashboardStats } from "@/hooks/use-data";
import { formatCFA } from "@/lib/format";

export function OrdersStats() {
    const { t } = useLocale();
    const { stats, isLoading } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4">
                        <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24" />
                            <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-12" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    const activeCount = stats.orders.pending;
    const completionRate = stats.orders.total > 0
        ? Math.round(((stats.orders.total - stats.orders.pending) / stats.orders.total) * 100)
        : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.orders.statsTodayOrders}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats.orders.today}</p>
                    </div>
                    <ClipboardList className="text-brand-500" size={20} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.orders.statsActiveOrders}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{activeCount}</p>
                    </div>
                    <CircleDashed className="text-amber-500" size={20} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.orders.statsTodayRevenue}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{formatCFA(stats.revenue.today)}</p>
                    </div>
                    <Wallet className="text-emerald-500" size={20} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t.orders.statsCompletionRate}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{completionRate}%</p>
                    </div>
                    <CheckCircle2 className="text-blue-500" size={20} />
                </div>
            </Card>
        </div>
    );
}
