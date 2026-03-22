"use client";

import { useMemo, useState } from "react";
import { useLocale, formatCFA, Card, Button, ReportStatCard, Badge } from "@kbouffe/module-core/ui";
import { useOrders, useDashboardStats } from "@kbouffe/module-orders/ui";
import { Download, TrendingUp, Zap } from "lucide-react";

type ReportPeriod = "7d" | "30d" | "90d";

type ParsedOrderItem = {
    name: string;
    quantity: number;
};

function getDayLabel(date: Date) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
}

function parseOrderItems(items: unknown): ParsedOrderItem[] {
    if (!Array.isArray(items)) return [];

    return items
        .map((entry): ParsedOrderItem | null => {
            if (!entry || typeof entry !== "object") return null;
            const item = entry as Record<string, unknown>;
            const name =
                typeof item.name === "string"
                    ? item.name
                    : typeof item.productName === "string"
                        ? item.productName
                        : "Produit";
            const rawQty = Number(item.quantity ?? 1);
            const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
            return { name, quantity };
        })
        .filter((item): item is ParsedOrderItem => item !== null);
}

function toCsvValue(value: string | number) {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
}

export default function ReportsPage() {
    const { t } = useLocale();
    const { stats } = useDashboardStats();
    const { orders } = useOrders({ limit: 1000 });
    const [period, setPeriod] = useState<ReportPeriod>("30d");

    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoffDate = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (periodDays - 1));
        return date;
    }, [periodDays]);

    const filteredOrders = useMemo(
        () => orders.filter((order) => new Date(order.created_at) >= cutoffDate),
        [orders, cutoffDate],
    );

    const completedOrders = useMemo(
        () => filteredOrders.filter((order) => order.status === "completed"),
        [filteredOrders],
    );

    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    const weeklySeries = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(now);
            date.setDate(now.getDate() - (6 - index));
            return {
                key: date.toISOString().slice(0, 10),
                label: getDayLabel(date),
                value: 0,
            };
        });

        const dayMap = new Map(days.map((day) => [day.key, day]));

        completedOrders.forEach((order) => {
            const key = new Date(order.created_at).toISOString().slice(0, 10);
            const bucket = dayMap.get(key);
            if (bucket) bucket.value += order.total ?? 0;
        });

        const max = Math.max(...days.map((day) => day.value), 1);
        return days.map((day) => ({
            ...day,
            heightPercent: Math.max(8, Math.round((day.value / max) * 100)),
        }));
    }, [completedOrders]);

    const topProducts = useMemo(() => {
        const counters = new Map<string, number>();

        completedOrders.forEach((order) => {
            const parsedItems = parseOrderItems(order.items);
            parsedItems.forEach((item) => {
                counters.set(item.name, (counters.get(item.name) ?? 0) + item.quantity);
            });
        });

        return Array.from(counters.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [completedOrders]);

    const handleExport = () => {
        const header = ["Date", "Commande", "Statut", "Client", "Total (FCFA)"];
        const rows = filteredOrders.map((order) => [
            new Date(order.created_at).toLocaleString("fr-FR"),
            order.id,
            order.status,
            order.customer_name,
            order.total ?? 0,
        ]);

        const csv = [header, ...rows]
            .map((row) => row.map((value) => toCsvValue(value)).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `rapports-${period}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.reports.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.reports.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-1">
                        {([
                            { id: "7d", label: "7j" },
                            { id: "30d", label: "30j" },
                            { id: "90d", label: "90j" },
                        ] as const).map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => setPeriod(entry.id)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                    period === entry.id
                                        ? "bg-brand-500 text-white"
                                        : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                                }`}
                                aria-label={`${t.reports.periodSelect} ${entry.label}`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" leftIcon={<Download size={18} />} onClick={handleExport}>
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
                    <div className="h-64 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                        <div className="h-full grid grid-cols-7 items-end gap-2">
                            {weeklySeries.map((point) => (
                                <div key={point.key} className="h-full flex flex-col justify-end items-center gap-2">
                                    <div className="text-[10px] text-surface-400 dark:text-surface-500 leading-none">
                                        {point.value > 0 ? `${Math.round(point.value / 1000)}k` : "0"}
                                    </div>
                                    <div className="w-full flex justify-center">
                                        <div
                                            className="w-7 rounded-t-md bg-brand-500/80 hover:bg-brand-500 transition-colors"
                                            style={{ height: `${point.heightPercent}%` }}
                                            title={`${point.label} : ${formatCFA(point.value)}`}
                                        />
                                    </div>
                                    <div className="text-xs text-surface-500 dark:text-surface-400">{point.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-brand-500" />
                        {t.reports.topProducts}
                    </h3>
                    <div className="space-y-4">
                        {topProducts.map((product, i) => (
                            <div key={`${product.name}-${i}`} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{product.name}</span>
                                </div>
                                <Badge variant="outline">{product.quantity} vds</Badge>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <p className="text-sm text-surface-400 italic text-center py-8">Aucun produit vendu pour le moment</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
