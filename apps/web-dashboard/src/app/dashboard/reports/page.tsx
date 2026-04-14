"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useLocale, formatCFA, Card, Button, ReportStatCard, Badge } from "@kbouffe/module-core/ui";
import { useOrders, useDashboardStats } from "@kbouffe/module-orders/ui";
import { useProducts, useCategories } from "@/hooks/use-data";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import {
    Download,
    TrendingUp,
    Zap,
    FileSpreadsheet,
    FileText,
    ChevronDown,
    ShoppingBag,
    DollarSign,
    BarChart3,
    Package,
    XCircle,
    CheckCircle2,
    Clock,
    Truck,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

type ReportPeriod = "7d" | "30d" | "90d";

type ParsedOrderItem = {
    name: string;
    quantity: number;
    unitPrice: number;
};

// ── Composants locaux ────────────────────────────────────────────────────────

function ReportsSkeleton() {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 bg-white dark:bg-surface-900">
                        <div className="animate-pulse space-y-3">
                            <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-20" />
                            <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-24" />
                            <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded w-32" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32" />
                        <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded" />
                    </div>
                </Card>
                <Card>
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" />
                        ))}
                    </div>
                </Card>
            </div>

            {/* Top Products */}
            <Card>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 bg-surface-100 dark:bg-surface-800 rounded w-full" />
                    ))}
                </div>
            </Card>
        </div>
    );
}

type TrendCardProps = {
    label: string;
    value: string | number;
    description?: string;
    delta: number | null;
};

function TrendCard({ label, value, description, delta }: TrendCardProps) {
    const isPositive = delta !== null && delta >= 0;
    const color = delta === null ? "text-surface-400" : isPositive ? "text-emerald-500" : "text-red-500";
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const trendText = delta !== null
        ? `${isPositive ? "+" : ""}${delta.toFixed(0)}% vs période préc.`
        : description;

    return (
        <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 bg-white dark:bg-surface-900 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 font-semibold">{label}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{value}</p>
            {trendText && (
                <p className={`text-xs mt-2 flex items-center gap-1 ${color}`}>
                    {delta !== null && <Icon size={12} className="flex-shrink-0" />}
                    {trendText}
                </p>
            )}
        </div>
    );
}

// ── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({
    active,
    payload,
    label,
    valueFormatter,
}: {
    active?: boolean;
    payload?: any[];
    label?: string;
    valueFormatter?: (value: number) => string;
}) {
    if (!active || !payload || !payload[0]) return null;
    const value = payload[0].value as number;
    const formattedValue = valueFormatter ? valueFormatter(value) : String(value);

    return (
        <div className="bg-surface-800 dark:bg-surface-900 border border-surface-700 dark:border-surface-600 rounded-lg px-3 py-2 shadow-xl">
            {label && <p className="text-xs text-surface-400 mb-0.5">{label}</p>}
            <p className="text-sm font-bold text-white">{formattedValue}</p>
        </div>
    );
}

// ── Utilitaires ──────────────────────────────────────────────────────────────

function getDayLabel(date: Date) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
}

function getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNum;
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
                        : typeof item.product_name === "string"
                            ? item.product_name
                            : "Produit";
            const rawQty = Number(item.quantity ?? 1);
            const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
            const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0);
            return { name, quantity, unitPrice };
        })
        .filter((item): item is ParsedOrderItem => item !== null);
}

function toCsvValue(value: string | number) {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
    const csv = [header, ...rows]
        .map((row) => row.map((v) => toCsvValue(v)).join(","))
        .join("\n");
    const bom = "\uFEFF"; // BOM for Excel UTF-8 compat
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Status config
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    pending: { label: "En attente", icon: Clock, color: "text-amber-500" },
    confirmed: { label: "Confirmee", icon: CheckCircle2, color: "text-blue-500" },
    preparing: { label: "En preparation", icon: Package, color: "text-indigo-500" },
    ready: { label: "Prete", icon: CheckCircle2, color: "text-cyan-500" },
    delivering: { label: "En livraison", icon: Truck, color: "text-orange-500" },
    delivered: { label: "Livree", icon: CheckCircle2, color: "text-green-500" },
    completed: { label: "Completee", icon: CheckCircle2, color: "text-emerald-500" },
    cancelled: { label: "Annulee", icon: XCircle, color: "text-red-500" },
};

