"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Mail,
    Store,
    TrendingUp,
    Users,
    Star,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Send,
    Image,
    Clock,
    Phone,
    MapPin,
    ShoppingBag,
    Camera,
    Globe,
    Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CriterionInfo {
    key: string;
    label: string;
    weight: number;
}

interface OnboardingRestaurant {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    logoUrl: string | null;
    isPublished: boolean;
    createdAt: string;
    score: number;
    flags: Record<string, boolean>;
    missingCriteria: { key: string; label: string; weight: number }[];
    productCount: number;
    lastReminderAt: string | null;
}

interface OnboardingData {
    data: OnboardingRestaurant[];
    stats: { total: number; blocked: number; avgScore: number };
    criteria: CriterionInfo[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── Criterion icon map ─────────────────────────────────────────────────────────

const CRITERION_ICONS: Record<string, any> = {
    hasLogo: Image,
    hasBanner: Camera,
    hasDescription: Globe,
    hasPhone: Phone,
    hasEmail: Mail,
    hasAddress: MapPin,
    hasOpeningHours: Clock,
    hasProducts: ShoppingBag,
    hasProductImages: Camera,
    isPublished: Globe,
};

// ── Score color helper ─────────────────────────────────────────────────────────

function scoreColor(score: number) {
    if (score >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { text: "text-red-400", bg: "bg-red-500", badge: "bg-red-500/10 text-red-400 border-red-500/20" };
}

function scoreLabel(score: number) {
    if (score >= 80) return "Complet";
    if (score >= 50) return "En cours";
    return "Bloqué";
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
    const color = scoreColor(score);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color.bg)}
                />
            </div>
            <span className={cn("text-xs font-bold w-8 text-right", color.text)}>{score}%</span>
        </div>
    );
}

// ── Remind button ──────────────────────────────────────────────────────────────

function RemindButton({ restaurant, onDone }: { restaurant: OnboardingRestaurant; onDone: () => void }) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleRemind() {
        if (!restaurant.email) return;
        setLoading(true);
        try {
            const res = await adminFetch(`/admin/onboarding/remind/${restaurant.id}`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setSent(true);
                setTimeout(() => {
                    setSent(false);
                    onDone();
                }, 2000);
            }
        } catch (e) {
            console.error("Remind error:", e);
        } finally {
            setLoading(false);
        }
    }

    if (!restaurant.email) {
        return (
            <span className="text-xs text-surface-600 italic">Pas d'email</span>
        );
    }

    if (sent) {
        return (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 size={12} /> Envoyée
            </span>
        );
    }

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={handleRemind}
            disabled={loading}
            className="h-7 px-2 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Relancer
        </Button>
    );
}

// ── Restaurant row ──────────────────────────────────────────────────────────────

