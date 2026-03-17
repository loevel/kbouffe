"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Megaphone,
    ChevronLeft,
    ChevronRight,
    Store,
    Eye,
    MousePointer,
    Clock,
    CheckCircle,
    XCircle,
    Play,
    Bell,
    TrendingUp,
    Zap,
    Target,
    BarChart3,
    ArrowUpRight,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CampaignRow {
    id: string;
    restaurantId: string;
    restaurantName: string | null;
    restaurantSlug: string | null;
    package: string;
    status: string;
    startsAt: string;
    endsAt: string;
    budget: number;
    includePush: boolean;
    pushSent: boolean;
    impressions: number;
    clicks: number;
    notes: string | null;
    createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; color: string }> = {
    pending: { label: "En attente", variant: "warning", color: "text-amber-500 bg-amber-500/10" },
    active: { label: "Active", variant: "success", color: "text-emerald-500 bg-emerald-500/10" },
    completed: { label: "Terminée", variant: "info", color: "text-blue-500 bg-blue-500/10" },
    cancelled: { label: "Annulée", variant: "danger", color: "text-rose-500 bg-rose-500/10" },
};

const packageConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; color: string }> = {
    basic: { label: "Basic", variant: "default", color: "bg-surface-100 text-surface-500" },
    premium: { label: "Premium", variant: "brand", color: "bg-brand-500/10 text-brand-500" },
    elite: { label: "Elite", variant: "danger", color: "bg-rose-500/10 text-rose-500" },
};

function formatFCFA(val: number) {
    return new Intl.NumberFormat("fr-FR").format(val) + " FCFA";
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
};

