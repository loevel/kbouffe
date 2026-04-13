"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    Store,
    Search,
    CheckCircle,
    XCircle,
    Star,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    Shield,
    Crown,
    Filter,
    Activity,
    ArrowUpRight,
    MapPin,
    Utensils,
    Trash2,
    AlertTriangle,
    LogIn,
    ShieldCheck,
    ShieldOff,
    Power,
    Download,
} from "lucide-react";
import { Badge, Button, useLocale, toast, adminFetch } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useAdminRestaurants } from "@/hooks/admin";
import type { AdminRestaurantRow as Restaurant } from "@/hooks/admin";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ExportCSVButton } from "@/components/admin/ExportCSVButton";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

export default function AdminRestaurantsPage() {
    const { t } = useLocale();
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [kycStatusFilter, setKycStatusFilter] = useState("all");
    const [toggling, setToggling] = useState<string | null>(null);

    // Deletion state
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk action state
    const [bulkConfirmAction, setBulkConfirmAction] = useState<"block" | null>(null);

    const { restaurants, total, page, totalPages, loading, error, refetch } = useAdminRestaurants({
        search: debouncedQuery || undefined,
        status: statusFilter !== "all" ? (statusFilter as "active" | "blocked") : undefined,
        kyc_status: kycStatusFilter !== "all" ? (kycStatusFilter as "pending" | "approved" | "rejected" | "incomplete") : undefined,
        page: currentPage,
        limit: 20,
    });
    const pagination = { page, total, totalPages, limit: 20 };

    const bulk = useBulkSelection(restaurants);
    const selectAllRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, kycStatusFilter]);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = bulk.isIndeterminate;
        }
    }, [bulk.isIndeterminate]);

    useEffect(() => {
        bulk.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, query, statusFilter, kycStatusFilter]);

    const exportRestaurantsCsv = () => {
        const selected = restaurants.filter((r) => bulk.isSelected(r.id));
        const header = "ID,Nom,Slug,Ville,Type,KYC,Actif,Vérifié,Créé le\n";
        const rows = selected
            .map((r) =>
                [
                    r.id,
                    `"${r.name}"`,
                    r.slug,
                    `"${r.city}"`,
                    r.cuisineType,
                    r.kycStatus,
                    r.isActive ? "oui" : "non",
                    r.isVerified ? "oui" : "non",
                    r.createdAt,
                ].join(",")
            )
            .join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `restaurants_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const performBulkRestaurantAction = async (action: "approve_kyc" | "block" | "activate") => {
        if (bulk.selectedIds.length === 0) return;
        try {
            const res = await adminFetch("/api/admin/restaurants/bulk", {
                method: "PATCH",
                body: JSON.stringify({ ids: bulk.selectedIds, action }),
            });
            if (res.ok) {
                const json = await res.json();
                const labels: Record<string, string> = {
                    approve_kyc: "KYC approuvé",
                    block: "bloqué",
                    activate: "activé",
                };
                toast.success(`${json.count} restaurant(s) ${labels[action]}`);
                bulk.clearSelection();
                refetch();
            } else {
                const err = await res.json();
                toast.error(err.error || "Erreur lors de l'opération");
            }
        } catch {
            toast.error("Erreur réseau");
        }
        setBulkConfirmAction(null);
    };

    const toggleField = async (id: string, field: string, value: boolean) => {
        setToggling(id);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ [field]: value }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Update failed");
            }

            refetch();
            toast.success("Mise à jour réussie");
        } catch (err: any) {
            console.error("Toggle failed:", err);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setToggling(null);
        }
    };

    const deleteRestaurant = async () => {
        if (!restaurantToDelete) return;
        setIsDeleting(true);
        try {
            const res = await adminFetch(`/api/admin/restaurants/${restaurantToDelete.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Échec de la suppression");
            }

            refetch();
            toast.success("Restaurant supprimé avec succès");
            setIsConfirmDeleteOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
            setRestaurantToDelete(null);
        }
    };

    const handleImpersonate = async (userId: string) => {
        if (!userId) {
            toast.error("Propriétaire introuvable pour ce restaurant");
            return;
        }
        try {
            const res = await adminFetch(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
            const json = await res.json();
            if (res.ok && json.magicLink) {
                toast.success("Redirection vers le compte marchand...");
                window.open(json.magicLink, "_blank");
            } else {
                toast.error(json.error || "Échec de l'impersonation");
            }
        } catch {
            toast.error("Erreur réseau");
        }
    };

    const getKycBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm"><CheckCircle size={10} /> Approuvé</Badge>;
            case "rejected":
                return <Badge variant="danger" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm"><XCircle size={10} /> Rejeté</Badge>;
            default:
                return <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm animate-pulse">En attente</Badge>;
        }
    };

    const getComplianceBadge = (status?: string) => {
        switch (status) {
            case "compliant":
                return <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">Licences OK</Badge>;
            case "blocked":
                return <Badge variant="danger" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">Bloqué</Badge>;
            case "in_review":
                return <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">À vérifier</Badge>;
            default:
                return <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm">En attente</Badge>;
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-500">
                        <Store size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Merchant Ecosystem</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                        Registre des <span className="text-brand-500">Établissements</span>
                    </h1>
                    <p className="text-surface-500 font-medium max-w-2xl leading-relaxed">
                        Gestion centralisée du catalogue partenaire, vérification de conformité et surveillance des métriques de performance en temps réel.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white dark:bg-surface-900 p-1.5 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
                    <div className="px-5 py-2 text-center border-r border-surface-100 dark:border-surface-800">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-xl font-black text-surface-900 dark:text-white tabular-nums">{pagination.total}</p>
                    </div>
                    <div className="px-5 py-2 text-center">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Vérifiés</p>
                        <p className="text-xl font-black text-emerald-500 tabular-nums">84%</p>
                    </div>
                </div>
            </div>

            {/* Smart Filters Toolbar */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm"
            >
                <div className="relative flex-1 group">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Filtrer par enseigne, ville ou type de cuisine..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-3.5 text-sm rounded-xl bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold placeholder:text-surface-400"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-48">
                        <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-6 py-3.5 text-xs rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-brand-500/10 outline-none cursor-pointer font-black uppercase tracking-widest"
                        >
                            <option value="all">S: Tous les statuts</option>
                            <option value="active">S: Actifs</option>
                            <option value="blocked">S: Bloqués</option>
                        </select>
                    </div>

                    <div className="relative w-full sm:w-48">
                        <Shield size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                        <select
                            value={kycStatusFilter}
                            onChange={(e) => setKycStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-6 py-3.5 text-xs rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-brand-500/10 outline-none cursor-pointer font-black uppercase tracking-widest"
                        >
                            <option value="all">K: Tous statuts</option>
                            <option value="pending">K: En attente</option>
                            <option value="approved">K: Approuvés</option>
                            <option value="rejected">K: Rejetés</option>
                            <option value="incomplete">K: Incomplets</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Merchant Ledger Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="pl-6 py-6 w-12">
                                    <input
                                        type="checkbox"
                                        ref={selectAllRef}
                                        checked={bulk.isAllSelected}
                                        onChange={bulk.toggleAll}
                                        className="w-4 h-4 rounded cursor-pointer accent-brand-500"
                                    />
                                </th>
                                <th className="text-left px-10 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Établissement</th>
                                <th className="text-left px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Localisation</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Conformité KYC / licences</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Indice Performance</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Disponibilité</th>
                                <th className="text-right px-10 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {loading && restaurants.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="animate-pulse">
                                            <td colSpan={7} className="px-10 py-8">
                                                <div className="h-12 bg-surface-100 dark:bg-surface-800 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : error ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan={7} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center text-danger-500">
                                                    <XCircle size={40} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black uppercase tracking-widest text-danger-600 dark:text-danger-400">Erreur de chargement</p>
                                                    <p className="text-xs text-surface-400 font-medium">{error}</p>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => refetch()}
                                                        className="mt-4 border-danger-500/20 text-danger-500 hover:bg-danger-50 text-[10px] font-black uppercase tracking-widest px-6"
                                                    >
                                                        Réessayer
                                                    </Button>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : restaurants.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan={7} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-200 dark:text-surface-700">
                                                    <Store size={40} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black uppercase tracking-widest text-surface-900 dark:text-white">Aucun partenaire trouvé</p>
                                                    <p className="text-xs text-surface-400 font-medium">Affinez votre recherche pour explorer le catalogue.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    restaurants.map((r, idx) => (
                                        <motion.tr 
                                            key={r.id} 
                                            layout
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className={cn(
                                                "group hover:bg-surface-50 dark:hover:bg-brand-500/5 transition-all cursor-pointer",
                                                bulk.isSelected(r.id) && "bg-brand-500/5 dark:bg-brand-500/10"
                                            )}
                                        >
                                            <td className="pl-6 py-6" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={bulk.isSelected(r.id)}
                                                    onChange={() => bulk.toggleItem(r.id)}
                                                    className="w-4 h-4 rounded cursor-pointer accent-brand-500"
                                                />
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative shrink-0">
                                                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 uppercase font-black text-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                            {r.name.charAt(0)}
                                                        </div>
                                                        {r.isPremium && (
                                                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-surface-900 group-hover:animate-bounce">
                                                                <Crown size={12} fill="currentColor" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <p className="text-base font-black text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors uppercase tracking-tight truncate max-w-[200px]">{r.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded uppercase tabular-nums">#{r.id.slice(0, 8)}</span>
                                                            <span className="text-[10px] font-bold text-surface-400 italic">/{r.slug}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-surface-900 dark:text-white">
                                                        <MapPin size={12} className="text-brand-500" />
                                                        <span className="text-sm font-black tracking-tight">{r.city}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-surface-400">
                                                        <Utensils size={10} />
                                                        {r.cuisineType}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                    <div className="flex justify-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {getKycBadge(r.kycStatus)}
                                                            {getComplianceBadge(r.complianceStatus)}
                                                        </div>
                                                    </div>
                                                </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-1.5 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-2xl shadow-sm border border-transparent group-hover:border-amber-500/20 transition-all">
                                                        <Star size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                                                        <span className="text-sm font-black tabular-nums">{r.rating?.toFixed(1) ?? "0.0"}</span>
                                                        <span className="text-surface-400 text-[10px] font-bold">({r.reviewCount})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-surface-400">
                                                        <ShoppingBag size={12} />
                                                        {r.orderCount} Commandes
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleField(r.id, "isActive", !r.isActive); }}
                                                            disabled={toggling === r.id}
                                                            className={cn(
                                                                "relative w-10 h-5 rounded-full transition-all duration-300 border-2",
                                                                r.isActive ? "bg-emerald-500 border-emerald-500" : "bg-surface-200 dark:bg-surface-700 border-surface-200 dark:border-surface-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                                                                r.isActive ? "left-5.5" : "left-0.5"
                                                            )} />
                                                        </button>
                                                        <Badge variant={r.isActive ? "success" : "danger"} className="text-[10px] font-black uppercase tracking-widest border-none px-2 rounded-full">
                                                            {r.isActive ? "Online" : "Paused"}
                                                        </Badge>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleField(r.id, "isVerified", !r.isVerified); }}
                                                        disabled={toggling === r.id}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <Shield size={16} className={cn("transition-all", r.isVerified ? "text-brand-500 fill-brand-500/20" : "text-surface-200 dark:text-surface-700")} />
                                                        <span className={cn("text-[9px] font-black uppercase tracking-widest", r.isVerified ? "text-brand-500" : "text-surface-400")}>Verified Badge</span>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImpersonate(r.ownerId);
                                                        }}
                                                        className="w-10 h-10 p-0 rounded-xl text-brand-500 hover:bg-brand-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Se connecter en tant que"
                                                    >
                                                        <LogIn size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRestaurantToDelete(r);
                                                            setIsConfirmDeleteOpen(true);
                                                        }}
                                                        className="w-10 h-10 p-0 rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                    <Link
                                                        href={`/admin/restaurants/${r.id}`}
                                                        className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-90 group/btn"
                                                    >
                                                        <ArrowUpRight size={22} className="group-hover/btn:scale-110 transition-transform" />
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

                {/* Ledger Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-12 py-10 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 gap-8">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-tight">
                                Segment Merchant {pagination.page} à {pagination.totalPages}
                            </p>
                            <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">Indexé sur {pagination.total} établissements</p>
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => p - 1)} 
                                disabled={pagination.page <= 1}
                                className="h-12 px-8 rounded-2xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-[0.2em] bg-white dark:bg-surface-900 shadow-sm"
                            >
                                <ChevronLeft size={20} className="mr-2" /> Retour
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => p + 1)} 
                                disabled={pagination.page >= pagination.totalPages}
                                className="h-12 px-8 rounded-2xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-[0.2em] bg-white dark:bg-surface-900 shadow-sm"
                            >
                                Suivant <ChevronRight size={20} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Platform Insights */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[3rem] bg-brand-500/5 border border-brand-500/10 flex items-center gap-6 group hover:bg-brand-500/10 transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.75rem] bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                        <Activity size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">Activité Réseau</p>
                        <p className="text-2xl font-black text-surface-900 dark:text-white">HAUTE Flux</p>
                    </div>
                </div>
                
                <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6 group hover:bg-emerald-500/10 transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.75rem] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Qualité Service</p>
                        <p className="text-2xl font-black text-surface-900 dark:text-white">OPTIMAL Grade</p>
                    </div>
                </div>

                <div className="p-8 rounded-[3rem] bg-surface-900 text-white flex items-center gap-6 relative overflow-hidden group shadow-2xl">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Platform Status</p>
                        <p className="text-2xl font-black italic tracking-tight">TOTAL SECURED</p>
                    </div>
                    <Shield size={64} className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-150 transition-transform duration-1000" />
                </div>
            </motion.div>

            <BulkActionBar
                selectedCount={bulk.selectedCount}
                onClearSelection={bulk.clearSelection}
                actions={[
                    {
                        label: "Approuver KYC",
                        icon: <ShieldCheck size={14} />,
                        onClick: () => performBulkRestaurantAction("approve_kyc"),
                    },
                    {
                        label: "Activer",
                        icon: <Power size={14} />,
                        onClick: () => performBulkRestaurantAction("activate"),
                    },
                    {
                        label: "Bloquer",
                        icon: <ShieldOff size={14} />,
                        onClick: () => setBulkConfirmAction("block"),
                        variant: "danger",
                    },
                    {
                        label: "Exporter",
                        icon: <Download size={14} />,
                        onClick: exportRestaurantsCsv,
                    },
                ]}
            />

            {/* Bulk Block Confirmation */}
            {bulkConfirmAction === "block" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 border border-surface-200 dark:border-surface-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-surface-900 dark:text-white">
                                    Bloquer {bulk.selectedCount} établissement{bulk.selectedCount > 1 ? "s" : ""} ?
                                </h3>
                                <p className="text-sm text-surface-400 font-medium">Les restaurants seront désactivés.</p>
                            </div>
                        </div>
                        <p className="text-surface-500 text-sm leading-relaxed">
                            Ces établissements ne seront plus visibles par les clients sur la plateforme.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setBulkConfirmAction(null)}>
                                Annuler
                            </Button>
                            <Button
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => performBulkRestaurantAction("block")}
                            >
                                Bloquer {bulk.selectedCount} restaurant{bulk.selectedCount > 1 ? "s" : ""}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isConfirmDeleteOpen && restaurantToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsConfirmDeleteOpen(false)}
                            className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-surface-900 rounded-[2.5rem] shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden"
                        >
                            <div className="p-8 sm:p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                        <AlertTriangle size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">Supprimer l&apos;établissement ?</h3>
                                        <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Action Irréversible</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                                        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed font-medium">
                                            Vous êtes sur le point de supprimer définitivement <strong className="text-surface-900 dark:text-white font-black">{restaurantToDelete.name}</strong> du registre des établissements.
                                        </p>
                                    </div>
                                    <p className="text-xs text-surface-400 leading-relaxed font-medium pl-2 border-l-2 border-brand-500/20">
                                        Toutes les données associées, y compris le catalogue et les configurations spécifiques, seront perdues.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsConfirmDeleteOpen(false)}
                                        className="flex-1 h-14 rounded-2xl border-surface-200 dark:border-surface-800 font-black uppercase text-xs tracking-widest"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={deleteRestaurant}
                                        disabled={isDeleting}
                                        className="flex-1 h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                                    >
                                        {isDeleting ? "Suppression..." : "Confirmer"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
