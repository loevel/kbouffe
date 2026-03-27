"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Share2,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    TrendingUp,
    Store,
    Loader2,
    RefreshCw,
    Filter,
    Image as ImageIcon,
    AlertCircle,
    Calendar,
    Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformStat {
    platform: string;
    label: string;
    color: string;
    total: number;
    published: number;
    publishRate: number;
}

interface SocialStats {
    summary: {
        total: number;
        published: number;
        failed: number;
        draft: number;
        scheduled: number;
        publishRate: number;
        thisMonth: number;
        connectedAccounts: number;
    };
    byStatus: Record<string, number>;
    platformStats: PlatformStat[];
    connectedAccounts: Record<string, number>;
    topRestaurants: { id: string; name: string; slug: string; logoUrl: string | null; postCount: number }[];
    trend: { date: string; published: number; failed: number }[];
}

interface SocialPost {
    id: string;
    platform: string;
    platformLabel: string;
    content: string;
    imageUrl: string | null;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    errorMessage: string | null;
    createdAt: string;
    restaurant: { id: string; name: string; slug: string; logoUrl: string | null } | null;
}

interface PostsData {
    data: SocialPost[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── Platform colors ────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    facebook:  { bg: "bg-blue-500/10",    text: "text-blue-400",    dot: "bg-blue-500" },
    instagram: { bg: "bg-pink-500/10",    text: "text-pink-400",    dot: "bg-pink-500" },
    telegram:  { bg: "bg-sky-500/10",     text: "text-sky-400",     dot: "bg-sky-500" },
    tiktok:    { bg: "bg-surface-700",    text: "text-surface-300", dot: "bg-surface-400" },
    whatsapp:  { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
};

const STATUS_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    published: { label: "Publié",    icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    failed:    { label: "Échec",     icon: XCircle,      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
    draft:     { label: "Brouillon", icon: FileText,     color: "text-surface-400", bg: "bg-surface-700/50 border-surface-600/20" },
    scheduled: { label: "Programmé", icon: Calendar,     color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
    publishing:{ label: "En cours",  icon: Send,         color: "text-brand-400",   bg: "bg-brand-500/10 border-brand-500/20" },
};

// ── Micro bar chart ────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn("h-full rounded-full", color)}
            />
        </div>
    );
}

// ── Trend spark ────────────────────────────────────────────────────────────────

function TrendSpark({ data }: { data: { date: string; published: number; failed: number }[] }) {
    const maxVal = Math.max(...data.map(d => d.published + d.failed), 1);
    return (
        <div className="flex items-end gap-0.5 h-12">
            {data.map((d) => {
                const totalH = Math.round(((d.published + d.failed) / maxVal) * 100);
                const pubH = Math.round((d.published / (d.published + d.failed || 1)) * totalH);
                return (
                    <div key={d.date} className="flex-1 flex flex-col justify-end gap-0.5 h-full" title={`${d.date}: ${d.published} publiés, ${d.failed} échecs`}>
                        {d.failed > 0 && (
                            <div style={{ height: `${totalH - pubH}%` }} className="bg-red-500/60 rounded-t" />
                        )}
                        <div style={{ height: `${pubH}%` }} className="bg-emerald-500/80 rounded-t" />
                    </div>
                );
            })}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminSocialMonitorPage() {
    const [stats, setStats] = useState<SocialStats | null>(null);
    const [postsData, setPostsData] = useState<PostsData | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // Filters
    const [platform, setPlatform] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await adminFetch("/admin/social-monitor/stats");
            setStats(await res.json());
        } catch (e) {
            console.error("Social stats error:", e);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "25" });
            if (platform) params.set("platform", platform);
            if (status) params.set("status", status);
            if (search) params.set("search", search);
            const res = await adminFetch(`/admin/social-monitor?${params}`);
            setPostsData(await res.json());
        } catch (e) {
            console.error("Social posts error:", e);
        } finally {
            setLoadingPosts(false);
        }
    }, [platform, status, search, page]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const summary = stats?.summary;

    return (
        <div className="min-h-screen bg-surface-950 p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center border border-pink-500/20">
                        <Share2 size={20} className="text-pink-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Social Monitor</h1>
                        <p className="text-surface-400 text-sm">Publications générées via Social Publisher</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { fetchStats(); fetchPosts(); }}
                    disabled={loadingStats}
                    className="gap-2 text-surface-400 hover:text-white"
                >
                    <RefreshCw size={14} className={cn(loadingStats && "animate-spin")} />
                    Actualiser
                </Button>
            </motion.div>

