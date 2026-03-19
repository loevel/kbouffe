"use client";

import { KpiCards } from "@/components/dashboard/overview/KpiCards";
import { RevenueChart } from "@/components/dashboard/overview/RevenueChart";
import { RecentOrders } from "@/components/dashboard/overview/RecentOrders";
import { PopularProducts } from "@/components/dashboard/overview/PopularProducts";
import { QuickActions } from "@/components/dashboard/overview/QuickActions";
import { OperationalAlerts } from "@/components/dashboard/overview/OperationalAlerts";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

export default function DashboardPage() {
    const { user, loading } = useDashboard();
    const { t } = useLocale();

    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {t.dashboard.greeting}{loading ? "..." : user?.full_name ?? ""}
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    {t.dashboard.overviewSubtitle}
                </p>
            </div>

            <div className="space-y-6">
                <OperationalAlerts />
                <QuickActions />
                <KpiCards />
                <RevenueChart />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentOrders />
                    <PopularProducts />
                </div>
            </div>
        </>
    );
}
