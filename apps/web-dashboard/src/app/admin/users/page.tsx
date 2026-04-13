"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    UserCircle,
    Search,
    Store,
    Truck,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Eye,
    Phone,
    Users,
    Activity,
    UserPlus,
    Shield,
    Mail,
    Trash,
    Ban,
    UserCheck,
    Download,
} from "lucide-react";
import { Badge, Button, toast, adminFetch } from "@kbouffe/module-core/ui";
import { AddUserDialog } from "@/components/admin/users/AddUserDialog";
import { SensitiveField } from "@/components/admin/SensitiveField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdminUsers, useAdminStats } from "@/hooks/admin";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import type { AdminUserRow as UserRow } from "@/hooks/admin";
import { useDebounce } from "@/hooks/use-debounce";
import { DateRangePicker, type DateRange } from "@/components/admin/DateRangePicker";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ExportCSVButton } from "@/components/admin/ExportCSVButton";

const roleBadgeConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; color: string }> = {
    customer: { label: "Client", variant: "info", color: "text-blue-500 bg-blue-500/10" },
    merchant: { label: "Marchand", variant: "success", color: "text-emerald-500 bg-emerald-500/10" },
    driver: { label: "Livreur", variant: "warning", color: "text-amber-500 bg-amber-500/10" },
    admin: { label: "Admin", variant: "danger", color: "text-rose-500 bg-rose-500/10" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function AdminUsersPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
    const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isBulkBanOpen, setIsBulkBanOpen] = useState(false);

    const debouncedQuery = useDebounce(query, 300);

    const { users, total, page, totalPages, loading, refetch } = useAdminUsers({
        search: debouncedQuery || undefined,
        role: roleFilter !== "all" ? (roleFilter as "client" | "merchant" | "livreur" | "admin") : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
        page: currentPage,
        limit: 20,
    });
    const { stats: adminStats } = useAdminStats();
    const stats = adminStats?.users ?? null;
    const pagination = { page, total, totalPages, limit: 20 };

    const bulk = useBulkSelection(users);

    const activeFilterCount = useMemo(() => [
        debouncedQuery !== "",
        roleFilter !== "all",
        statusFilter !== "all",
        dateRange.from !== "" || dateRange.to !== "",
    ].filter(Boolean).length, [debouncedQuery, roleFilter, statusFilter, dateRange]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedQuery, roleFilter, statusFilter, dateRange]);

    const handleReset = () => {
        setQuery("");
        setRoleFilter("all");
        setStatusFilter("all");
        setDateRange({ from: "", to: "" });
        setCurrentPage(1);
    };

    const deleteUser = async (id: string) => {
        if (!userToDelete) return;

        try {
            const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Utilisateur supprimé");
                refetch();
                setIsConfirmDeleteOpen(false);
                setUserToDelete(null);
            } else {
                const err = await res.json();
                toast.error(err.error || "Erreur lors de la suppression");
            }
        } catch {
            toast.error("Erreur réseau");
        }
    };

    const openDeleteConfirm = (user: UserRow) => {
        setUserToDelete(user);
        setIsConfirmDeleteOpen(true);
    };

    const performBulkAction = async (action: "ban" | "unban") => {
        if (bulk.selectedCount === 0) return;
        try {
            await adminFetch("/api/admin/users/bulk", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: bulk.selectedIds, action }),
            });
            toast.success(
                action === "ban"
                    ? `${bulk.selectedCount} compte(s) suspendu(s)`
                    : `${bulk.selectedCount} compte(s) réactivé(s)`
            );
            bulk.clearSelection();
            refetch();
        } catch {
            toast.error("Erreur lors de l'opération");
        } finally {
            setIsBulkBanOpen(false);
        }
    };

    const exportUsersCsv = () => {
        const headers = ["ID", "Email", "Nom", "Rôle", "Inscrit le"];
        const rows = users.map((u) => [
            u.id,
            u.email,
            u.fullName ?? "",
            u.role,
            new Date(u.createdAt).toLocaleDateString("fr-FR"),
        ]);
        const csv = [headers, ...rows]
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getRoleIcon = (role: string) => {
        if (role === "merchant") return <Store size={14} />;
        if (role === "driver") return <Truck size={14} />;
        if (role === "admin") return <ShieldCheck size={14} />;
        return <UserCircle size={14} />;
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
                        <Users size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">User Directory</span>
                    </div>
                    <h1 className="text-5xl font-black text-surface-900 dark:text-white tracking-tight">
                        Gestion des <span className="text-brand-500">Profils</span>
                    </h1>
                    <p className="text-surface-500 font-medium max-w-xl text-lg leading-relaxed">
                        Surveillance, modération et analyse des {pagination.total.toLocaleString("fr-FR")} utilisateurs enregistrés sur la plateforme.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <ExportCSVButton data={users} filename="utilisateurs" />
                    <Button 
                        variant="outline" 
                        className="h-14 px-6 rounded-2xl border-surface-200 dark:border-surface-700 font-black uppercase text-[10px] tracking-widest gap-2 bg-white dark:bg-surface-900 shadow-sm"
                        onClick={() => setIsAddUserOpen(true)}
                    >
                        <UserPlus size={18} className="text-brand-500" /> Nouvel Utilisateur
                    </Button>
                </div>
            </div>

            {/* Premium Stat Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Plateforme" value={stats?.total ?? 0} color="surface" icon={Users} trend="+12% ce mois" />
                <StatCard label="Base Clients" value={stats?.customers ?? 0} color="brand" icon={UserCircle} active={roleFilter === "customer"} />
                <StatCard label="Marchands Actifs" value={stats?.merchants ?? 0} color="emerald" icon={Store} active={roleFilter === "merchant"} />
                <StatCard label="Flotte Livreurs" value={stats?.drivers ?? 0} color="amber" icon={Truck} active={roleFilter === "driver"} />
            </motion.div>

            {/* Smart Toolbar */}
            <motion.div variants={itemVariants}>
                <AdminFilterBar onReset={handleReset} activeFilterCount={activeFilterCount}>
                    {/* Row 1: Search + Role filter */}
                    <div className="flex flex-col lg:flex-row gap-3 w-full">
                        <div className="relative flex-1 group">
                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Rechercher par identité, contact ou rôle..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-3.5 text-sm rounded-2xl bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold placeholder:text-surface-400"
                            />
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                            {["all", "customer", "merchant", "driver", "admin"].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={cn(
                                        "px-4 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                                        roleFilter === role
                                            ? "bg-white dark:bg-surface-900 text-brand-500 shadow-sm border border-brand-500/10"
                                            : "text-surface-500 hover:text-surface-900 dark:hover:text-white"
                                    )}
                                >
                                    {role === "all" ? "Globale" : roleBadgeConfig[role]?.label || role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Status filter + Date range */}
                    <div className="flex flex-wrap items-end gap-4 w-full pt-3 border-t border-surface-100 dark:border-surface-800">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-0.5">Statut</span>
                            <div className="flex items-center gap-1 p-1 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                                {(["all", "active", "banned"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest",
                                            statusFilter === s
                                                ? "bg-white dark:bg-surface-900 text-brand-500 shadow-sm"
                                                : "text-surface-400 hover:text-surface-900 dark:hover:text-white"
                                        )}
                                    >
                                        {s === "all" ? "Tous" : s === "active" ? "Actif" : "Inactif"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <DateRangePicker
                            from={dateRange.from}
                            to={dateRange.to}
                            onChange={(r) => setDateRange(r)}
                            label="Inscription"
                        />
                    </div>
                </AdminFilterBar>
            </motion.div>

            {/* User Ledger Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="text-left px-10 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Identité & Profil</th>
                                <th className="text-left px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Points de Contact</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Statut & Rôle</th>
                                <th className="text-center px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Dernière Connexion</th>
                                <th className="px-10 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {loading && users.length === 0 ? (
                                    <AdminTableSkeleton rows={8} cols={6} />
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <AdminEmptyState
                                                title="Aucun profil ne correspond"
                                                description="Ajustez vos filtres ou votre recherche pour plus de résultats."
                                                action={{ label: "Nouvel Utilisateur", onClick: () => setIsAddUserOpen(true) }}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u, idx) => {
                                        const rc = roleBadgeConfig[u.role] ?? roleBadgeConfig.customer;
                                        return (
                                            <motion.tr 
                                                key={u.id} 
                                                layout
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className={cn(
                                                    "group hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-all cursor-pointer",
                                                    bulk.isSelected(u.id) && "bg-brand-500/5 dark:bg-brand-500/10"
                                                )}
                                            >
                                                <td className="pl-6 py-6" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={bulk.isSelected(u.id)}
                                                        onChange={() => bulk.toggleItem(u.id)}
                                                        className="w-4 h-4 rounded cursor-pointer accent-brand-500"
                                                    />
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative shrink-0">
                                                            <div className="w-14 h-14 rounded-[1.25rem] bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover:scale-110 transition-all duration-500 overflow-hidden shadow-sm border border-white/50 dark:border-surface-700">
                                                                {u.avatarUrl ? (
                                                                    <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserCircle size={32} strokeWidth={1} />
                                                                )}
                                                            </div>
                                                            <div className={cn(
                                                                "absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-surface-900",
                                                                rc.color
                                                            )}>
                                                                {getRoleIcon(u.role)}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-black text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors uppercase tracking-tight truncate max-w-[200px]">
                                                                {u.fullName || "Profil Privé"}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">#{u.id.slice(0, 10)}</span>
                                                                {u.adminRole && (
                                                                    <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 rounded-full uppercase border border-rose-500/10">PRIVILEGED: {u.adminRole}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg group-hover:bg-brand-500/5 transition-colors w-fit">
                                                            <Mail size={12} className="text-surface-400" />
                                                            <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300">{u.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg group-hover:bg-brand-500/5 transition-colors w-fit">
                                                            <Phone size={12} className="text-surface-400" />
                                                            <SensitiveField
                                                                value={u.phone ?? ""}
                                                                revealValue={u.phoneRaw ?? undefined}
                                                                visibleTo={["super_admin", "support"]}
                                                                className="text-[11px] font-bold text-surface-700 dark:text-surface-300"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Badge variant={rc.variant} className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] border-none shadow-sm shadow-current/10", rc.color)}>
                                                            {rc.label}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Inscrit le {new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <StatusBadge user={u} />
                                                </td>
                                                <td className="px-10 py-6 text-right flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/users/${u.id}`}
                                                        className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                                                    >
                                                        <Eye size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteConfirm(u);
                                                        }}
                                                        className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 group/btn-del"
                                                    >
                                                        <Trash size={20} className="group-hover/btn-del:scale-110 transition-transform" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Secure Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-12 py-10 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 gap-8">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-tight">
                                Visualisation {pagination.page} á {pagination.totalPages}
                            </p>
                            <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">Séquence d&apos;indexation {pagination.total} enregistrements</p>
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
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[3rem] bg-gradient-to-br from-surface-900 to-black text-white relative overflow-hidden group shadow-2xl">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 text-brand-400">
                            <Activity size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Intelligence</span>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight leading-tight">Croissance Utilisateurs</h3>
                        <p className="text-surface-400 font-medium leading-relaxed">
                            L&apos;activité moyenne par utilisateur a augmenté de 24% ce trimestre. 
                            Le taux de rétention des marchands est maintenu à 98.4%.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700" />
                </div>
                
                <div className="p-8 rounded-[3rem] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex flex-col justify-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Shield size={28} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-tight">Vérification Identity</p>
                            <p className="text-sm text-surface-400 font-bold uppercase tracking-wider">KYC Level 2 Enabled</p>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "86%" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-emerald-500" 
                        />
                    </div>
                    <p className="text-[11px] font-black text-surface-400 uppercase tracking-widest">86% des profils sont authentifiés avec succès</p>
                </div>
            </motion.div>

            <BulkActionBar
                selectedCount={bulk.selectedCount}
                onClearSelection={bulk.clearSelection}
                actions={[
                    {
                        label: "Suspendre",
                        icon: <Ban size={14} />,
                        onClick: () => setIsBulkBanOpen(true),
                        variant: "danger",
                    },
                    {
                        label: "Activer",
                        icon: <UserCheck size={14} />,
                        onClick: () => performBulkAction("unban"),
                    },
                    {
                        label: "Exporter",
                        icon: <Download size={14} />,
                        onClick: exportUsersCsv,
                    },
                ]}
            />

            <AddUserDialog 
                isOpen={isAddUserOpen} 
                onClose={() => setIsAddUserOpen(false)} 
                onSuccess={() => refetch()}
            />

            {isBulkBanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-surface-900 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 border border-surface-200 dark:border-surface-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <Ban size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-surface-900 dark:text-white">
                                    Suspendre {bulk.selectedCount} utilisateur{bulk.selectedCount > 1 ? "s" : ""} ?
                                </h3>
                                <p className="text-sm text-surface-400 font-medium">Cette action peut être annulée ultérieurement.</p>
                            </div>
                        </div>
                        <p className="text-surface-500 text-sm leading-relaxed">
                            Les utilisateurs sélectionnés ne pourront plus se connecter à la plateforme.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsBulkBanOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="danger" onClick={() => performBulkAction("ban")}>
                                Suspendre {bulk.selectedCount} compte{bulk.selectedCount > 1 ? "s" : ""}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {isConfirmDeleteOpen && userToDelete && (
                <ConfirmDialog
                    open={isConfirmDeleteOpen}
                    onClose={() => {
                        setIsConfirmDeleteOpen(false);
                        setUserToDelete(null);
                    }}
                    onConfirm={() => deleteUser(userToDelete.id)}
                    title="Supprimer le compte"
                    description={`Vous êtes sur le point de supprimer définitivement le compte de ${userToDelete.email}. Cette action est irréversible.`}
                    confirmLabel="Supprimer définitivement"
                    variant="danger"
                    requireTyping={userToDelete.emailRaw ?? userToDelete.email}
                />
            )}
        </motion.div>
    );
}

function StatusBadge({ user }: { user: { lastLoginAt: string | null } }) {
    return (
        <div className="flex flex-col items-center gap-2">
            {user.lastLoginAt ? (
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                    <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Actif</span>
                </div>
            ) : (
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-surface-300" />
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Dormant</span>
                </div>
            )}
            <span className="text-[10px] text-surface-400 font-bold tabular-nums">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit" }) : "Jamais"}
            </span>
        </div>
    );
}

function StatCard({ label, value, color, icon: Icon, trend, active }: { label: string; value: number; color: string; icon: React.ElementType; trend?: string; active?: boolean }) {
    const colorClasses: Record<string, string> = {
        brand: "bg-brand-500 text-white shadow-xl shadow-brand-500/30 ring-4 ring-brand-500/10",
        emerald: "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/10",
        amber: "bg-amber-500 text-white shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/10",
        surface: "bg-surface-900 text-white shadow-xl shadow-surface-500/30 ring-4 ring-surface-500/10",
    };

    return (
        <motion.div 
            whileHover={{ y: -8 }}
            className={cn(
                "p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden",
                active 
                    ? colorClasses[color]
                    : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-2xl"
            )}
        >
            <div className="flex items-start justify-between relative z-10 mb-6">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                    active ? "bg-white/20 scale-110" : "bg-surface-50 dark:bg-surface-800 text-surface-500 group-hover:text-brand-500 group-hover:scale-110"
                )}>
                    <Icon size={28} strokeWidth={1.5} />
                </div>
                {trend && (
                    <div className={cn(
                        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter",
                        active ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                        {trend}
                    </div>
                )}
            </div>
            
            <div className="relative z-10 space-y-1">
                <div className={cn(
                    "text-4xl font-black tabular-nums tracking-tighter",
                    active ? "text-white" : "text-surface-900 dark:text-white"
                )}>
                    {value.toLocaleString()}
                </div>
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    active ? "text-white/70" : "text-surface-400 group-hover:text-brand-500 transition-colors"
                )}>
                    {label}
                </p>
            </div>
            
            {!active && (
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            )}
        </motion.div>
    );
}
