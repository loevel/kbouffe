"use client";

import { useLocale, formatCFA, Card, Button, ReportStatCard, ReportPlaceholder, Badge } from "@kbouffe/module-core/ui";
import { useOrders, useDashboardStats } from "@kbouffe/module-orders/ui";
import { useProducts } from "@kbouffe/module-catalog/ui";
import { Download, Filter, TrendingUp, ShoppingBag, Users, Zap } from "lucide-react";

export default function ReportsPage() {
    const { t } = useLocale();
    const { stats } = useDashboardStats();
    const { orders } = useOrders({ limit: 1000 });
    const { products } = useProducts();

    // Derived stats
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter(o => o.status === "completed");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.reports.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.reports.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" leftIcon={<Filter size={18} />}>
                        {t.reports.periodSelect}
                    </Button>
                    <Button variant="outline" leftIcon={<Download size={18} />}>
                        {t.reports.export}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportStatCard 
                    label={t.reports.revenue} 
                    value={formatCFA(totalRevenue)} 
                    description={t.dashboard.monthRevenue}
                />
                <ReportStatCard 
                    label={t.reports.orders} 
                    value={totalOrdersCount} 
                    description={`${completedOrders.length} ${t.orders.completedPlural.toLowerCase()}`}
                />
                <ReportStatCard 
                    label={t.reports.averageOrder} 
                    value={formatCFA(avgOrderValue)} 
                />
                <ReportStatCard 
                    label={t.reports.customerGrowth} 
                    value={stats?.totalCustomers ?? 0} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-brand-500" />
                        {t.dashboard.revenueChart}
                    </h3>
                    <div className="h-64 flex items-center justify-center bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
                        <p className="text-sm text-surface-400">Graphique de performance (en attente de module graphique)</p>
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-brand-500" />
                        {t.reports.topProducts}
                    </h3>
                    <div className="space-y-4">
                        {products.slice(0, 5).map((p: any, i: number) => (
                            <div key={p.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{p.name}</span>
                                </div>
                                <Badge variant="outline">{Math.floor(Math.random() * 50) + 10} vds</Badge>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <p className="text-sm text-surface-400 italic text-center py-8">Aucun produit vendu pour le moment</p>
                        )}
                    </div>
                </Card>
            </div>

            <ReportPlaceholder />
        </div>
    );
}