            {/* KPI cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <Share2 size={15} className="text-brand-400" />
                        </div>
                        <span className="text-xs text-surface-400">Total posts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{loadingStats ? "—" : summary?.total ?? 0}</p>
                    <p className="text-xs text-surface-600 mt-1">{summary?.thisMonth ?? 0} ce mois</p>
                </div>

                <div className="bg-surface-900 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 size={15} className="text-emerald-400" />
                        </div>
                        <span className="text-xs text-surface-400">Taux publication</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{loadingStats ? "—" : `${summary?.publishRate ?? 0}%`}</p>
                    <p className="text-xs text-surface-600 mt-1">{summary?.published ?? 0} publiés</p>
                </div>

                <div className="bg-surface-900 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <XCircle size={15} className="text-red-400" />
                        </div>
                        <span className="text-xs text-surface-400">Échecs</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{loadingStats ? "—" : summary?.failed ?? 0}</p>
                    <p className="text-xs text-surface-600 mt-1">{summary?.draft ?? 0} brouillons</p>
                </div>

                <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                            <TrendingUp size={15} className="text-sky-400" />
                        </div>
                        <span className="text-xs text-surface-400">Comptes connectés</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{loadingStats ? "—" : summary?.connectedAccounts ?? 0}</p>
                    <p className="text-xs text-surface-600 mt-1">sur toutes plateformes</p>
                </div>
            </motion.div>

            {/* Platform breakdown + Trend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Platform stats */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2 bg-surface-900 border border-surface-800 rounded-xl p-5"
                >
                    <h3 className="text-sm font-semibold text-surface-300 mb-4">Par plateforme</h3>
                    {loadingStats ? (
                        <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
                    ) : (
                        <div className="space-y-3">
                            {(stats?.platformStats ?? []).map((p) => {
                                const colors = PLATFORM_COLORS[p.platform] ?? { bg: "bg-surface-700", text: "text-surface-300", dot: "bg-surface-500" };
                                return (
                                    <div key={p.platform} className="flex items-center gap-3">
                                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                                            <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                                        </div>
                                        <span className={cn("text-xs font-medium w-20 shrink-0", colors.text)}>{p.label}</span>
                                        <MiniBar value={p.total} max={stats?.summary.total ?? 1} color={colors.dot} />
                                        <span className="text-xs text-surface-400 w-8 text-right shrink-0">{p.total}</span>
                                        <span className={cn("text-xs font-semibold w-10 text-right shrink-0",
                                            p.publishRate >= 70 ? "text-emerald-400" :
                                            p.publishRate >= 40 ? "text-amber-400" : "text-red-400"
                                        )}>
                                            {p.publishRate}%
                                        </span>
                                    </div>
                                );
                            })}
                            {(stats?.platformStats ?? []).length === 0 && (
                                <p className="text-sm text-surface-600 text-center py-4">Aucune donnée</p>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Trend 7j */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-surface-900 border border-surface-800 rounded-xl p-5"
                >
                    <h3 className="text-sm font-semibold text-surface-300 mb-1">Tendance 7 jours</h3>
                    <p className="text-xs text-surface-500 mb-4">
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" /> Publiés</span>
                        <span className="inline-flex items-center gap-1 ml-3"><span className="w-2 h-2 rounded-full bg-red-500/60 inline-block" /> Échecs</span>
                    </p>
                    {loadingStats ? (
                        <div className="h-12 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-brand-400" /></div>
                    ) : (
                        <TrendSpark data={stats?.trend ?? []} />
                    )}
                    {/* Day labels */}
                    <div className="flex gap-0.5 mt-1">
                        {(stats?.trend ?? []).map((d) => (
                            <div key={d.date} className="flex-1 text-center text-xs text-surface-600">
                                {new Date(d.date).toLocaleDateString("fr-FR", { weekday: "narrow" })}
                            </div>
                        ))}
                    </div>

                    {/* Top restaurants */}
                    <div className="mt-5">
                        <h4 className="text-xs font-semibold text-surface-400 mb-2">Top restaurants</h4>
                        <div className="space-y-2">
                            {(stats?.topRestaurants ?? []).slice(0, 3).map((r, i) => (
                                <div key={r.id} className="flex items-center gap-2">
                                    <span className="text-xs text-surface-600 w-4">{i + 1}.</span>
                                    {r.logoUrl ? (
                                        <img src={r.logoUrl} alt="" className="w-5 h-5 rounded object-cover" />
                                    ) : (
                                        <div className="w-5 h-5 rounded bg-surface-700 flex items-center justify-center">
                                            <Store size={10} className="text-surface-500" />
                                        </div>
                                    )}
                                    <Link href={`/admin/restaurants/${r.id}`} className="text-xs text-surface-300 hover:text-white truncate flex-1">
                                        {r.name}
                                    </Link>
                                    <span className="text-xs font-semibold text-brand-400">{r.postCount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3 items-center"
            >
                <input
                    type="text"
                    placeholder="Rechercher restaurant ou contenu..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 w-56"
                />

                {/* Platform filter */}
                <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-lg p-1">
                    {["", "facebook", "instagram", "telegram", "tiktok", "whatsapp"].map((pl) => {
                        const label = pl === "" ? "Tous" : (PLATFORM_COLORS[pl] ? pl.charAt(0).toUpperCase() + pl.slice(1) : pl);
                        return (
                            <button
                                key={pl}
                                onClick={() => { setPlatform(pl); setPage(1); }}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                                    platform === pl ? "bg-brand-500/20 text-brand-400" : "text-surface-400 hover:text-white"
                                )}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-lg p-1">
                    {[
                        { key: "", label: "Tous" },
                        { key: "published", label: "Publiés" },
                        { key: "failed", label: "Échecs" },
                        { key: "draft", label: "Brouillons" },
                        { key: "scheduled", label: "Programmés" },
                    ].map((s) => (
                        <button
                            key={s.key}
                            onClick={() => { setStatus(s.key); setPage(1); }}
                            className={cn(
                                "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                                status === s.key ? "bg-brand-500/20 text-brand-400" : "text-surface-400 hover:text-white"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 text-xs text-surface-500 ml-auto">
                    <Filter size={12} />
                    {postsData?.pagination.total ?? 0} posts
                </div>
            </motion.div>

            {/* Posts table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden"
            >
                {loadingPosts ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 size={28} className="animate-spin text-brand-400" />
                    </div>
                ) : (postsData?.data ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-surface-500">
                        <Share2 size={32} className="mb-3 opacity-30" />
                        <p className="text-sm">Aucun post trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-800 bg-surface-900/80">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Restaurant</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Plateforme</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Contenu</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {(postsData?.data ?? []).map((post) => {
                                        const plColors = PLATFORM_COLORS[post.platform] ?? { bg: "bg-surface-700", text: "text-surface-300", dot: "bg-surface-500" };
                                        const statusMeta = STATUS_META[post.status] ?? STATUS_META["draft"];
                                        const StatusIcon = statusMeta.icon;

                                        return (
                                            <motion.tr
                                                key={post.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="border-b border-surface-800/50 hover:bg-surface-800/20 transition-colors"
                                            >
                                                {/* Restaurant */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {post.restaurant?.logoUrl ? (
                                                            <img src={post.restaurant.logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center">
                                                                <Store size={12} className="text-surface-500" />
                                                            </div>
                                                        )}
                                                        <Link href={`/admin/restaurants/${post.restaurant?.id}`} className="text-sm text-white hover:text-brand-400 transition-colors font-medium truncate max-w-[120px]">
                                                            {post.restaurant?.name ?? "—"}
                                                        </Link>
                                                    </div>
                                                </td>

                                                {/* Platform */}
                                                <td className="px-4 py-3">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium", plColors.bg, plColors.text)}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", plColors.dot)} />
                                                        {post.platformLabel}
                                                    </span>
                                                </td>

                                                {/* Content */}
                                                <td className="px-4 py-3 max-w-xs">
                                                    <div className="flex items-start gap-2">
                                                        {post.imageUrl && (
                                                            <ImageIcon size={13} className="text-surface-500 shrink-0 mt-0.5" />
                                                        )}
                                                        <p className="text-xs text-surface-300 truncate">{post.content}</p>
                                                    </div>
                                                    {post.errorMessage && (
                                                        <p className="text-xs text-red-400 mt-0.5 truncate flex items-center gap-1">
                                                            <AlertCircle size={10} /> {post.errorMessage}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border", statusMeta.bg, statusMeta.color)}>
                                                        <StatusIcon size={11} />
                                                        {statusMeta.label}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-surface-500">
                                                        {post.publishedAt
                                                            ? new Date(post.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                                            : new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Pagination */}
            {postsData && postsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-surface-500">
                        Page {postsData.pagination.page} / {postsData.pagination.totalPages} — {postsData.pagination.total} posts
                    </p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-surface-400">
                            ← Précédent
                        </Button>
                        <Button size="sm" variant="ghost" disabled={page >= postsData.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="text-surface-400">
                            Suivant →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