function RestaurantRow({
    restaurant,
    criteria,
    onRefresh,
}: {
    restaurant: OnboardingRestaurant;
    criteria: CriterionInfo[];
    onRefresh: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const colors = scoreColor(restaurant.score);

    return (
        <>
            <motion.tr
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors cursor-pointer",
                    restaurant.score < 50 && "bg-red-500/5"
                )}
                onClick={() => setExpanded(!expanded)}
            >
                {/* Restaurant */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center">
                                <Store size={14} className="text-surface-500" />
                            </div>
                        )}
                        <div>
                            <Link
                                href={`/admin/restaurants/${restaurant.id}`}
                                className="text-sm font-medium text-white hover:text-brand-400 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {restaurant.name}
                            </Link>
                            <p className="text-xs text-surface-500">{restaurant.slug}</p>
                        </div>
                    </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3 w-44">
                    <ScoreBar score={restaurant.score} />
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", colors.badge)}>
                        {scoreLabel(restaurant.score)}
                    </span>
                </td>

                {/* Missing */}
                <td className="px-4 py-3">
                    <span className="text-sm text-surface-400">
                        {restaurant.missingCriteria.length === 0 ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Complet
                            </span>
                        ) : (
                            <span className="text-amber-400">{restaurant.missingCriteria.length} critère{restaurant.missingCriteria.length > 1 ? "s" : ""} manquant{restaurant.missingCriteria.length > 1 ? "s" : ""}</span>
                        )}
                    </span>
                </td>

                {/* Last Reminder */}
                <td className="px-4 py-3">
                    <span className="text-xs text-surface-500">
                        {restaurant.lastReminderAt
                            ? new Date(restaurant.lastReminderAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                            : <span className="text-surface-600 italic">Jamais</span>}
                    </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        <RemindButton restaurant={restaurant} onDone={onRefresh} />
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            className="p-1 rounded text-surface-500 hover:text-white transition-colors"
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </td>
            </motion.tr>

            {/* Expanded row — criteria detail */}
            <AnimatePresence>
                {expanded && (
                    <motion.tr
                        key={`exp-${restaurant.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <td colSpan={6} className="px-4 pb-4 bg-surface-900/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-3">
                                {criteria.map((c) => {
                                    const ok = restaurant.flags[c.key];
                                    const Icon = CRITERION_ICONS[c.key] ?? Star;
                                    return (
                                        <div
                                            key={c.key}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                                ok
                                                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                                                    : "border-red-500/20 bg-red-500/5 text-red-400"
                                            )}
                                        >
                                            {ok ? (
                                                <CheckCircle2 size={12} className="shrink-0" />
                                            ) : (
                                                <XCircle size={12} className="shrink-0" />
                                            )}
                                            <span className="truncate">{c.label}</span>
                                            <span className="ml-auto text-surface-500 shrink-0">+{c.weight}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {restaurant.email && (
                                <p className="text-xs text-surface-500 mt-2">
                                    <Mail size={10} className="inline mr-1" />{restaurant.email}
                                    {restaurant.lastReminderAt && (
                                        <span className="ml-3 text-surface-600">
                                            Dernière relance : {new Date(restaurant.lastReminderAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                        </span>
                                    )}
                                </p>
                            )}
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminOnboardingPage() {
    const [data, setData] = useState<OnboardingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "blocked" | "inprogress" | "complete">("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "30" });
            const res = await adminFetch(`/admin/onboarding?${params}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Onboarding fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter client-side
    const filtered = (data?.data ?? []).filter((r) => {
        const matchSearch =
            !search ||
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.slug.toLowerCase().includes(search.toLowerCase());

        const matchFilter =
            filter === "all" ||
            (filter === "blocked" && r.score < 50) ||
            (filter === "inprogress" && r.score >= 50 && r.score < 80) ||
            (filter === "complete" && r.score >= 80);

        return matchSearch && matchFilter;
    });

    const stats = data?.stats;

    return (
        <div className="min-h-screen bg-surface-950 p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Suivi Onboarding</h1>
                    <p className="text-surface-400 mt-1 text-sm">
                        Score de complétion profil par restaurant — relancez les restaurants bloqués
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={fetchData}
                    disabled={loading}
                    className="gap-2 text-surface-400 hover:text-white"
                >
                    <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                    Actualiser
                </Button>
            </motion.div>

            {/* KPI Cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <Store size={16} className="text-brand-400" />
                        </div>
                        <span className="text-xs text-surface-400 font-medium">Total restaurants</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{loading ? "—" : (stats?.total ?? 0)}</p>
                </div>

                <div className="bg-surface-900 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-red-400" />
                        </div>
                        <span className="text-xs text-surface-400 font-medium">Bloqués (&lt;50%)</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{loading ? "—" : (stats?.blocked ?? 0)}</p>
                    <p className="text-xs text-surface-500 mt-1">À relancer en priorité</p>
                </div>

                <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                        </div>
                        <span className="text-xs text-surface-400 font-medium">Complétés (≥80%)</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                        {loading ? "—" : (data?.data ?? []).filter(r => r.score >= 80).length}
                    </p>
                </div>

                <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <TrendingUp size={16} className="text-amber-400" />
                        </div>
                        <span className="text-xs text-surface-400 font-medium">Score moyen</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{loading ? "—" : `${stats?.avgScore ?? 0}%`}</p>
                </div>
            </motion.div>

            {/* Criteria legend */}
            {data?.criteria && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface-900 border border-surface-800 rounded-xl p-4"
                >
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
                        Critères de complétion
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.criteria.map((c) => {
                            const Icon = CRITERION_ICONS[c.key] ?? Star;
                            return (
                                <div
                                    key={c.key}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-800/50 border border-surface-700/50"
                                >
                                    <Icon size={11} className="text-brand-400 shrink-0" />
                                    <span className="text-xs text-surface-300">{c.label}</span>
                                    <span className="text-xs font-bold text-brand-400">+{c.weight}%</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Filters & search */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            >
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <input
                        type="text"
                        placeholder="Rechercher un restaurant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 pr-8"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-lg p-1">
                    {[
                        { key: "all", label: "Tous", count: stats?.total },
                        { key: "blocked", label: "Bloqués", count: stats?.blocked, color: "text-red-400" },
                        { key: "inprogress", label: "En cours", color: "text-amber-400" },
                        { key: "complete", label: "Complets", color: "text-emerald-400" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                filter === f.key
                                    ? "bg-brand-500/20 text-brand-400"
                                    : "text-surface-400 hover:text-white"
                            )}
                        >
                            {f.label}
                            {f.count !== undefined && (
                                <span className={cn("ml-1", filter === f.key ? "text-brand-300" : "text-surface-600")}>
                                    ({f.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 text-xs text-surface-500 ml-auto">
                    <Filter size={12} />
                    {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden"
            >
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 size={28} className="animate-spin text-brand-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-surface-500">
                        <Users size={32} className="mb-3 opacity-40" />
                        <p className="text-sm">Aucun restaurant trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-800 bg-surface-900/80">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                        Restaurant
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider w-44">
                                        Score
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                        Manquant
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                        Dernière relance
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filtered.map((r) => (
                                        <RestaurantRow
                                            key={r.id}
                                            restaurant={r}
                                            criteria={data?.criteria ?? []}
                                            onRefresh={fetchData}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-surface-500">
                        Page {data.pagination.page} sur {data.pagination.totalPages} — {data.pagination.total} restaurants
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="text-surface-400 hover:text-white"
                        >
                            ← Précédent
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={page >= data.pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="text-surface-400 hover:text-white"
                        >
                            Suivant →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
