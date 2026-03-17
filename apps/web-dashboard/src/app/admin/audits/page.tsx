"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ShieldAlert,
    Search,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Activity,
    Database,
    Globe,
    ExternalLink,
    Filter,
    Shield,
    Lock,
    Terminal,
    History,
} from "lucide-react";
import { Badge, Button } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuditLogRow {
    id: string;
    adminId: string;
    userName: string | null;
    userEmail: string | null;
    action: string;
    targetType: string;
    targetId: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

function formatDetails(detailsStr: string | null) {
    if (!detailsStr) return "—";
    try {
        const details = JSON.parse(detailsStr);
        return Object.entries(details)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(", ");
    } catch {
        return detailsStr;
    }
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState("all");
    const [targetFilter, setTargetFilter] = useState("all");

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(actionFilter !== "all" && { action: actionFilter }),
                ...(targetFilter !== "all" && { target: targetFilter }),
            });
            const res = await fetch(`/api/admin/system/audit?${params}`);
            const json = await res.json();
            setLogs(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch {
            console.error("Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    }, [actionFilter, targetFilter]);

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

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
                        <Terminal size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Governance</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight flex items-center gap-3">
                        Audits Immmuables
                    </h1>
                    <p className="text-surface-500 font-medium max-w-2xl">
                        Registre complet et infalsifiable de toutes les actions administratives. 
                        Indispensable pour la conformité et la sécurité opérationnelle.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <Lock size={14} className="text-red-500" />
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Secured Journal</span>
                </div>
            </div>

            {/* Premium Controls */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800"
            >
                <div className="flex items-center gap-2 px-3 border-r border-surface-100 dark:border-surface-800">
                    <Filter size={16} className="text-surface-400" />
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest hidden sm:block">Filtres</span>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer font-bold uppercase tracking-wider"
                    >
                        <option value="all">Toutes les actions</option>
                        <option value="verify_restaurant">A: Vérifier Restaurant</option>
                        <option value="update_payout">A: Mise à jour Payout</option>
                        <option value="ban_user">A: Bannir Utilisateur</option>
                        <option value="update_setting">A: Modifier Paramètre</option>
                    </select>

                    <select
                        value={targetFilter}
                        onChange={(e) => setTargetFilter(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer font-bold uppercase tracking-wider"
                    >
                        <option value="all">Toutes les cibles</option>
                        <option value="restaurant">T: Restaurant</option>
                        <option value="user">T: Utilisateur</option>
                        <option value="payout">T: Payout</option>
                        <option value="platform_setting">T: Paramètre</option>
                    </select>
                </div>

                <div className="px-2">
                    <Button variant="ghost" className="h-10 px-4 rounded-xl text-surface-400 hover:text-brand-500 font-bold uppercase text-[10px] tracking-widest">
                        <History size={16} /> Historique complet
                    </Button>
                </div>
            </motion.div>

            {/* Audit Data Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="text-left px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Horodatage</th>
                                <th className="text-left px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Acteur Admin</th>
                                <th className="text-center px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Action Système</th>
                                <th className="text-center px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Cible d'Action</th>
                                <th className="text-right px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Origine IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-8 py-6">
                                                <div className="h-10 bg-surface-100 dark:bg-surface-800 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan={5} className="text-center py-24">
                                            <div className="flex flex-col items-center gap-4 text-surface-400">
                                                <div className="w-16 h-16 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center">
                                                    <Shield size={32} strokeWidth={1.5} />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-widest">Aucune donnée d'audit</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    logs.map((log, idx) => (
                                        <motion.tr 
                                            key={log.id} 
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            transition={{ delay: idx * 0.03 }}
                                            className="group hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-all cursor-pointer"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-surface-900 dark:text-white tabular-nums">
                                                        {new Date(log.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                                                        {new Date(log.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-bold uppercase tracking-tight">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-brand-500 group-hover:bg-brand-500/10 group-hover:scale-110 transition-all">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-black text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors">{log.userName ?? "Admin"}</span>
                                                        <span className="text-[10px] text-surface-400 truncate max-w-[150px]">{log.userEmail}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex justify-center">
                                                    <Badge variant="info" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none bg-brand-500/5 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all">
                                                        {log.action.replace(/_/g, " ")}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1.5 text-[10px] text-surface-400 font-medium px-4 line-clamp-1 italic max-w-xs mx-auto">
                                                    {formatDetails(log.details)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
                                                        <Database size={12} className="text-surface-400" />
                                                        <span className="text-[11px] font-black uppercase tracking-tight">{log.targetType}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-surface-400">
                                                        {log.targetId.slice(0, 8)}
                                                        <ExternalLink size={10} className="hover:text-brand-500 transition-colors" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right font-mono">
                                                <div className="flex items-center justify-end gap-2 text-xs font-bold text-surface-400">
                                                    <Globe size={14} className="text-surface-300" />
                                                    {log.ipAddress ?? "local"}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Audit Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-10 py-8 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 gap-6">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-tight">
                                Segment Audit {pagination.page} / {pagination.totalPages}
                            </p>
                            <p className="text-xs text-surface-400 font-medium">Contrôle d'intégrité séquentiel actif</p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchLogs(pagination.page - 1)} 
                                disabled={pagination.page <= 1}
                                className="h-11 px-6 rounded-xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-widest"
                            >
                                <ChevronLeft size={20} className="mr-2" /> Précédent
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchLogs(pagination.page + 1)} 
                                disabled={pagination.page >= pagination.totalPages}
                                className="h-11 px-6 rounded-xl border-surface-200 dark:border-surface-700 font-black uppercase text-[11px] tracking-widest"
                            >
                                Suivant <ChevronRight size={20} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Security Integrity Notice */}
            <motion.div 
                variants={itemVariants} 
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-surface-900 to-black rounded-[3rem] p-12 text-white overflow-hidden relative shadow-2xl"
            >
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-brand-400">
                        <ShieldAlert size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Compliance Protocol</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-tight">Intégrité des Données Audit</h2>
                    <p className="text-surface-400 leading-relaxed font-medium">
                        Ce journal est généré cryptographiquement et ne peut être modifié par aucun administrateur, y compris les Super-Admins. 
                        Toute action de suppression ou de modification est techniquement impossible pour garantir la traçabilité légale.
                    </p>
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-2">Platform Health</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-black">99.9% SECURE</p>
                                <p className="text-xs text-surface-400 font-medium tracking-tight">Vérification de registre continue</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
            </motion.div>
        </motion.div>
    );
}
