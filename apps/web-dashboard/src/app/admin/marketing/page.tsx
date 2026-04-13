"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
    Megaphone, Plus, Search, X, ChevronLeft, ChevronRight, Store,
    MessageSquare, Bell, Image, Mail, Users, UserCheck, UserMinus,
    UserPlus, Calendar, BarChart3, TrendingUp, MousePointer,
    Eye, Wallet, Target, Play, Pause, StopCircle, Pencil,
    Activity, ArrowUpRight, Loader2, AlertCircle,
} from "lucide-react";
import { Badge, Button, Input, Textarea, Modal, adminFetch, toast } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdminQuery } from "@/hooks/use-admin-query";

// ── Types ─────────────────────────────────────────────────────────

interface CampaignRow {
    id: string;
    restaurantId: string;
    restaurantName: string | null;
    restaurantSlug: string | null;
    name: string | null;
    type: string;
    targetAudience: string;
    budget: number;
    spend: number;
    reach: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    content: string | null;
    ctaUrl: string | null;
    status: string;
    startsAt: string;
    endsAt: string;
    createdAt: string;
}

interface CampaignStats {
    campaign: { id: string; name: string | null; status: string; startsAt: string; endsAt: string };
    stats: {
        impressions: number; clicks: number; ctr: number;
        reach: number; spend: number; budget: number; budgetUsedPct: number;
        conversions: number; roi: number;
    };
}

interface RestaurantOption { id: string; name: string; slug: string; }

interface CampaignsResponse {
    data: CampaignRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface CreateForm {
    restaurant_id: string;
    name: string;
    type: "sms" | "push" | "banner" | "email";
    target_audience: "all" | "customers" | "inactive" | "new";
    budget: string;
    start_date: string;
    end_date: string;
    content: string;
    cta_url: string;
}

// ── Config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Play }> = {
    active:  { label: "Active",   color: "text-emerald-600 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800", icon: Play },
    paused:  { label: "Pausée",   color: "text-amber-600 bg-amber-500/10 border border-amber-200 dark:border-amber-800",       icon: Pause },
    ended:   { label: "Terminée", color: "text-surface-500 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700", icon: StopCircle },
    pending: { label: "En attente", color: "text-blue-600 bg-blue-500/10 border border-blue-200 dark:border-blue-800",         icon: Activity },
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
    sms:    { label: "SMS",     icon: MessageSquare, color: "text-purple-600 bg-purple-500/10" },
    push:   { label: "Push",    icon: Bell,          color: "text-blue-600 bg-blue-500/10" },
    banner: { label: "Bannière", icon: Image,        color: "text-brand-600 bg-brand-500/10" },
    email:  { label: "Email",   icon: Mail,          color: "text-rose-600 bg-rose-500/10" },
};

const AUDIENCE_CONFIG: Record<string, { label: string; icon: typeof Users }> = {
    all:       { label: "Tous",              icon: Users },
    customers: { label: "Clients existants", icon: UserCheck },
    inactive:  { label: "Clients inactifs",  icon: UserMinus },
    new:       { label: "Nouveaux clients",  icon: UserPlus },
};

function formatFCFA(v: number) {
    return new Intl.NumberFormat("fr-FR").format(v) + " FCFA";
}

function formatDate(iso: string) {
    try {
        const d = new Date(typeof iso === "number" ? iso : iso);
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return iso;
    }
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
};

// ── Skeleton row ─────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
                <td key={i} className="px-6 py-5">
                    <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded-lg" style={{ width: `${50 + (i * 13) % 45}%` }} />
                </td>
            ))}
        </tr>
    );
}

// ── Campaign detail slide-over ────────────────────────────────────

interface SlideOverProps {
    campaign: CampaignRow | null;
    onClose: () => void;
    onStatusChange: (id: string, status: string) => Promise<void>;
}

