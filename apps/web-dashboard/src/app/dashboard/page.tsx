"use client";

import Link from "next/link";
import { Brain, ArrowRight } from "lucide-react";
import { KpiCards } from "@/components/dashboard/overview/KpiCards";
import { BadgeStrip } from "@/components/dashboard/overview/BadgeStrip";
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

                {/* AI Advisor Banner */}
                <Link
                    href="/dashboard/analytics/advisor"
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/20 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <Brain size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-surface-900 dark:text-white">Conseiller IA</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                Analysez votre restaurant et recevez des conseils personnalises par l'IA
                            </p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-surface-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <KpiCards />
                <BadgeStrip />
                <RevenueChart />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentOrders />
                    <PopularProducts />
                </div>
            </div>
        </>
    );
}
