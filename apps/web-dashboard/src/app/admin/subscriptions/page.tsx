"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    XCircle,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubStats {
    mrr: number;
    activeCount: number;
    renewingCount: number;
    renewingAmount: number;
    churnCount: number;
    churnAmount: number;
    mrrChart: { month: string; revenue: number }[];
}

interface Subscription {
    id: string;
    status: "active" | "expired" | "cancelled";
    amountPaid: number;
    startsAt: string;
    expiresAt: string | null;
    createdAt: string;
    service: { id: string; name: string; category: string; price: number } | null;
    restaurant: { id: string; name: string; slug: string; email: string | null; logoUrl: string | null } | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }
function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"; }

const STATUS_CONFIG = {
    active:    { label: "Actif",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
    expired:   { label: "Expiré",  color: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400" },
    cancelled: { label: "Résilié", color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" },
};

// ── MRR mini bar chart ────────────────────────────────────────────────────────
function MRRChart({ data }: { data: { month: string; revenue: number }[] }) {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const formatMonth = (m: string) => {
        const [y, mo] = m.split("-");
        return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("fr-FR", { month: "short" });
    };
    return (
        <div className="flex items-end gap-1.5 h-28 pt-2">
            {data.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.month}: ${fmt(d.revenue)}`}>
                    <div className="w-full flex justify-center" style={{ height: "80px" }}>
                        <div
                            className={cn(
                                "w-full max-w-[28px] rounded-t transition-all",
                                d.revenue > 0 ? "bg-violet-500/80 hover:bg-violet-500" : "bg-surface-100 dark:bg-surface-800"
                            )}
                            style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 2)}%` }}
                        />
                    </div>
                    <span className="text-[9px] text-surface-400 hidden sm:block">{formatMonth(d.month)}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSubscriptionsPage() {
    const [stats, setStats] = useState<SubStats | null>(null);
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
    const [statusFilter, setStatusFilter] = useState<"active" | "expired" | "cancelled" | "all">("active");
    const [loading, setLoading] = useState(true);
    const [loadingList, setLoadingList] = useState(false);
    const [search, setSearch] = useState("");

    // Load stats once
    useEffect(() => {
        adminFetch("/api/admin/subscriptions/stats")
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setStats(d))
            .finally(() => setLoading(false));
    }, []);

    // Load list on filter/page change
    const loadList = useCallback(async (page = 1) => {
        setLoadingList(true);
        try {
            const res = await adminFetch(`/api/admin/subscriptions?status=${statusFilter}&page=${page}&limit=25`);
            if (res.ok) {
                const data = await res.json();
                setSubs(data.data ?? []);
                setPagination(data.pagination);
            }
        } finally {
            setLoadingList(false);
        }
    }, [statusFilter]);

    useEffect(() => { loadList(1); }, [loadList]);

    const filtered = search
        ? subs.filter(s =>
            s.restaurant?.name.toLowerCase().includes(search.toLowerCase()) ||
            s.service?.name.toLowerCase().includes(search.toLowerCase())
        )
        : subs;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-surface-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 pb-6 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-violet-500">
                        <Wallet size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Revenue Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                        Abonnements <span className="text-violet-500">SaaS</span>
                    </h1>
                    <p className="text-surface-500 max-w-lg">
                        MRR, renouvellements et churn des packs marketplace
                    </p>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "MRR actuel",
                        value: fmt(stats?.mrr ?? 0),
                        icon: Wallet,
                        color: "text-violet-500",
                        bg: "bg-violet-500/10",
                        sub: `${stats?.activeCount ?? 0} abonnements actifs`,
                    },
                    {
                        label: "Renouvellements ce mois",
                        value: stats?.renewingCount ?? 0,
                        icon: RefreshCw,
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                        sub: fmt(stats?.renewingAmount ?? 0),
                    },
                    {
                        label: "Churn ce mois",
                        value: stats?.churnCount ?? 0,
                        icon: TrendingDown,
                        color: stats?.churnCount ? "text-red-500" : "text-surface-400",
                        bg: stats?.churnCount ? "bg-red-500/10" : "bg-surface-50 dark:bg-surface-800",
                        sub: stats?.churnCount ? fmt(stats.churnAmount) + " perdus" : "Aucune résiliation",
                    },
                    {
                        label: "Taux de rétention",
                        value: stats
                            ? stats.activeCount > 0
                                ? `${Math.round((1 - (stats.churnCount / Math.max(stats.activeCount + stats.churnCount, 1))) * 100)}%`
                                : "—"
                            : "…",
                        icon: TrendingUp,
                        color: "text-brand-500",
                        bg: "bg-brand-500/10",
                        sub: "Ce mois",
                    },
                ].map((kpi) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 flex items-start gap-4"
                    >
                        <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                            <kpi.icon size={20} className={kpi.color} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-surface-400 font-medium">{kpi.label}</p>
                            <p className="text-xl font-black text-surface-900 dark:text-white mt-0.5 tabular-nums">{kpi.value}</p>
                            {kpi.sub && <p className="text-xs text-surface-400 mt-0.5">{kpi.sub}</p>}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* MRR Chart */}
            {stats?.mrrChart && stats.mrrChart.length > 0 && (
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={16} className="text-violet-500" />
                        <h3 className="font-bold text-surface-900 dark:text-white text-sm">MRR mensuel (12 mois)</h3>
                    </div>
                    <MRRChart data={stats.mrrChart} />
                </div>
            )}

            {/* Subscriptions List */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        {(["active", "all", "expired", "cancelled"] as const).map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setStatusFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    statusFilter === f
                                        ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900"
                                        : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                                )}
                            >
                                {f === "active" ? "Actifs" : f === "all" ? "Tous" : f === "expired" ? "Expirés" : "Résiliés"}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-60">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Chercher restaurant ou pack…"
                            className="w-full pl-8 pr-3 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                    </div>
                </div>

                {/* Table */}
                {loadingList ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={22} className="animate-spin text-surface-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-surface-400 text-sm">
                        <Wallet size={32} className="mx-auto opacity-20 mb-3" />
                        Aucun abonnement trouvé
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-100 dark:border-surface-800 text-left">
                                    {["Restaurant", "Pack", "Montant", "Début", "Expiration", "Statut", ""].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-black text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                                {filtered.map((sub) => {
                                    const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.expired;
                                    return (
                                        <tr key={sub.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    {sub.restaurant?.logoUrl ? (
                                                        <img src={sub.restaurant.logoUrl} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-400 flex-shrink-0">
                                                            {sub.restaurant?.name?.[0] ?? "?"}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate max-w-[140px]">
                                                            {sub.restaurant?.name ?? "Inconnu"}
                                                        </p>
                                                        <p className="text-xs text-surface-400 truncate max-w-[140px]">{sub.restaurant?.email ?? ""}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-surface-900 dark:text-white">{sub.service?.name ?? "—"}</p>
                                                <p className="text-xs text-surface-400">{sub.service?.category ?? ""}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm font-bold text-surface-900 dark:text-white">
                                                    {sub.amountPaid ? fmt(sub.amountPaid) : "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-surface-500">{fmtDate(sub.startsAt)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    sub.expiresAt && new Date(sub.expiresAt) < new Date(Date.now() + 7 * 864e5)
                                                        ? "text-amber-500"
                                                        : "text-surface-500"
                                                )}>
                                                    {fmtDate(sub.expiresAt)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {sub.restaurant?.id && (
                                                    <Link href={`/admin/restaurants/${sub.restaurant.id}`} className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all">
                                                        <ArrowUpRight size={13} />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100 dark:border-surface-800">
                        <p className="text-xs text-surface-400">
                            {pagination.total} abonnements · page {pagination.page}/{pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.page <= 1}
                                onClick={() => loadList(pagination.page - 1)}
                                className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center disabled:opacity-40 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                type="button"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => loadList(pagination.page + 1)}
                                className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center disabled:opacity-40 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
