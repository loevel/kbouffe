"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Brain,
    TrendingUp,
    Zap,
    DollarSign,
    Store,
    Activity,
    Camera,
    Send,
    Calendar,
    FileSearch,
    PenSquare,
    Loader2,
    ArrowUpRight,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AiUsageData {
    summary: {
        totalTodayCalls: number;
        totalMonthCalls: number;
        totalCostFCFA: number;
        activeRestaurants: number;
    };
    globalByFeature: Record<string, number>;
    dailyTrend: { date: string; calls: number }[];
    topRestaurants: {
        restaurantId: string;
        name: string;
        slug: string;
        todayCalls: number;
        monthCalls: number;
        byFeature: Record<string, number>;
        estimatedCostFCFA: number;
    }[];
}

// ── Feature metadata ───────────────────────────────────────────────────────────

const FEATURE_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    ai_photo:      { label: "Photos IA",         icon: Camera,     color: "text-purple-500",  bg: "bg-purple-500/10" },
    ai_analytics:  { label: "Conseiller IA",      icon: Brain,      color: "text-blue-500",    bg: "bg-blue-500/10" },
    ai_social:     { label: "Social Publisher",   icon: Send,       color: "text-pink-500",    bg: "bg-pink-500/10" },
    ai_calendar:   { label: "Calendrier Contenu", icon: Calendar,   color: "text-rose-500",    bg: "bg-rose-500/10" },
    ai_ocr:        { label: "Scanner Menu",       icon: FileSearch, color: "text-amber-500",   bg: "bg-amber-500/10" },
    ai_copywriter: { label: "Copywriter IA",      icon: PenSquare,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
    label: string; value: string | number; sub?: string;
    icon: any; color: string; bg: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 flex items-start gap-4"
        >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className={color} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-surface-900 dark:text-white mt-0.5 tabular-nums">{value}</p>
                {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

function TrendBar({ data }: { data: { date: string; calls: number }[] }) {
    const max = Math.max(...data.map(d => d.calls), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.date}: ${d.calls} appels`}>
                    <div className="w-full flex justify-center" style={{ height: "52px" }}>
                        <div
                            className="w-full max-w-[12px] rounded-t bg-brand-500/70 hover:bg-brand-500 transition-colors"
                            style={{ height: `${Math.max((d.calls / max) * 100, d.calls > 0 ? 4 : 0)}%` }}
                        />
                    </div>
                    {data.length <= 14 && (
                        <span className="text-[8px] text-surface-400 hidden sm:block">
                            {new Date(d.date).getDate()}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Feature bar ───────────────────────────────────────────────────────────────

function FeatureBar({ feature, calls, total }: { feature: string; calls: number; total: number }) {
    const meta = FEATURE_META[feature] ?? { label: feature, icon: Zap, color: "text-surface-400", bg: "bg-surface-100" };
    const Icon = meta.icon;
    const pct = total > 0 ? Math.round((calls / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={meta.color} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-700 dark:text-surface-300">{meta.label}</span>
                    <span className="text-sm font-bold text-surface-900 dark:text-white">{calls.toLocaleString("fr-FR")}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
            </div>
            <span className="text-xs text-surface-400 w-9 text-right">{pct}%</span>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAiUsagePage() {
    const [data, setData] = useState<AiUsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);

    useEffect(() => {
        adminFetch("/api/admin/ai-usage")
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setData(d))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 text-surface-400">
                Impossible de charger les données
            </div>
        );
    }

    const totalMonthCalls = data.summary.totalMonthCalls;
    const sortedFeatures = Object.entries(data.globalByFeature).sort(([, a], [, b]) => b - a);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 pb-6 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-500">
                        <Brain size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Intelligence Platform</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                        Usage <span className="text-brand-500">IA</span>
                    </h1>
                    <p className="text-surface-500 max-w-lg">
                        Surveillance de la consommation Gemini par restaurant — coûts estimés et quotas
                    </p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Appels aujourd'hui"
                    value={data.summary.totalTodayCalls.toLocaleString("fr-FR")}
                    sub="Toutes features"
                    icon={Activity}
                    color="text-brand-500"
                    bg="bg-brand-500/10"
                />
                <KpiCard
                    label="Appels ce mois"
                    value={data.summary.totalMonthCalls.toLocaleString("fr-FR")}
                    sub={`${data.summary.activeRestaurants} restaurants actifs`}
                    icon={TrendingUp}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
                <KpiCard
                    label="Coût estimé (mois)"
                    value={`${data.summary.totalCostFCFA.toLocaleString("fr-FR")} FCFA`}
                    sub="Basé sur tarifs Gemini"
                    icon={DollarSign}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
                <KpiCard
                    label="Restaurants IA actifs"
                    value={data.summary.activeRestaurants}
                    sub="Ont fait ≥1 appel ce mois"
                    icon={Store}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend 14j */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-brand-500" />
                        Tendance 14 jours
                    </h3>
                    <TrendBar data={data.dailyTrend} />
                </div>

                {/* By feature */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-brand-500" />
                        Par feature (mois)
                    </h3>
                    <div className="space-y-3">
                        {sortedFeatures.length > 0 ? sortedFeatures.map(([feature, calls]) => (
                            <FeatureBar key={feature} feature={feature} calls={calls} total={totalMonthCalls} />
                        )) : (
                            <p className="text-sm text-surface-400 italic text-center py-6">Aucun appel ce mois</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Top restaurants table */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-3">
                    <Store size={16} className="text-brand-500" />
                    <h3 className="font-bold text-surface-900 dark:text-white">Top restaurants consommateurs</h3>
                    <span className="text-xs text-surface-400 ml-auto">Ce mois</span>
                </div>

                {data.topRestaurants.length === 0 ? (
                    <div className="py-16 text-center">
                        <Brain size={40} className="mx-auto text-surface-200 mb-4" />
                        <p className="text-surface-400 text-sm">Aucun appel IA enregistré ce mois</p>
                    </div>
                ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                        {data.topRestaurants.map((r, idx) => {
                            const isExpanded = expandedRestaurant === r.restaurantId;
                            return (
                                <div key={r.restaurantId}>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedRestaurant(isExpanded ? null : r.restaurantId)}
                                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left"
                                    >
                                        {/* Rank */}
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0",
                                            idx === 0 ? "bg-amber-100 text-amber-600" :
                                            idx === 1 ? "bg-surface-100 text-surface-500" :
                                            idx === 2 ? "bg-orange-50 text-orange-500" :
                                            "bg-surface-50 dark:bg-surface-800 text-surface-400"
                                        )}>
                                            {idx + 1}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{r.name}</p>
                                            <p className="text-xs text-surface-400 mt-0.5">
                                                {r.todayCalls} auj. · {r.monthCalls} ce mois
                                            </p>
                                        </div>

                                        {/* Cost */}
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-bold text-surface-900 dark:text-white">
                                                ~{r.estimatedCostFCFA.toLocaleString("fr-FR")} FCFA
                                            </p>
                                            <p className="text-xs text-surface-400">coût estimé</p>
                                        </div>

                                        {/* Month calls bar */}
                                        <div className="w-24 hidden lg:block">
                                            <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-500 rounded-full"
                                                    style={{ width: `${totalMonthCalls > 0 ? Math.min(100, Math.round((r.monthCalls / totalMonthCalls) * 100 * 3)) : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Expand */}
                                        <Link
                                            href={`/admin/restaurants/${r.restaurantId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-colors flex-shrink-0"
                                        >
                                            <ArrowUpRight size={14} />
                                        </Link>

                                        <div className="w-5 flex-shrink-0">
                                            {isExpanded
                                                ? <ChevronUp size={14} className="text-surface-400" />
                                                : <ChevronDown size={14} className="text-surface-400" />
                                            }
                                        </div>
                                    </button>

                                    {/* Expanded: breakdown by feature */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-4 pt-2 bg-surface-50 dark:bg-surface-800/30 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {Object.entries(r.byFeature).sort(([,a],[,b]) => b-a).map(([feature, calls]) => {
                                                        const meta = FEATURE_META[feature] ?? { label: feature, icon: Zap, color: "text-surface-400", bg: "bg-surface-100" };
                                                        const Icon = meta.icon;
                                                        return (
                                                            <div key={feature} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                                                                <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                                                                    <Icon size={12} className={meta.color} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">{meta.label}</p>
                                                                    <p className="text-xs text-surface-400">{calls} appels</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