function CampaignSlideOver({ campaign, onClose, onStatusChange }: SlideOverProps) {
    const [stats, setStats] = useState<CampaignStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!campaign) { setStats(null); return; }
        setLoadingStats(true);
        adminFetch(`/api/admin/marketing/campaigns/${campaign.id}/stats`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setStats(d as CampaignStats | null))
            .catch(() => setStats(null))
            .finally(() => setLoadingStats(false));
    }, [campaign?.id]);

    if (!campaign) return null;

    const sc = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.pending;
    const tc = TYPE_CONFIG[campaign.type] ?? TYPE_CONFIG.banner;
    const TypeIcon = tc.icon;

    const now = Date.now();
    const start = new Date(campaign.startsAt).getTime();
    const end = new Date(campaign.endsAt).getTime();
    const total = end - start;
    const elapsed = Math.max(0, Math.min(now - start, total));
    const progressPct = total > 0 ? (elapsed / total) * 100 : 0;

    const handleStatus = async (newStatus: string) => {
        setUpdating(true);
        await onStatusChange(campaign.id, newStatus);
        setUpdating(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex">
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    key="panel"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 250 }}
                    className="ml-auto w-full max-w-xl h-full bg-white dark:bg-surface-900 shadow-2xl flex flex-col overflow-hidden relative z-10"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 p-6 border-b border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", tc.color)}>
                                <TypeIcon size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-black text-surface-900 dark:text-white truncate">
                                    {campaign.name ?? `Campagne ${campaign.id.slice(0, 8)}`}
                                </h2>
                                <p className="text-xs text-surface-500 font-medium">{campaign.restaurantName ?? campaign.restaurantId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Status badge + actions */}
                        <div className="flex items-center justify-between gap-4">
                            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest", sc.color)}>
                                <sc.icon size={12} />
                                {sc.label}
                            </span>
                            <div className="flex gap-2">
                                {campaign.status === "active" && (
                                    <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatus("paused")}
                                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5">
                                        {updating ? <Loader2 size={12} className="animate-spin" /> : <Pause size={12} />} Pause
                                    </Button>
                                )}
                                {campaign.status === "paused" && (
                                    <Button size="sm" variant="primary" disabled={updating} onClick={() => handleStatus("active")}
                                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5 shadow-lg shadow-brand-500/20">
                                        {updating ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Reprendre
                                    </Button>
                                )}
                                {campaign.status !== "ended" && (
                                    <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatus("ended")}
                                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5 text-rose-500 border-rose-200 hover:bg-rose-50">
                                        {updating ? <Loader2 size={12} className="animate-spin" /> : <StopCircle size={12} />} Terminer
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Campaign info */}
                        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-0.5">Type</p>
                                <p className="font-bold text-surface-900 dark:text-white">{tc.label}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-0.5">Audience</p>
                                <p className="font-bold text-surface-900 dark:text-white">{AUDIENCE_CONFIG[campaign.targetAudience]?.label ?? campaign.targetAudience}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-0.5">Budget</p>
                                <p className="font-bold text-surface-900 dark:text-white">{formatFCFA(campaign.budget)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-0.5">Dépensé</p>
                                <p className="font-bold text-surface-900 dark:text-white">{formatFCFA(campaign.spend)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-0.5">Début</p>
                                <p className="font-bold text-surface-900 dark:text-white">{formatDate(campaign.startsAt)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-0.5">Fin</p>
                                <p className="font-bold text-surface-900 dark:text-white">{formatDate(campaign.endsAt)}</p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Progression temporelle</p>
                            <div className="relative h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(100, progressPct)}%` }}
                                />
                                {progressPct > 0 && progressPct < 100 && (
                                    <div
                                        className="absolute top-0 h-full w-0.5 bg-white dark:bg-surface-900"
                                        style={{ left: `${progressPct}%` }}
                                    />
                                )}
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-surface-400 font-medium">
                                <span>{formatDate(campaign.startsAt)}</span>
                                <span>{formatDate(campaign.endsAt)}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        {loadingStats ? (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="animate-pulse h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
                                ))}
                            </div>
                        ) : stats ? (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Performances</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Portée", value: stats.stats.reach.toLocaleString("fr-FR"), icon: Users, color: "text-brand-500 bg-brand-500/10" },
                                        { label: "Impressions", value: stats.stats.impressions.toLocaleString("fr-FR"), icon: Eye, color: "text-blue-500 bg-blue-500/10" },
                                        { label: "Clics", value: stats.stats.clicks.toLocaleString("fr-FR"), icon: MousePointer, color: "text-purple-500 bg-purple-500/10" },
                                        { label: "CTR", value: `${stats.stats.ctr}%`, icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
                                        { label: "Conversions", value: stats.stats.conversions.toLocaleString("fr-FR"), icon: Target, color: "text-amber-500 bg-amber-500/10" },
                                        { label: "ROI estimé", value: `${stats.stats.roi}%`, icon: BarChart3, color: "text-rose-500 bg-rose-500/10" },
                                    ].map(s => {
                                        const SIcon = s.icon;
                                        return (
                                            <div key={s.label} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                                                    <SIcon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-surface-900 dark:text-white tabular-nums">{s.value}</p>
                                                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{s.label}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Budget progress */}
                                <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2 text-xs">
                                        <span className="font-bold text-surface-600 dark:text-surface-400">Budget utilisé</span>
                                        <span className="font-black text-surface-900 dark:text-white">{stats.stats.budgetUsedPct}%</span>
                                    </div>
                                    <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all", stats.stats.budgetUsedPct >= 90 ? "bg-rose-500" : stats.stats.budgetUsedPct >= 60 ? "bg-amber-500" : "bg-brand-500")}
                                            style={{ width: `${Math.min(100, stats.stats.budgetUsedPct)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-surface-400 font-medium">
                                        <span>{formatFCFA(stats.stats.spend)} dépensé</span>
                                        <span>{formatFCFA(stats.stats.budget)} budget</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Content preview */}
                        {campaign.content && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Contenu</p>
                                <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-700 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                                    {campaign.content}
                                </div>
                                {campaign.ctaUrl && (
                                    <a href={campaign.ctaUrl} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">
                                        <ArrowUpRight size={12} /> {campaign.ctaUrl}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ── Create Campaign Modal ─────────────────────────────────────────

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

function CreateCampaignModal({ isOpen, onClose, onCreated }: CreateModalProps) {
    const [form, setForm] = useState<CreateForm>({
        restaurant_id: "", name: "", type: "banner",
        target_audience: "all", budget: "", start_date: "", end_date: "",
        content: "", cta_url: "",
    });
    const [restaurantSearch, setRestaurantSearch] = useState("");
    const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
    const [loadingResto, setLoadingResto] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchRestaurants = useCallback((q: string) => {
        setLoadingResto(true);
        adminFetch(`/api/admin/restaurants?limit=30${q ? `&q=${encodeURIComponent(q)}` : ""}`)
            .then(r => r.json() as Promise<{ data?: RestaurantOption[] }>)
            .then(d => setRestaurants(d.data ?? []))
            .catch(() => setRestaurants([]))
            .finally(() => setLoadingResto(false));
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        fetchRestaurants("");
    }, [isOpen, fetchRestaurants]);

    const handleRestaurantSearch = (v: string) => {
        setRestaurantSearch(v);
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => fetchRestaurants(v), 300);
    };

    const set = <K extends keyof CreateForm>(k: K, v: CreateForm[K]) =>
        setForm(p => ({ ...p, [k]: v }));

    const selectedRestaurant = restaurants.find(r => r.id === form.restaurant_id);

    const handleSubmit = async () => {
        setError(null);
        const budget = parseInt(form.budget, 10);
        if (!form.restaurant_id) return setError("Veuillez sélectionner un restaurant");
        if (!form.name.trim()) return setError("Veuillez saisir un nom de campagne");
        if (!form.start_date || !form.end_date) return setError("Veuillez renseigner les dates");
        if (form.end_date <= form.start_date) return setError("La date de fin doit être après la date de début");
        if (!budget || budget <= 0) return setError("Veuillez saisir un budget valide");
        if (!form.content.trim()) return setError("Veuillez saisir le contenu de la campagne");

        setSubmitting(true);
        try {
            const res = await adminFetch("/api/admin/marketing/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurant_id: form.restaurant_id,
                    name: form.name.trim(),
                    type: form.type,
                    target_audience: form.target_audience,
                    budget,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    content: form.content.trim(),
                    cta_url: form.cta_url.trim() || null,
                }),
            });
            const json = await res.json() as { error?: string };
            if (!res.ok) {
                setError(json.error ?? "Erreur lors de la création");
                return;
            }
            toast.success(`Campagne "${form.name}" lancée avec succès !`);
            onCreated();
            onClose();
            setForm({ restaurant_id: "", name: "", type: "banner", target_audience: "all", budget: "", start_date: "", end_date: "", content: "", cta_url: "" });
        } catch {
            setError("Erreur de connexion au serveur");
        } finally {
            setSubmitting(false);
        }
    };

    const charCount = form.content.length;
    const TypeIcon = TYPE_CONFIG[form.type]?.icon ?? Image;
    const previewAudience = AUDIENCE_CONFIG[form.target_audience]?.label ?? form.target_audience;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Créer une campagne" size="xl"
            className="max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
                {/* Restaurant selector */}
                <div>
                    <label className="block text-sm font-black text-surface-700 dark:text-surface-300 mb-2 uppercase tracking-widest text-[11px]">
                        Restaurant *
                    </label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Rechercher un restaurant…"
                            value={selectedRestaurant ? selectedRestaurant.name : restaurantSearch}
                            onChange={e => {
                                set("restaurant_id", "");
                                handleRestaurantSearch(e.target.value);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                        {loadingResto && <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 animate-spin" />}
                    </div>
                    {!form.restaurant_id && restaurants.length > 0 && restaurantSearch !== "" && (
                        <div className="mt-1 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-xl overflow-hidden shadow-lg max-h-40 overflow-y-auto">
                            {restaurants.map(r => (
                                <button key={r.id} onClick={() => { set("restaurant_id", r.id); setRestaurantSearch(r.name); }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center gap-3">
                                    <Store size={14} className="text-surface-400 shrink-0" />
                                    <span className="font-medium text-surface-900 dark:text-white">{r.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Name */}
                <Input label="Nom de la campagne *" placeholder="Ex: Promo Ramadan 2026" value={form.name}
                    onChange={e => set("name", e.target.value)} maxLength={100} />

                {/* Type */}
                <div>
                    <label className="block text-sm font-black text-surface-700 dark:text-surface-300 mb-3 uppercase tracking-widest text-[11px]">Type de campagne *</label>
                    <div className="grid grid-cols-4 gap-2">
                        {(["sms", "push", "banner", "email"] as const).map(t => {
                            const tc = TYPE_CONFIG[t];
                            const TIcon = tc.icon;
                            return (
                                <button key={t} onClick={() => set("type", t)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center",
                                        form.type === t
                                            ? "border-brand-500 bg-brand-500/5 text-brand-600"
                                            : "border-surface-200 dark:border-surface-700 text-surface-500 hover:border-brand-300 hover:text-brand-500"
                                    )}>
                                    <TIcon size={20} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{tc.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Audience */}
                <div>
                    <label className="block text-sm font-black text-surface-700 dark:text-surface-300 mb-3 uppercase tracking-widest text-[11px]">Audience cible *</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(["all", "customers", "inactive", "new"] as const).map(a => {
                            const ac = AUDIENCE_CONFIG[a];
                            const AIcon = ac.icon;
                            return (
                                <button key={a} onClick={() => set("target_audience", a)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-left transition-all",
                                        form.target_audience === a
                                            ? "border-brand-500 bg-brand-500/5 text-brand-600"
                                            : "border-surface-200 dark:border-surface-700 text-surface-500 hover:border-brand-300 hover:text-brand-500"
                                    )}>
                                    <AIcon size={16} className="shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-wide">{ac.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Budget + dates */}
                <div className="grid grid-cols-3 gap-4">
                    <Input label="Budget (FCFA) *" type="number" placeholder="50000" value={form.budget}
                        onChange={e => set("budget", e.target.value)} min="1" step="1" />
                    <Input label="Date de début *" type="date" value={form.start_date}
                        onChange={e => set("start_date", e.target.value)} />
                    <Input label="Date de fin *" type="date" value={form.end_date}
                        onChange={e => set("end_date", e.target.value)} min={form.start_date} />
                </div>

                {/* Content */}
                <div>
                    <Textarea label="Contenu de la campagne *" placeholder="Rédigez votre message promotionnel…"
                        value={form.content} onChange={e => set("content", e.target.value)}
                        maxLength={500} rows={4}
                        hint={`${charCount}/500 caractères`} />
                </div>

                {/* CTA URL */}
                <Input label="URL d'action (optionnel)" placeholder="https://kbouffe.com/restaurant/…"
                    value={form.cta_url} onChange={e => set("cta_url", e.target.value)} />

                {/* Preview */}
                {form.content && (
                    <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Aperçu</p>
                        <div className="flex items-start gap-3">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", TYPE_CONFIG[form.type].color)}>
                                <TypeIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-surface-900 dark:text-white mb-1">
                                    {form.name || "Nom de la campagne"} · {previewAudience}
                                </p>
                                <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed break-words">
                                    {form.content}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-600 dark:text-rose-400">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-black uppercase text-[11px] tracking-widest">
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting}
                        className="flex-1 h-12 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-brand-500/20 gap-2">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                        Lancer la campagne
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ── Main page ─────────────────────────────────────────────────────

export default function AdminMarketingPage() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const params = new URLSearchParams({ page: String(page), limit: "20", status: statusFilter, type: typeFilter });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const { data, loading, error, refetch } = useAdminQuery<CampaignsResponse>(
        `/api/admin/marketing/campaigns?${params}`,
    );

    const campaigns = data?.data ?? [];
    const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

    // Derived stats
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
    const avgCtr = campaigns.length > 0
        ? (campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length).toFixed(2)
        : "0.00";

    const handleStatusChange = useCallback(async (id: string, status: string) => {
        setUpdatingStatus(id);
        try {
            const res = await adminFetch(`/api/admin/marketing/campaigns/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                toast.success("Statut mis à jour");
                refetch();
                if (selectedCampaign?.id === id) {
                    setSelectedCampaign(prev => prev ? { ...prev, status } : null);
                }
            } else {
                const j = await res.json() as { error?: string };
                toast.error(j.error ?? "Erreur lors de la mise à jour");
            }
        } catch {
            toast.error("Erreur de connexion au serveur");
        } finally {
            setUpdatingStatus(null);
        }
    }, [refetch, selectedCampaign]);

    const handleFilterChange = (key: string, value: string) => {
        setPage(1);
        if (key === "status") setStatusFilter(value);
        if (key === "type") setTypeFilter(value);
    };

    const stats = [
        { label: "Campagnes actives", value: activeCampaigns, icon: Activity, color: "text-emerald-500 bg-emerald-500/10" },
        { label: "Budget total engagé", value: formatFCFA(totalBudget), icon: Wallet, color: "text-brand-500 bg-brand-500/10" },
        { label: "Portée totale", value: totalReach.toLocaleString("fr-FR"), icon: Users, color: "text-blue-500 bg-blue-500/10" },
        { label: "CTR moyen", value: `${avgCtr}%`, icon: TrendingUp, color: "text-purple-500 bg-purple-500/10" },
    ];

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-500">
                        <Megaphone size={18} className="animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                        Marketing &amp; <span className="text-brand-500">Campagnes</span>
                    </h1>
                    <p className="text-surface-500 font-medium max-w-xl leading-relaxed">
                        Création, suivi et optimisation des campagnes publicitaires des marchands.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}
                    className="h-12 px-6 rounded-2xl font-black uppercase text-[11px] tracking-widest gap-2 shadow-xl shadow-brand-500/20 self-start lg:self-auto">
                    <Plus size={18} /> Créer une campagne
                </Button>
            </div>

            {/* Stats cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => {
                    const SIcon = s.icon;
                    return (
                        <div key={s.label}
                            className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 flex items-center gap-4">
                            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                                <SIcon size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl font-black text-surface-900 dark:text-white tabular-nums truncate">{loading ? "—" : s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-wider text-surface-400 leading-tight">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants}
                className="bg-white dark:bg-surface-900 p-3 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 px-2">Statut:</span>
                    {[["all", "Toutes"], ["active", "Actives"], ["paused", "Pausées"], ["ended", "Terminées"]].map(([v, l]) => (
                        <button key={v} onClick={() => handleFilterChange("status", v)}
                            className={cn(
                                "px-4 py-1.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                                statusFilter === v
                                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                    : "text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800",
                            )}>{l}</button>
                    ))}
                    <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 px-2">Type:</span>
                    {[["all", "Tous"], ["sms", "SMS"], ["push", "Push"], ["banner", "Bannière"], ["email", "Email"]].map(([v, l]) => (
                        <button key={v} onClick={() => handleFilterChange("type", v)}
                            className={cn(
                                "px-4 py-1.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                                typeFilter === v
                                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                    : "text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800",
                            )}>{l}</button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 px-2">Dates:</span>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-surface-400" />
                        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 text-xs rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        <span className="text-surface-400 text-xs">→</span>
                        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} min={dateFrom}
                            className="px-3 py-1.5 text-xs rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                                className="text-surface-400 hover:text-rose-500 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="font-medium text-sm">{error}</span>
                    <button onClick={refetch} className="ml-auto text-xs font-black uppercase tracking-widest underline hover:no-underline">Réessayer</button>
                </div>
            )}

            {/* Table */}
            <motion.div variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                {["Nom & Restaurant", "Type", "Audience", "Budget / Dépensé", "Impressions / CTR", "Statut", "Dates", ""].map(h => (
                                    <th key={h} className="text-left px-5 py-4 font-black text-[10px] uppercase tracking-[0.15em] text-surface-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-300 dark:text-surface-600">
                                                    <Megaphone size={32} strokeWidth={1.5} />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-widest text-surface-400">Aucune campagne trouvée</p>
                                                <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}
                                                    className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest gap-1.5">
                                                    <Plus size={14} /> Créer la première campagne
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : campaigns.map((campaign, idx) => {
                                    const sc = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.pending;
                                    const tc = TYPE_CONFIG[campaign.type] ?? TYPE_CONFIG.banner;
                                    const ac = AUDIENCE_CONFIG[campaign.targetAudience] ?? AUDIENCE_CONFIG.all;
                                    const TypeIcon = tc.icon;
                                    const AudienceIcon = ac.icon;
                                    const StatusIcon = sc.icon;
                                    const isUpdating = updatingStatus === campaign.id;

                                    return (
                                        <motion.tr key={campaign.id} layout
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }}
                                            className="group hover:bg-surface-50 dark:hover:bg-brand-500/5 transition-all cursor-pointer"
                                            onClick={() => setSelectedCampaign(campaign)}>
                                            {/* Name & Restaurant */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", tc.color)}>
                                                        <TypeIcon size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-surface-900 dark:text-white truncate max-w-[160px] group-hover:text-brand-500 transition-colors">
                                                            {campaign.name ?? `#${campaign.id.slice(0, 8)}`}
                                                        </p>
                                                        <p className="text-[11px] text-surface-500 font-medium truncate max-w-[160px]">
                                                            {campaign.restaurantName ?? campaign.restaurantId.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Type */}
                                            <td className="px-5 py-4">
                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest", tc.color)}>
                                                    <TypeIcon size={10} /> {tc.label}
                                                </span>
                                            </td>
                                            {/* Audience */}
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-surface-600 dark:text-surface-400">
                                                    <AudienceIcon size={12} className="shrink-0" />
                                                    {ac.label}
                                                </span>
                                            </td>
                                            {/* Budget */}
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-black text-surface-900 dark:text-white tabular-nums">{formatFCFA(campaign.budget)}</p>
                                                <p className="text-[11px] text-surface-400 tabular-nums">{formatFCFA(campaign.spend)} dépensé</p>
                                            </td>
                                            {/* Metrics */}
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-black text-surface-900 dark:text-white tabular-nums">{campaign.impressions.toLocaleString("fr-FR")}</p>
                                                <p className="text-[11px] font-bold text-brand-500 tabular-nums">CTR {campaign.ctr}%</p>
                                            </td>
                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest", sc.color)}>
                                                    <StatusIcon size={10} /> {sc.label}
                                                </span>
                                            </td>
                                            {/* Dates */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <p className="text-xs font-bold text-surface-600 dark:text-surface-400">
                                                    {formatDate(campaign.startsAt)}
                                                </p>
                                                <p className="text-xs text-surface-400">→ {formatDate(campaign.endsAt)}</p>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {campaign.status === "active" && (
                                                        <button
                                                            onClick={() => handleStatusChange(campaign.id, "paused")}
                                                            disabled={isUpdating}
                                                            title="Pause"
                                                            className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-50">
                                                            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
                                                        </button>
                                                    )}
                                                    {campaign.status === "paused" && (
                                                        <button
                                                            onClick={() => handleStatusChange(campaign.id, "active")}
                                                            disabled={isUpdating}
                                                            title="Reprendre"
                                                            className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 hover:bg-brand-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-50">
                                                            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedCampaign(campaign)}
                                                        title="Voir détails"
                                                        className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-400 hover:bg-brand-500 hover:text-white flex items-center justify-center transition-all">
                                                        <BarChart3 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                        <p className="text-xs font-bold text-surface-500">
                            Page {pagination.page} sur {pagination.totalPages} · {pagination.total} campagnes
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                                className="h-9 w-9 p-0 rounded-xl">
                                <ChevronLeft size={16} />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
                                className="h-9 w-9 p-0 rounded-xl">
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modals */}
            <CreateCampaignModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={refetch} />
            <CampaignSlideOver
                campaign={selectedCampaign}
                onClose={() => setSelectedCampaign(null)}
                onStatusChange={handleStatusChange}
            />
        </motion.div>
    );
}
