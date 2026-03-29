"use client";

/**
 * /admin/suppliers — Registre des Fournisseurs Agricoles
 *
 * Liste tous les fournisseurs avec filtres (statut KYC, type, région)
 * + statistiques globales + actions rapides (activer/désactiver, impersonation)
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Leaf,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    ShieldCheck,
    ShieldAlert,
    ShieldOff,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Users,
    Package,
    TrendingUp,
    AlertTriangle,
    LogIn,
    ScanFace,
    Star,
    MapPin,
    RefreshCw,
} from "lucide-react";
import { Badge, Button, adminFetch, toast } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface Supplier {
    id: string;
    name: string;
    type: "individual_farmer" | "cooperative" | "wholesaler";
    contact_name: string;
    phone: string;
    email: string | null;
    region: string;
    locality: string;
    kyc_status: "pending" | "approved" | "rejected" | "suspended" | "documents_submitted";
    kyc_face_verified: boolean | null;
    kyc_face_score: number | null;
    kyc_confidence: "high" | "medium" | "low" | null;
    listing_tier: "free" | "basic" | "premium";
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    supplier_products?: { id: string }[];
    user_id: string;
}

interface Stats {
    pending_kyc: number;
    approved_suppliers: number;
    active_products: number;
    last_30_days: {
        transaction_count: number;
        total_volume_fcfa: number;
        total_platform_fees_fcfa: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    individual_farmer: "Agriculteur",
    cooperative: "Coopérative",
    wholesaler: "Grossiste",
};

const TIER_COLORS: Record<string, string> = {
    free: "bg-surface-100 dark:bg-surface-800 text-surface-500",
    basic: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    premium: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
};

// ── KYC Badge ──────────────────────────────────────────────────────────────

function KycBadge({ status }: { status: string }) {
    switch (status) {
        case "approved":
            return (
                <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">
                    <CheckCircle size={10} /> Approuvé
                </Badge>
            );
        case "rejected":
            return (
                <Badge variant="danger" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">
                    <XCircle size={10} /> Rejeté
                </Badge>
            );
        case "suspended":
            return (
                <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">
                    <ShieldOff size={10} /> Suspendu
                </Badge>
            );
        case "documents_submitted":
            return (
                <Badge variant="info" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">
                    <ShieldCheck size={10} /> Docs soumis
                </Badge>
            );
        default:
            return (
                <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm animate-pulse">
                    <Clock size={10} /> En attente
                </Badge>
            );
    }
}

// ── Face Score ──────────────────────────────────────────────────────────────

function FaceScore({ score, verified }: { score: number | null; verified: boolean | null }) {
    if (score === null) {
        return <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">—</span>;
    }
    const color =
        score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
    return (
        <div className="flex items-center gap-1.5">
            <ScanFace size={12} className={color} />
            <span className={cn("text-sm font-black tabular-nums", color)}>{score}%</span>
            {verified && <CheckCircle size={10} className="text-emerald-500" />}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0 });
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [kycFilter, setKycFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [toggling, setToggling] = useState<string | null>(null);

    // ── Fetch stats ──────────────────────────────────────────────────────

    useEffect(() => {
        adminFetch("/api/admin/marketplace/suppliers/stats")
            .then((r) => r.json())
            .then((j) => { if (j.success) setStats(j.stats); })
            .catch(() => {});
    }, []);

    // ── Fetch list ───────────────────────────────────────────────────────

    const fetchSuppliers = useCallback(
        async (page = 1) => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ page: String(page) });
                if (kycFilter !== "all") params.set("kyc_status", kycFilter);
                if (typeFilter !== "all") params.set("type", typeFilter);
                if (query.trim()) params.set("q", query.trim());

                const res = await adminFetch(`/api/admin/marketplace/suppliers?${params}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);

                setSuppliers(json.suppliers ?? []);
                setPagination(json.pagination ?? { page: 1, limit: 25, total: 0 });
            } catch (err: any) {
                setError(err.message || "Échec du chargement");
            } finally {
                setLoading(false);
            }
        },
        [query, kycFilter, typeFilter]
    );

    useEffect(() => {
        const t = setTimeout(() => fetchSuppliers(1), 300);
        return () => clearTimeout(t);
    }, [fetchSuppliers]);

    // ── Toggle active ────────────────────────────────────────────────────

    const toggleActive = async (id: string, current: boolean) => {
        setToggling(id);
        try {
            const res = await adminFetch(`/api/admin/marketplace/suppliers/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ is_active: !current }),
            });
            if (!res.ok) throw new Error();
            setSuppliers((prev) =>
                prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
            );
            toast.success("Statut mis à jour");
        } catch {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setToggling(null);
        }
    };

    // ── Impersonate ──────────────────────────────────────────────────────

    const impersonate = async (userId: string) => {
        try {
            const res = await adminFetch(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
            const json = await res.json();
            if (res.ok && json.magicLink) {
                toast.success("Ouverture du compte fournisseur…");
                window.open(json.magicLink, "_blank");
            } else {
                toast.error(json.error || "Échec de l'impersonation");
            }
        } catch {
            toast.error("Erreur réseau");
        }
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Leaf size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            Agricultural Supply Network
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                        Registre des{" "}
                        <span className="text-emerald-500">Fournisseurs</span>
                    </h1>
                    <p className="text-surface-500 font-medium max-w-2xl leading-relaxed">
                        Gestion centralisée des agriculteurs et coopératives partenaires — KYC, vérification
                        d'identité, tiers de mise en avant et surveillance des volumes.
                    </p>
                </div>

                {/* Quick stats pill */}
                <div className="flex items-center gap-0 bg-white dark:bg-surface-900 p-1.5 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm divide-x divide-surface-100 dark:divide-surface-800">
                    <div className="px-5 py-2 text-center">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-xl font-black text-surface-900 dark:text-white tabular-nums">{pagination.total}</p>
                    </div>
                    <div className="px-5 py-2 text-center">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">En attente</p>
                        <p className="text-xl font-black text-amber-500 tabular-nums">{stats?.pending_kyc ?? "…"}</p>
                    </div>
                    <div className="px-5 py-2 text-center">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Approuvés</p>
                        <p className="text-xl font-black text-emerald-500 tabular-nums">{stats?.approved_suppliers ?? "…"}</p>
                    </div>
                </div>
            </div>

            {/* ── Stats cards ────────────────────────────────────────── */}
            {stats && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<AlertTriangle size={22} />}
                        label="KYC en attente"
                        value={stats.pending_kyc}
                        colorClass="text-amber-500 bg-amber-500/10"
                    />
                    <StatCard
                        icon={<CheckCircle size={22} />}
                        label="Fournisseurs actifs"
                        value={stats.approved_suppliers}
                        colorClass="text-emerald-500 bg-emerald-500/10"
                    />
                    <StatCard
                        icon={<Package size={22} />}
                        label="Produits actifs"
                        value={stats.active_products}
                        colorClass="text-blue-500 bg-blue-500/10"
                    />
                    <StatCard
                        icon={<TrendingUp size={22} />}
                        label="Volume 30j (FCFA)"
                        value={stats.last_30_days.total_volume_fcfa.toLocaleString("fr-FR")}
                        colorClass="text-brand-500 bg-brand-500/10"
                    />
                </motion.div>
            )}

            {/* ── Filters toolbar ────────────────────────────────────── */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm"
            >
                <div className="relative flex-1 group">
                    <Search
                        size={20}
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-emerald-500 transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Filtrer par nom, région, contact…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-3.5 text-sm rounded-xl bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold placeholder:text-surface-400"
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* KYC filter */}
                    <div className="relative">
                        <ShieldCheck
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400"
                        />
                        <select
                            value={kycFilter}
                            onChange={(e) => setKycFilter(e.target.value)}
                            className="pl-10 pr-6 py-3.5 text-xs rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-emerald-500/10 outline-none cursor-pointer font-black uppercase tracking-widest"
                        >
                            <option value="all">KYC: Tous</option>
                            <option value="pending">KYC: En attente</option>
                            <option value="documents_submitted">KYC: Docs soumis</option>
                            <option value="approved">KYC: Approuvé</option>
                            <option value="rejected">KYC: Rejeté</option>
                            <option value="suspended">KYC: Suspendu</option>
                        </select>
                    </div>

                    {/* Type filter */}
                    <div className="relative">
                        <Filter
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400"
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="pl-10 pr-6 py-3.5 text-xs rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-emerald-500/10 outline-none cursor-pointer font-black uppercase tracking-widest"
                        >
                            <option value="all">Type: Tous</option>
                            <option value="individual_farmer">Agriculteur</option>
                            <option value="cooperative">Coopérative</option>
                            <option value="wholesaler">Grossiste</option>
                        </select>
                    </div>

                    <button
                        onClick={() => fetchSuppliers(pagination.page)}
                        className="flex items-center gap-2 px-5 py-3.5 text-xs rounded-xl bg-surface-50 dark:bg-surface-800/50 text-surface-500 hover:text-emerald-500 font-black uppercase tracking-widest transition-colors"
                    >
                        <RefreshCw size={14} />
                        Actualiser
                    </button>
                </div>
            </motion.div>

            {/* ── Table ──────────────────────────────────────────────── */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="text-left px-10 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">
                                    Fournisseur
                                </th>
                                <th className="text-left px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">
                                    Type / Région
                                </th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">
                                    Statut KYC
                                </th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">
                                    Face Score
                                </th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">
                                    Tier / Produits
                                </th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">
                                    Actif
                                </th>
                                <th className="text-right px-10 py-6" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {loading && suppliers.length === 0 ? (
                                    Array.from({ length: 6 }).map((_, idx) => (
                                        <tr key={idx} className="animate-pulse">
                                            <td colSpan={7} className="px-10 py-8">
                                                <div className="h-12 bg-surface-100 dark:bg-surface-800 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : error ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-32">
                                            <ErrorState message={error} onRetry={() => fetchSuppliers(1)} />
                                        </td>
                                    </tr>
                                ) : suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-32">
                                            <EmptyState />
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.map((s, idx) => (
                                        <motion.tr
                                            key={s.id}
                                            layout
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="group hover:bg-surface-50 dark:hover:bg-emerald-500/5 transition-all cursor-pointer"
                                        >
                                            {/* Name */}
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative shrink-0">
                                                        <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 uppercase font-black text-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        {s.is_featured && (
                                                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-surface-900">
                                                                <Star size={10} fill="currentColor" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <p className="text-sm font-black text-surface-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight truncate max-w-[180px]">
                                                            {s.name}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-surface-400 truncate">
                                                            {s.contact_name} · {s.phone}
                                                        </p>
                                                        <span className="text-[10px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded mt-1 w-fit uppercase">
                                                            #{s.id.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type / Region */}
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-black uppercase tracking-widest text-surface-700 dark:text-surface-300">
                                                        {TYPE_LABELS[s.type] ?? s.type}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-400">
                                                        <MapPin size={10} className="text-emerald-500" />
                                                        {s.region} · {s.locality}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* KYC status */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex justify-center">
                                                    <KycBadge status={s.kyc_status} />
                                                </div>
                                            </td>

                                            {/* Face score */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex justify-center">
                                                    <FaceScore score={s.kyc_face_score} verified={s.kyc_face_verified} />
                                                </div>
                                            </td>

                                            {/* Tier / Products */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                            TIER_COLORS[s.listing_tier]
                                                        )}
                                                    >
                                                        {s.listing_tier}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-surface-400">
                                                        {s.supplier_products?.length ?? 0} produits
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Active toggle */}
                                            <td className="px-6 py-6 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleActive(s.id, s.is_active);
                                                    }}
                                                    disabled={toggling === s.id}
                                                    className={cn(
                                                        "relative w-10 h-5 rounded-full transition-all duration-300 border-2",
                                                        s.is_active
                                                            ? "bg-emerald-500 border-emerald-500"
                                                            : "bg-surface-200 dark:bg-surface-700 border-surface-200 dark:border-surface-700"
                                                    )}
                                                    title={s.is_active ? "Désactiver" : "Activer"}
                                                >
                                                    <div
                                                        className={cn(
                                                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                                                            s.is_active ? "left-[22px]" : "left-0.5"
                                                        )}
                                                    />
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            impersonate(s.user_id);
                                                        }}
                                                        className="w-10 h-10 p-0 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                        title="Se connecter en tant que"
                                                    >
                                                        <LogIn size={18} />
                                                    </button>
                                                    <Link
                                                        href={`/admin/suppliers/${s.id}`}
                                                        className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90 group/btn"
                                                    >
                                                        <ArrowUpRight
                                                            size={22}
                                                            className="group-hover/btn:scale-110 transition-transform"
                                                        />
                                                    </Link>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-12 py-10 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 gap-8">
                        <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">
                            Page {pagination.page} / {totalPages} — {pagination.total} fournisseurs
                        </p>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSuppliers(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="h-12 px-8 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em]"
                            >
                                <ChevronLeft size={20} className="mr-2" /> Retour
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSuppliers(pagination.page + 1)}
                                disabled={pagination.page >= totalPages}
                                className="h-12 px-8 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em]"
                            >
                                Suivant <ChevronRight size={20} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    colorClass,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    colorClass: string;
}) {
    return (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 flex items-center gap-5 shadow-sm">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", colorClass)}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">{label}</p>
                <p className="text-2xl font-black text-surface-900 dark:text-white tabular-nums">{value}</p>
            </div>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center text-danger-500">
                <XCircle size={40} />
            </div>
            <div className="space-y-1 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-danger-600 dark:text-danger-400">
                    Erreur de chargement
                </p>
                <p className="text-xs text-surface-400 font-medium">{message}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="mt-4 border-danger-500/20 text-danger-500 hover:bg-danger-50 text-[10px] font-black uppercase tracking-widest px-6"
                >
                    Réessayer
                </Button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-200 dark:text-surface-700">
                <Leaf size={40} />
            </div>
            <div className="space-y-1 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-surface-900 dark:text-white">
                    Aucun fournisseur trouvé
                </p>
                <p className="text-xs text-surface-400 font-medium">
                    Affinez les filtres pour explorer le registre.
                </p>
            </div>
        </div>
    );
}
