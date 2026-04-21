"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
    Activity,
    Brain,
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    DollarSign,
    Users,
    Clock,
    BarChart3,
    PieChart,
    ArrowRight,
    Loader2,
    Utensils,
    XCircle,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { Card, Button, authFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";
import { DateRangePicker, type DateRange } from "@/components/admin/DateRangePicker";

// Fetcher for SWR
async function fetcher<T>(url: string): Promise<T> {
    const res = await authFetch(url);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API error ${res.status}`);
    }
    return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────

interface AnalyticsStats {
    totalProducts: number;
    activeProducts: number;
    productsWithoutImages: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    cancelRate: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgPrice: number;
    thisWeekRevenue: number;
    prevWeekRevenue: number;
    revenueGrowth: number;
    recentOrdersCount: number;
    peakHour: string | null;
    bestSellers: { name: string; qty: number; revenue: number }[];
    ordersByDay: Record<string, number>;
    ordersByHour: Record<string, number>;
    deliveryBreakdown: Record<string, number>;
    ordersByStatus: Record<string, number>;
    dailyRevenue: { date: string; revenue: number }[];
    totalCategories: number;
    activeCategories: number;
}

// ── Sub-navigation ───────────────────────────────────────────────────────

const TABS = [
    { href: "/dashboard/analytics", label: "Vue d'ensemble", icon: Activity },
    { href: "/dashboard/analytics/advisor", label: "Conseiller IA", icon: Brain, premium: true },
];

function AnalyticsNav() {
    const pathname = usePathname();
    return (
        <nav className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl mb-6 w-fit">
            {TABS.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            isActive
                                ? "bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm"
                                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        )}
                    >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                        {tab.premium && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                                IA
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

// ── Helper components ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "text-brand-500", bgColor = "bg-brand-50 dark:bg-brand-900/20" }: {
    icon: any; label: string; value: string | number; sub?: string; color?: string; bgColor?: string;
}) {
    return (
        <Card>
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={22} className={color} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-surface-400 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-0.5">{value}</p>
                    {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
                </div>
            </div>
        </Card>
    );
}

function BarChartSimple({ data, label }: { data: { key: string; value: number }[]; label: string }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">{label}</h4>
            <div className="flex items-end gap-1.5 h-36">
                {data.map((d) => (
                    <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        {d.value > 0 && (
                            <span className="text-[10px] text-surface-400 font-medium">{d.value}</span>
                        )}
                        <div className="w-full flex justify-center" style={{ height: "100px" }}>
                            <div
                                className="w-full max-w-[32px] rounded-t-md bg-brand-500/80 hover:bg-brand-500 transition-colors"
                                style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-surface-400 whitespace-nowrap">{d.key}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HorizontalBar({ items, colorClass = "bg-brand-500" }: { items: { label: string; value: number; sub?: string }[]; colorClass?: string }) {
    const max = Math.max(...items.map(i => i.value), 1);
    return (
        <div className="space-y-3">
            {items.map((item, idx) => (
                <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-surface-700 dark:text-surface-300 truncate flex-1">{item.label}</span>
                        <span className="text-sm font-bold text-surface-900 dark:text-white ml-2">{item.value}</span>
                        {item.sub && <span className="text-xs text-surface-400 ml-1">{item.sub}</span>}
                    </div>
                    <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${colorClass} rounded-full transition-all`}
                            style={{ width: `${(item.value / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Status labels ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-amber-500" },
    confirmed: { label: "Confirmee", color: "bg-blue-500" },
    preparing: { label: "En preparation", color: "bg-indigo-500" },
    ready: { label: "Prete", color: "bg-cyan-500" },
    delivering: { label: "En livraison", color: "bg-orange-500" },
    delivered: { label: "Livree", color: "bg-green-500" },
    completed: { label: "Completee", color: "bg-emerald-500" },
    cancelled: { label: "Annulee", color: "bg-red-500" },
};

const DELIVERY_LABELS: Record<string, string> = {
    delivery: "Livraison",
    pickup: "A emporter",
    dine_in: "Sur place",
    unknown: "Non specifie",
};

// ── Main page ────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

    // Build API URL with date range params
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);
        const query = params.toString();
        return `/api/analytics/stats${query ? `?${query}` : ""}`;
    }, [dateRange]);

    const { data: stats, error, isLoading, mutate } = useSWR<AnalyticsStats>(
        apiUrl,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute dedup
        }
    );

    // Derived data for charts
    const ordersByDayData = useMemo(() => {
        if (!stats?.ordersByDay) return [];
        const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        return days.map(d => ({ key: d, value: stats.ordersByDay[d] ?? 0 }));
    }, [stats]);

    const ordersByHourData = useMemo(() => {
        if (!stats?.ordersByHour) return [];
        // Show hours 8h-23h
        return Array.from({ length: 16 }, (_, i) => i + 8).map(h => ({
            key: `${h}h`,
            value: stats.ordersByHour[String(h)] ?? 0,
        }));
    }, [stats]);

    const revenueChartData = useMemo(() => {
        if (!stats?.dailyRevenue) return [];
        return stats.dailyRevenue.slice(-14).map(d => ({
            key: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }).replace(".", ""),
            value: d.revenue,
        }));
    }, [stats]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AnalyticsNav />
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-surface-400" />
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="space-y-6">
                <AnalyticsNav />
                <div className="text-center py-20">
                    <XCircle size={40} className="mx-auto text-red-400 mb-4" />
                    <p className="text-surface-500">{error?.message ?? "Impossible de charger les donnees"}</p>
                    <Button variant="outline" onClick={() => mutate()} className="mt-4">
                        Reessayer
                    </Button>
                </div>
            </div>
        );
    }

    const formatCFA = (n: number | null | undefined) =>
        `${(n ?? 0).toLocaleString("fr-FR")} FCFA`;

    return (
        <div className="space-y-6">
            {/* Header + Nav */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
                        <Activity size={20} className="text-white" />
                    </div>
                    Analytiques
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Performances, tendances et insights de votre restaurant
                </p>
            </div>

            <AnalyticsNav />

            {/* Date Range Filter */}
            <Card className="p-4">
                <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onChange={setDateRange}
                    label="Période d'analyse"
                />
            </Card>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="Chiffre d'affaires"
                    value={formatCFA(stats.totalRevenue)}
                    sub={`Panier moyen: ${formatCFA(stats.avgOrderValue)}`}
                    color="text-emerald-500"
                    bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Commandes"
                    value={stats.totalOrders}
                    sub={`${stats.completedOrders} completees, ${stats.cancelledOrders} annulees`}
                    color="text-blue-500"
                    bgColor="bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    icon={Utensils}
                    label="Produits actifs"
                    value={`${stats.activeProducts} / ${stats.totalProducts}`}
                    sub={stats.productsWithoutImages > 0 ? `${stats.productsWithoutImages} sans photo` : "Tous ont une photo"}
                    color="text-orange-500"
                    bgColor="bg-orange-50 dark:bg-orange-900/20"
                />
                <StatCard
                    icon={stats.revenueGrowth >= 0 ? TrendingUp : TrendingDown}
                    label="Tendance semaine"
                    value={`${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth}%`}
                    sub={`${formatCFA(stats.thisWeekRevenue)} vs ${formatCFA(stats.prevWeekRevenue)}`}
                    color={stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}
                    bgColor={stats.revenueGrowth >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}
                />
            </div>

            {/* Charts Row 1: Revenue + Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={16} className="text-brand-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Revenus (14 derniers jours)</h3>
                    </div>
                    <BarChartSimple
                        data={revenueChartData}
                        label=""
                    />
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-amber-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Heure de pointe</h3>
                    </div>
                    <div className="text-center py-4">
                        <p className="text-4xl font-black text-surface-900 dark:text-white">
                            {stats.peakHour ?? "N/A"}
                        </p>
                        <p className="text-sm text-surface-400 mt-2">Heure la plus active</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-surface-500">Taux d'annulation</span>
                            <span className={cn(
                                "font-bold",
                                stats.cancelRate > 15 ? "text-red-500" : stats.cancelRate > 5 ? "text-amber-500" : "text-green-500"
                            )}>
                                {stats.cancelRate}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-surface-500">Cette semaine</span>
                            <span className="font-bold text-surface-900 dark:text-white">
                                {stats.recentOrdersCount} commandes
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-surface-500">Prix moyen menu</span>
                            <span className="font-bold text-surface-900 dark:text-white">
                                {formatCFA(stats.avgPrice)}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row 2: Orders by day + Best sellers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-2 mb-2">
                        <PieChart size={16} className="text-indigo-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Commandes par jour</h3>
                    </div>
                    <BarChartSimple data={ordersByDayData} label="" />
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-purple-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Best-sellers</h3>
                    </div>
                    {(stats.bestSellers ?? []).length > 0 ? (
                        <HorizontalBar
                            items={(stats.bestSellers ?? []).map(b => ({
                                label: b.name,
                                value: b.qty,
                                sub: `(${formatCFA(b.revenue)})`,
                            }))}
                            colorClass="bg-purple-500"
                        />
                    ) : (
                        <p className="text-sm text-surface-400 italic text-center py-8">Pas assez de donnees de ventes</p>
                    )}
                </Card>
            </div>

            {/* Charts Row 3: Peak hours + Status + Delivery */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-cyan-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Heures de commande</h3>
                    </div>
                    <BarChartSimple data={ordersByHourData} label="" />
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Par statut</h3>
                    </div>
                    <div className="space-y-2.5">
                        {Object.entries(stats.ordersByStatus ?? {}).map(([status, count]) => {
                            const conf = STATUS_LABELS[status] ?? { label: status, color: "bg-surface-400" };
                            const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;
                            return (
                                <div key={status} className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${conf.color} flex-shrink-0`} />
                                    <span className="text-sm text-surface-600 dark:text-surface-400 flex-1">{conf.label}</span>
                                    <span className="text-sm font-bold text-surface-900 dark:text-white">{count}</span>
                                    <span className="text-xs text-surface-400 w-10 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag size={16} className="text-orange-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-white">Mode de commande</h3>
                    </div>
                    <div className="space-y-2.5">
                        {Object.entries(stats.deliveryBreakdown ?? {}).map(([method, count]) => {
                            const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;
                            return (
                                <div key={method} className="flex items-center gap-3">
                                    <span className="text-sm text-surface-600 dark:text-surface-400 flex-1">
                                        {DELIVERY_LABELS[method] ?? method}
                                    </span>
                                    <span className="text-sm font-bold text-surface-900 dark:text-white">{count}</span>
                                    <span className="text-xs text-surface-400 w-10 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                        {Object.keys(stats.deliveryBreakdown ?? {}).length === 0 && (
                            <p className="text-sm text-surface-400 italic text-center py-4">Aucune donnee</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* AI Advisor CTA */}
            <Link
                href="/dashboard/analytics/advisor"
                className="flex items-center justify-between p-6 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/20 hover:shadow-lg transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Brain size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-white">Conseiller IA</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Obtenez des recommandations personnalisees basees sur vos donnees
                        </p>
                    </div>
                </div>
                <ArrowRight size={24} className="text-surface-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </Link>
        </div>
    );
}