// Status colors for PieChart
const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    preparing: "#6366f1",
    ready: "#06b6d4",
    delivering: "#f97316",
    delivered: "#22c55e",
    completed: "#10b981",
    cancelled: "#ef4444",
};

export default function ReportsPage() {
    const { t } = useLocale();
    const { stats } = useDashboardStats();
    const { orders, isLoading } = useOrders({ limit: 2000 });
    const { products } = useProducts();
    const { categories } = useCategories();
    const [period, setPeriod] = useState<ReportPeriod>("30d");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportFeedback, setExportFeedback] = useState<string | null>(null);

    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const periodLabel = period === "7d" ? "7 jours" : period === "30d" ? "30 jours" : "90 jours";

    const cutoffDate = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (periodDays - 1));
        return date;
    }, [periodDays]);

    const previousCutoffDate = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (periodDays * 2 - 1));
        return date;
    }, [periodDays]);

    const filteredOrders = useMemo(
        () => orders.filter((order) => new Date(order.created_at) >= cutoffDate),
        [orders, cutoffDate],
    );

    const previousFilteredOrders = useMemo(
        () => orders.filter((order) => {
            const d = new Date(order.created_at);
            return d >= previousCutoffDate && d < cutoffDate;
        }),
        [orders, previousCutoffDate, cutoffDate],
    );

    const completedOrders = useMemo(
        () => filteredOrders.filter((order) => order.status === "completed" || order.status === "delivered"),
        [filteredOrders],
    );

    const previousCompletedOrders = useMemo(
        () => previousFilteredOrders.filter((order) => order.status === "completed" || order.status === "delivered"),
        [previousFilteredOrders],
    );

    const cancelledOrders = useMemo(
        () => filteredOrders.filter((order) => order.status === "cancelled"),
        [filteredOrders],
    );

    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const cancelRate = totalOrdersCount > 0 ? Math.round((cancelledOrders.length / totalOrdersCount) * 100) : 0;

    // ── Trends vs période précédente ──────────────────────────────────────────
    const previousTotalRevenue = previousCompletedOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);
    const previousAvgOrderValue = previousCompletedOrders.length > 0 ? previousTotalRevenue / previousCompletedOrders.length : 0;
    const previousOrderCount = previousFilteredOrders.length;

    const revenueDelta = previousTotalRevenue > 0 ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : null;
    const ordersDelta = previousOrderCount > 0 ? ((totalOrdersCount - previousOrderCount) / previousOrderCount) * 100 : null;
    const avgDelta = previousAvgOrderValue > 0 ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 : null;

    // Revenue chart — adaptive by period
    const chartSeries = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (period === "90d") {
            // Weekly aggregation
            const weekMap = new Map<string, { label: string; value: number; key: string }>();
            completedOrders.forEach((order) => {
                const date = new Date(order.created_at);
                const weekNum = getISOWeekNumber(date);
                const year = date.getFullYear();
                const key = `${year}-W${weekNum}`;
                const existing = weekMap.get(key) || { label: `S${weekMap.size + 1}`, value: 0, key };
                existing.value += order.total ?? 0;
                weekMap.set(key, existing);
            });

            // Create 13-week structure
            const result = Array.from(weekMap.values()).slice(-13);
            if (result.length === 0) {
                result.push({ key: "W1", label: "S1", value: 0 });
            }
            const max = Math.max(...result.map((w) => w.value), 1);
            return result.map((w) => ({
                key: w.key,
                label: w.label,
                value: w.value,
                heightPercent: Math.max(8, Math.round((w.value / max) * 100)),
            }));
        } else {
            // Daily aggregation (7d or 30d)
            const days = Array.from({ length: periodDays }, (_, index) => {
                const date = new Date(now);
                date.setDate(now.getDate() - (periodDays - 1 - index));
                return {
                    key: date.toISOString().slice(0, 10),
                    label: periodDays <= 7 ? getDayLabel(date) : `${date.getDate()}/${date.getMonth() + 1}`,
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
        }
    }, [completedOrders, period, periodDays]);

    // Top products with revenue
    const topProducts = useMemo(() => {
        const counters = new Map<string, { quantity: number; revenue: number }>();
        completedOrders.forEach((order) => {
            const parsedItems = parseOrderItems(order.items);
            parsedItems.forEach((item) => {
                const existing = counters.get(item.name) ?? { quantity: 0, revenue: 0 };
                existing.quantity += item.quantity;
                existing.revenue += item.unitPrice * item.quantity;
                counters.set(item.name, existing);
            });
        });
        return Array.from(counters.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    }, [completedOrders]);

    // ── Peak hours ──────────────────────────────────────────────────────────────
    const peakHours = useMemo(() => {
        const hourSlots = Array.from({ length: 16 }, (_, i) => {
            const hour = 7 + i; // 7h to 22h
            return { hour, count: 0 };
        });
        filteredOrders.forEach((order) => {
            const h = new Date(order.created_at).getHours();
            if (h >= 7 && h < 23) {
                const slot = hourSlots.find((s) => s.hour === h);
                if (slot) slot.count++;
            }
        });
        return hourSlots.filter((s) => s.count > 0);
    }, [filteredOrders]);

    // ── Revenue by category ──────────────────────────────────────────────────────
    const revenueByCategory = useMemo(() => {
        const catMap = new Map((categories as any[]).map((c) => [c.id, c.name]));
        const productMap = new Map((products as any[]).map((p) => [p.name, catMap.get(p.category_id) ?? "Autres"]));

        const acc: Record<string, number> = {};
        topProducts.forEach((p) => {
            const cat = productMap.get(p.name) ?? "Autres";
            acc[cat] = (acc[cat] ?? 0) + p.revenue;
        });

        return Object.entries(acc)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [topProducts, products, categories]);

    // Orders by status
    const ordersByStatus = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredOrders.forEach((order) => {
            counts[order.status] = (counts[order.status] ?? 0) + 1;
        });
        return Object.entries(counts).sort(([, a], [, b]) => b - a);
    }, [filteredOrders]);

    // ── Export feedback timeout ─────────────────────────────────────────────────
    useEffect(() => {
        if (exportFeedback) {
            const timer = setTimeout(() => setExportFeedback(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [exportFeedback]);

    // ── Exports ──────────────────────────────────────────────────────────

    const exportOrders = useCallback(() => {
        const header = ["Date", "Heure", "ID Commande", "Client", "Statut", "Mode", "Total (FCFA)"];
        const rows = filteredOrders.map((order) => {
            const d = new Date(order.created_at);
            return [
                d.toLocaleDateString("fr-FR"),
                d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                order.id,
                order.customer_name ?? "",
                STATUS_CONFIG[order.status]?.label ?? order.status,
                (order as any).delivery_method ?? "",
                order.total ?? 0,
            ];
        });
        downloadCsv(`commandes-${period}-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
        setShowExportMenu(false);
        setExportFeedback("✓ Commandes téléchargées");
    }, [filteredOrders, period]);

    const exportProducts = useCallback(() => {
        const header = ["Produit", "Quantite vendue", "Chiffre d'affaires (FCFA)", "Prix unitaire moyen (FCFA)"];
        const rows = topProducts.map((p) => [
            p.name,
            p.quantity,
            Math.round(p.revenue),
            p.quantity > 0 ? Math.round(p.revenue / p.quantity) : 0,
        ]);
        downloadCsv(`produits-vendus-${period}-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
        setShowExportMenu(false);
        setExportFeedback("✓ Produits téléchargés");
    }, [topProducts, period]);

    const exportSummary = useCallback(() => {
        const header = ["Indicateur", "Valeur"];
        const rows: (string | number)[][] = [
            ["Periode", periodLabel],
            ["Nombre de commandes", totalOrdersCount],
            ["Commandes completees", completedOrders.length],
            ["Commandes annulees", cancelledOrders.length],
            ["Taux d'annulation (%)", cancelRate],
            ["Chiffre d'affaires total (FCFA)", totalRevenue],
            ["Panier moyen (FCFA)", Math.round(avgOrderValue)],
            ["Nombre de clients", stats?.totalCustomers ?? 0],
            ["Nombre de produits actifs", products.filter((p: any) => p.is_available).length],
            ["Nombre de categories", categories.length],
            ["", ""],
            ["--- TOP PRODUITS ---", ""],
            ...topProducts.map((p, i) => [`${i + 1}. ${p.name}`, `${p.quantity} vendus — ${Math.round(p.revenue)} FCFA`]),
        ];
        downloadCsv(`resume-${period}-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
        setShowExportMenu(false);
        setExportFeedback("✓ Résumé téléchargé");
    }, [periodLabel, totalOrdersCount, completedOrders, cancelledOrders, cancelRate, totalRevenue, avgOrderValue, stats, products, categories, topProducts, period]);

    // Show skeleton during loading
    if (isLoading && orders.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.reports.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.reports.subtitle}</p>
                </div>
                <ReportsSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Export feedback toast */}
            {exportFeedback && (
                <div className="fixed bottom-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {exportFeedback}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t.reports.title}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">{t.reports.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period selector */}
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
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>

                    {/* Export dropdown */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            leftIcon={<Download size={18} />}
                            onClick={() => setShowExportMenu(!showExportMenu)}
                        >
                            Exporter <ChevronDown size={14} className="ml-1" />
                        </Button>
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={exportOrders}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                    >
                                        <FileSpreadsheet size={16} className="text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">Commandes (CSV)</p>
                                            <p className="text-xs text-surface-400">{totalOrdersCount} commandes sur {periodLabel}</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={exportProducts}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border-t border-surface-100 dark:border-surface-800"
                                    >
                                        <FileSpreadsheet size={16} className="text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">Produits vendus (CSV)</p>
                                            <p className="text-xs text-surface-400">{topProducts.length} produits, CA par produit</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={exportSummary}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border-t border-surface-100 dark:border-surface-800"
                                    >
                                        <FileText size={16} className="text-purple-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">Resume comptable (CSV)</p>
                                            <p className="text-xs text-surface-400">KPIs + top produits, import Excel</p>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards with Trends */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <TrendCard
                    label={t.reports.revenue}
                    value={formatCFA(totalRevenue)}
                    description={`${completedOrders.length} commandes completees`}
                    delta={revenueDelta}
                />
                <TrendCard
                    label={t.reports.orders}
                    value={totalOrdersCount}
                    description={`${cancelledOrders.length} annulees (${cancelRate}%)`}
                    delta={ordersDelta}
                />
                <TrendCard
                    label={t.reports.averageOrder}
                    value={formatCFA(avgOrderValue)}
                    description={`Sur ${periodLabel}`}
                    delta={avgDelta}
                />
                <ReportStatCard
                    label={t.reports.customerGrowth}
                    value={stats?.totalCustomers ?? 0}
                    description="clients au total"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart — AreaChart */}
                <Card className="lg:col-span-2">
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-brand-500" />
                        {t.dashboard.revenueChart}
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartSeries}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-brand-500, #f97316)" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="var(--color-brand-500, #f97316)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(0,0,0,0.05)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v: number) =>
                                        v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                                    }
                                    width={45}
                                    className="hidden sm:block"
                                />
                                <Tooltip
                                    content={
                                        <ChartTooltip
                                            valueFormatter={(v) => formatCFA(v)}
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="var(--color-brand-500, #f97316)"
                                    strokeWidth={2}
                                    fill="url(#revenueGradient)"
                                    dot={false}
                                    animationDuration={800}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Orders by Status — PieChart */}
                <Card>
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-brand-500" />
                        Par statut
                    </h3>
                    {ordersByStatus.length === 0 ? (
                        <p className="text-sm text-surface-400 italic text-center py-8">Aucune commande</p>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={ordersByStatus.map(([status, count]) => ({
                                                name: STATUS_CONFIG[status]?.label ?? status,
                                                value: count,
                                                status,
                                            }))}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            dataKey="value"
                                            animationDuration={800}
                                        >
                                            {ordersByStatus.map(([status]) => (
                                                <Cell
                                                    key={status}
                                                    fill={STATUS_COLORS[status] ?? "#94a3b8"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={
                                                <ChartTooltip
                                                    valueFormatter={(v) => `${v} commande${v > 1 ? "s" : ""}`}
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Custom Legend */}
                            <div className="grid grid-cols-2 gap-2 w-full mt-2 text-[11px]">
                                {ordersByStatus.map(([status, count]) => {
                                    const conf = STATUS_CONFIG[status];
                                    const Icon = conf?.icon ?? Package;
                                    const pct = totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0;
                                    return (
                                        <div key={status} className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: STATUS_COLORS[status] }}
                                            />
                                            <span className="text-surface-600 dark:text-surface-400 truncate flex-1">{conf?.label ?? status}</span>
                                            <span className="font-semibold text-surface-900 dark:text-white">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Peak Hours — BarChart */}
            {peakHours.length > 0 && (
                <Card>
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-brand-500" />
                        Heures de pointe
                    </h3>
                    <div className="h-48">
                        {(() => {
                            const maxCount = Math.max(...peakHours.map((s) => s.count), 1);
                            return (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={peakHours}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(0,0,0,0.05)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="hour"
                                            tickFormatter={(h: number) => `${h}h`}
                                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip
                                                    valueFormatter={(v) => `${v} commande${v > 1 ? "s" : ""}`}
                                                />
                                            }
                                        />
                                        <Bar
                                            dataKey="count"
                                            radius={[4, 4, 0, 0]}
                                            animationDuration={600}
                                        >
                                            {peakHours.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        entry.count === maxCount && entry.count > 0
                                                            ? "var(--color-brand-500, #f97316)"
                                                            : "#cbd5e1"
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>
                </Card>
            )}

            {/* Revenue by Category — Horizontal BarChart */}
            {revenueByCategory.length > 0 && (
                <Card>
                    <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-brand-500" />
                        Revenus par catégorie
                    </h3>
                    <div className="h-64">
                        {(() => {
                            const CATEGORY_COLORS = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#f59e0b"];
                            return (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={revenueByCategory.map(({ name, revenue }, idx) => ({
                                            name,
                                            revenue,
                                            pct: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
                                            color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                                        }))}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(0,0,0,0.05)"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#64748b" }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={115}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip
                                                    valueFormatter={(v) => formatCFA(v)}
                                                />
                                            }
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            radius={[0, 4, 4, 0]}
                                            animationDuration={700}
                                        >
                                            {revenueByCategory.map((_, idx) => (
                                                <Cell
                                                    key={`cell-${idx}`}
                                                    fill={
                                                        ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#f59e0b"][
                                                            idx % 5
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>
                </Card>
            )}

            {/* Products Performance Table */}
            <Card>
                <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-brand-500" />
                    {t.reports.topProducts} — Performance
                </h3>
                {topProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider py-3 px-2">#</th>
                                    <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider py-3 px-2">Produit</th>
                                    <th className="text-right text-xs font-semibold text-surface-500 uppercase tracking-wider py-3 px-2">Qte vendue</th>
                                    <th className="text-right text-xs font-semibold text-surface-500 uppercase tracking-wider py-3 px-2">CA</th>
                                    <th className="text-right text-xs font-semibold text-surface-500 uppercase tracking-wider py-3 px-2">Prix moy.</th>
                                    <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider py-3 px-2 hidden sm:table-cell">Part</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, i) => {
                                    const avgUnitPrice = product.quantity > 0 ? Math.round(product.revenue / product.quantity) : 0;
                                    const revenuePct = totalRevenue > 0 ? Math.round((product.revenue / totalRevenue) * 100) : 0;
                                    return (
                                        <tr key={`${product.name}-${i}`} className="border-b border-surface-100 dark:border-surface-800 last:border-0">
                                            <td className="py-3 px-2">
                                                <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                                                    {i + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className="text-sm font-medium text-surface-900 dark:text-white">{product.name}</span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <Badge variant="outline">{product.quantity}</Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="text-sm font-bold text-surface-900 dark:text-white">
                                                    {formatCFA(Math.round(product.revenue))}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="text-sm text-surface-500">{formatCFA(avgUnitPrice)}</span>
                                            </td>
                                            <td className="py-3 px-2 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${revenuePct}%` }} />
                                                    </div>
                                                    <span className="text-xs text-surface-400">{revenuePct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-surface-400 italic text-center py-8">Aucun produit vendu pour le moment</p>
                )}
            </Card>

            {/* Footer info */}
            <div className="text-center text-xs text-surface-400 pb-4">
                Donnees basees sur les {periodLabel} derniers. Les exports CSV sont compatibles Excel et Google Sheets.
            </div>
        </div>
    );
}
