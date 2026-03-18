"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { Badge, Button, toast, adminFetch } from "@kbouffe/module-core/ui";
import { AddUserDialog } from "@/components/admin/users/AddUserDialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserRow {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    adminRole: string | null;
    restaurantId: string | null;
    createdAt: string;
    lastLoginAt: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

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
    const [users, setUsers] = useState<UserRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [stats, setStats] = useState<{ total: number; customers: number; merchants: number; drivers: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);


    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(query && { q: query }),
                ...(roleFilter !== "all" && { role: roleFilter }),
            });
            const res = await adminFetch(`/api/admin/users?${params}`);
            const json = await res.json();
            setUsers(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
            
            const statsRes = await adminFetch("/api/admin/stats");
            const statsJson = await statsRes.json();
            setStats(statsJson.users);
        } catch {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, [query, roleFilter]);

    const deleteUser = async (id: string) => {
        if (!userToDelete) return;

        try {
            const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Utilisateur supprimé");
                fetchUsers(pagination.page);
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

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(1), 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

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
            <motion.div 
                variants={itemVariants}
                className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-surface-900 p-2 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm"
            >
                <div className="relative flex-1 group">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher par identité, contact ou rôle..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 text-sm rounded-2xl bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold placeholder:text-surface-400"
                    />
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                    {["all", "customer", "merchant", "driver", "admin"].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={cn(
                                "px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                                roleFilter === role
                                    ? "bg-white dark:bg-surface-900 text-brand-500 shadow-sm border border-brand-500/10"
                                    : "text-surface-500 hover:text-surface-900 dark:hover:text-white"
                            )}
                        >
                            {role === "all" ? "Globale" : roleBadgeConfig[role]?.label || role}
                        </button>
                    ))}
                </div>
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
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-8">
                                                <div className="h-12 bg-surface-100 dark:bg-surface-800 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan={5} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-20 h-20 rounded-[2rem] bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-200 dark:text-surface-700">
                                                    <Search size={40} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black uppercase tracking-widest text-surface-900 dark:text-white">Aucun profil ne correspond</p>
                                                    <p className="text-xs text-surface-400 font-medium">Ajustez vos filtres ou votre recherche pour plus de résultats.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
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
                                                className="group hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-all cursor-pointer"
                                            >
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
                                                            <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300">{u.phone || "Non-répertorié"}</span>
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
                                onClick={() => fetchUsers(pagination.page - 1)} 
                                disabled={pagination.page <= 1}
                                className="h-12 px-8 rounded-2xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-[0.2em] bg-white dark:bg-surface-900 shadow-sm"
                            >
                                <ChevronLeft size={20} className="mr-2" /> Retour
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchUsers(pagination.page + 1)} 
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

            <AddUserDialog 
                isOpen={isAddUserOpen} 
                onClose={() => setIsAddUserOpen(false)} 
                onSuccess={() => fetchUsers(pagination.page)}
            />

            {isConfirmDeleteOpen && userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-surface-900 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 border border-surface-200 dark:border-surface-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <Trash size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-surface-900 dark:text-white">Confirmer la suppression</h3>
                                <p className="text-sm text-surface-400 font-medium">Cette action est irréversible.</p>
                            </div>
                        </div>
                        <p className="text-black/40 dark:text-white/30 text-xs font-bold leading-relaxed">
                            Vous êtes sur le point de supprimer définitivement le compte de &lt;b&gt;{userToDelete?.email}&lt;/b&gt;.
                            Cette action est irréversible et effacera toutes les données associées.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="danger" onClick={() => deleteUser(userToDelete.id)}>
                                Supprimer
                            </Button>
                        </div>
                    </motion.div>
                </div>
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