export default function AdminMarketingPage() {
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(statusFilter !== "all" && { status: statusFilter }),
            });
            const res = await fetch(`/api/admin/marketing/campaigns?${params}`);
            const json = await res.json();
            setCampaigns(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch {
            console.error("Failed to fetch campaigns");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchCampaigns(1);
    }, [fetchCampaigns]);

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdating(id);
        try {
            const res = await fetch("/api/admin/marketing/campaigns", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
            }
        } finally {
            setUpdating(null);
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-500">
                        <Megaphone size={20} className="animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Hub</span>
                    </div>
                    <h1 className="text-5xl font-black text-surface-900 dark:text-white tracking-tight">
                        Marketing & <span className="text-brand-500">Revenue</span>
                    </h1>
                    <p className="text-surface-500 font-medium max-w-xl text-lg leading-relaxed">
                        Pilotage des campagnes promotionnelles, optimisation de la visibilité marchande et monitoring des leviers de croissance.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-3 bg-surface-900 dark:bg-brand-500 rounded-2xl text-white shadow-xl shadow-brand-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Revenu AdTech (30j)</p>
                        <p className="text-2xl font-black tabular-nums">1.2M+ FCFA</p>
                    </div>
                </div>
            </div>

            {/* Smart Toolbar */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm"
            >
                <div className="flex items-center gap-3 px-4 border-r border-surface-100 dark:border-surface-800">
                    <BarChart3 size={18} className="text-surface-400" />
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Filter Portfolio</span>
                </div>
                
                <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {["all", "pending", "active", "completed"].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={cn(
                                "px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest whitespace-nowrap",
                                statusFilter === st
                                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                    : "text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800"
                            )}
                        >
                            {st === "all" ? "Toutes les campagnes" : st === "pending" ? "En attente" : st === "active" ? "En cours" : "Terminées"}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Campaign Ledger Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="text-left px-10 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Établissement & Offre</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Package</th>
                                <th className="text-right px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Investissement</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">KPIs & Reach</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Cycle de vie</th>
                                <th className="px-10 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {loading && campaigns.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="animate-pulse">
                                            <td colSpan={6} className="px-10 py-8">
                                                <div className="h-12 bg-surface-100 dark:bg-surface-800 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : campaigns.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan={6} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-200 dark:text-surface-700">
                                                    <Target size={40} />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-widest text-surface-400">Aucune campagne à afficher</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    campaigns.map((c, idx) => {
                                        const sb = statusConfig[c.status] ?? statusConfig.pending;
                                        const pb = packageConfig[c.package] ?? packageConfig.basic;
                                        const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
                                        return (
                                            <motion.tr 
                                                key={c.id} 
                                                layout
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className="group hover:bg-surface-50 dark:hover:bg-brand-500/5 transition-all cursor-pointer"
                                            >
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform shadow-sm border border-white/50 dark:border-surface-700">
                                                            <Store size={24} strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-tight truncate max-w-[200px] group-hover:text-brand-500 transition-colors">
                                                                {c.restaurantName ?? "Merchant ID #" + c.restaurantId.slice(0, 4)}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">ID: {c.id.slice(0, 8)}</span>
                                                                {c.includePush && <Badge variant="warning" className="text-[8px] px-1.5 py-0 rounded-full font-black uppercase">Push Enabled</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex justify-center">
                                                        <Badge variant={pb.variant} className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm shadow-current/10", pb.color)}>
                                                            {pb.label}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-surface-900 dark:text-white tabular-nums">{formatFCFA(c.budget)}</span>
                                                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Budget Alloué</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="flex items-center gap-4 bg-surface-100/50 dark:bg-surface-800/50 px-4 py-1.5 rounded-2xl border border-transparent group-hover:border-brand-500/10 transition-all">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[12px] font-black tubular-nums text-surface-900 dark:text-white">{c.impressions.toLocaleString()}</span>
                                                                <span className="text-[8px] font-black uppercase text-surface-400">Views</span>
                                                            </div>
                                                            <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[12px] font-black tubular-nums text-brand-500">{ctr}%</span>
                                                                <span className="text-[8px] font-black uppercase text-surface-400">CTR</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                            <TrendingUp size={10} /> +5.4% de conversion
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Badge variant={sb.variant} className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm", sb.color)}>
                                                            {sb.label}
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-surface-400 tabular-nums">
                                                            <Clock size={10} />
                                                            {new Date(c.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                                            {" → "}
                                                            {new Date(c.endsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {c.status === "pending" ? (
                                                            <Button
                                                                variant="brand"
                                                                size="sm"
                                                                onClick={() => updateStatus(c.id, "active")}
                                                                disabled={updating === c.id}
                                                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-brand-500/20 active:scale-95"
                                                            >
                                                                <Play size={14} fill="currentColor" /> Lancer
                                                            </Button>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm group-hover:scale-110">
                                                                <ArrowUpRight size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Ledger Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-12 py-10 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 gap-8">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-tight">
                                Segment Campagne {pagination.page} á {pagination.totalPages}
                            </p>
                            <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">Surveillance de {pagination.total} initiatives marketing</p>
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchCampaigns(pagination.page - 1)} 
                                disabled={pagination.page <= 1}
                                className="h-12 px-8 rounded-2xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-[0.2em] bg-white dark:bg-surface-900"
                            >
                                <ChevronLeft size={20} />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchCampaigns(pagination.page + 1)} 
                                disabled={pagination.page >= pagination.totalPages}
                                className="h-12 px-8 rounded-2xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-[0.2em] bg-white dark:bg-surface-900"
                            >
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Performance Insights */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-surface-900 to-black text-white relative overflow-hidden group shadow-2xl">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 text-brand-400">
                            <Zap size={20} className="fill-brand-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Efficiency Protocol</span>
                        </div>
                        <h3 className="text-4xl font-black tracking-tight leading-tight">Optimisation Algorithmique</h3>
                        <p className="text-surface-400 font-medium leading-relaxed text-lg">
                            Le ciblage intelligent a permis de réduire le coût d'acquisition client de 15% pour les partenaires Elite.
                        </p>
                        <div className="pt-4">
                            <Button variant="brand" className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-500/20 active:scale-95">
                                Analyser les segments
                            </Button>
                        </div>
                    </div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                </div>
                
                <div className="grid grid-rows-2 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-between group hover:border-brand-500/20 transition-all duration-500">
                        <div className="space-y-1">
                            <p className="text-3xl font-black tabular-nums text-surface-900 dark:text-white">84.2%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Push Conversion Rate</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Bell size={32} strokeWidth={1.5} />
                        </div>
                    </div>
                    
                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-between group hover:border-brand-500/20 transition-all duration-500">
                        <div className="space-y-1">
                            <p className="text-3xl font-black tabular-nums text-surface-900 dark:text-white">4.8M</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Total Impressions</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Eye size={32} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
