"use client";

import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { formatCFA } from "@/lib/format";
import { useLocale } from "@/contexts/locale-context";
import { useDashboardStats } from "@/hooks/use-data";

export function KpiCards() {
    const { t } = useLocale();
    const { stats, isLoading } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} padding="md">
                        <div className="animate-pulse space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-surface-200 dark:bg-surface-700" />
                            <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-24" />
                            <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded w-32" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    const kpis = [
        {
            label: t.dashboard.todayRevenue,
            value: formatCFA(stats.revenue.today),
            icon: DollarSign,
            trend: null as string | null,
            trendUp: true,
            sub: `${formatCFA(stats.revenue.week)} ${t.dashboard.thisWeek}`,
        },
        {
            label: t.dashboard.ordersLabel,
            value: `${stats.orders.today} ${t.dashboard.today}`,
            icon: ShoppingBag,
            trend: null,
            trendUp: false,
            sub: `${stats.orders.pending} ${t.dashboard.pending}`,
            subWarning: stats.orders.pending > 0,
        },
        {
            label: t.dashboard.averageOrder,
            value: formatCFA(stats.averageOrderValue),
            icon: TrendingUp,
            trend: null,
            trendUp: true,
            sub: t.dashboard.thisWeek,
        },
        {
            label: t.dashboard.totalCustomers,
            value: `${stats.totalCustomers}`,
            icon: Users,
            trend: null,
            trendUp: true,
            sub: t.dashboard.thisWeek,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
                <Card key={i} padding="md">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                            <kpi.icon className="h-6 w-6 text-brand-500" />
                        </div>
                        {kpi.trend && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.trendUp ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                                {kpi.trend}
                            </span>
                        )}
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-bold text-surface-900 dark:text-white">{kpi.value}</p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{kpi.label}</p>
                    </div>
                    {kpi.sub && (
                        <p className={`text-xs mt-2 ${kpi.subWarning ? "text-amber-600 dark:text-amber-400 font-medium" : "text-surface-400"}`}>
                            {kpi.subWarning && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 align-middle" />}
                            {kpi.sub}
                        </p>
                    )}
                </Card>
            ))}
        </div>
    );
}
