"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Headset,
    ChevronLeft,
    ChevronRight,
    Eye,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Search,
    Filter,
    ArrowUpRight,
    LifeBuoy,
    Inbox,
    MessageCircle,
    ShieldAlert,
    Smile,
    HeartPulse,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TicketRow {
    id: string;
    reporterId: string | null;
    reporterType: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    restaurantId: string | null;
    orderId: string | null;
    createdAt: string;
    resolvedAt: string | null;
    reporterName: string | null;
    reporterEmail: string | null;
    assigneeName: string | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; icon: any; color: string }> = {
    open: { label: "Nouveau", variant: "warning", icon: Inbox, color: "text-amber-500 bg-amber-500/10" },
    in_progress: { label: "En cours", variant: "info", icon: Clock, color: "text-blue-500 bg-blue-500/10" },
    resolved: { label: "Résolu", variant: "success", icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
    closed: { label: "Fermé", variant: "default", icon: XCircle, color: "text-surface-400 bg-surface-100" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger"; color: string }> = {
    low: { label: "Basse", variant: "default", color: "bg-surface-100 text-surface-500" },
    medium: { label: "Moyenne", variant: "warning", color: "bg-blue-500/10 text-blue-500" },
    high: { label: "Haute", variant: "danger", color: "bg-orange-500/10 text-orange-600" },
    urgent: { label: "Urgente", variant: "danger", color: "bg-red-500/10 text-red-600" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const fetchTickets = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(priorityFilter !== "all" && { priority: priorityFilter }),
            });
            const res = await fetch(`/api/admin/support?${params}`);
            const json = await res.json();
            setTickets(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch {
            console.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, priorityFilter]);

    useEffect(() => {
        fetchTickets(1);
    }, [fetchTickets]);

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-500">
                        <LifeBuoy size={20} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Support Operations</span>
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                        HelpDesk Centralisé
                    </h1>
                    <p className="text-surface-500 font-medium max-w-2xl leading-relaxed">
                        Arbitrage des litiges, support technique aux restaurateurs et assistance client de niveau 2.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white dark:bg-surface-900 p-1.5 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
                    <div className="px-4 py-2 text-center border-r border-surface-100 dark:border-surface-800">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Actifs</p>
                        <p className="text-xl font-black text-brand-500">{pagination.total}</p>
                    </div>
                    <div className="px-4 py-2 text-center">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Priorité Haute</p>
                        <p className="text-xl font-black text-red-500">{tickets.filter(t => t.priority === "urgent" || t.priority === "high").length}</p>
                    </div>
                </div>
            </div>

            {/* Premium Controls */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800"
            >
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher un ticket (#ID, sujet, client)..."
                        className="w-full pl-12 pr-4 py-3 text-sm rounded-xl border-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-medium"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-48">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-9 pr-6 py-3 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer font-bold uppercase tracking-wider"
                        >
                            <option value="all">S: Tous</option>
                            <option value="open">S: Ouverts</option>
                            <option value="in_progress">S: En cours</option>
                            <option value="resolved">S: Résolus</option>
                        </select>
                    </div>

                    <div className="relative w-full sm:w-48">
                        <ShieldAlert size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full pl-9 pr-6 py-3 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer font-bold uppercase tracking-wider"
                        >
                            <option value="all">P: Toutes</option>
                            <option value="low">P: Basse</option>
                            <option value="medium">P: Moyenne</option>
                            <option value="high">P: Haute</option>
                            <option value="urgent">P: Urgente</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Tickets Ledger Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="text-left px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Objet du Ticket</th>
                                <th className="text-center px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Émetteur</th>
                                <th className="text-center px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Sévérité & Statut</th>
                                <th className="text-center px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-surface-400">Attribution</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800 text-surface-900 dark:text-white">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-8 py-6">
                                                <div className="h-10 bg-surface-100 dark:bg-surface-800 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : tickets.length === 0 ? (
                                    <motion.tr 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td colSpan={5} className="text-center py-24">
                                            <div className="flex flex-col items-center gap-4 text-surface-400">
                                                <div className="w-16 h-16 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center">
                                                    <Inbox size={32} strokeWidth={1.5} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black uppercase tracking-widest text-surface-900 dark:text-white">Boîte vide</p>
                                                    <p className="text-xs">Aucun ticket ne nécessite votre attention immédiate.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    tickets.map((t, idx) => {
                                        const sc = statusConfig[t.status] ?? statusConfig.open;
                                        const pc = priorityConfig[t.priority] ?? priorityConfig.medium;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <motion.tr 
                                                key={t.id} 
                                                layout
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-all cursor-pointer"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-transparent group-hover:border-brand-500/20 group-hover:bg-brand-500/10 transition-all", sc.color)}>
                                                            <StatusIcon size={24} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-black text-surface-900 dark:text-white mb-0.5 line-clamp-1 group-hover:text-brand-500 transition-colors uppercase tracking-tight">
                                                                {t.subject}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">#{t.id.slice(0, 8)}</span>
                                                                <span className="text-[10px] text-surface-400 font-medium truncate max-w-[200px]">
                                                                    {t.description}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-xl group-hover:bg-brand-500/5 transition-colors">
                                                            <User size={12} className="text-surface-400" />
                                                            <span className="text-[11px] font-black group-hover:text-brand-500 transition-colors">
                                                                {t.reporterName || "Utilisateur"}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{t.reporterType}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Badge variant={sc.variant} className={cn("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm", sc.color)}>
                                                            {sc.label}
                                                        </Badge>
                                                        <Badge variant={pc.variant} className={cn("px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border-none", pc.color)}>
                                                            Prop: {pc.label}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        {t.assigneeName ? (
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-brand-500/5 rounded-full border border-brand-500/20">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                                                <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase">{t.assigneeName}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full border border-dashed border-surface-200 dark:border-surface-700">
                                                                <span className="text-[10px] font-bold text-surface-400 italic">En attente</span>
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] text-surface-400 font-bold">
                                                            {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Link
                                                        href={`/admin/support/${t.id}`}
                                                        className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                    >
                                                        <ArrowUpRight size={20} />
                                                    </Link>
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
                    <div className="flex flex-col sm:flex-row items-center justify-between px-10 py-8 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 gap-6">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-surface-900 dark:text-white">
                                Vue {pagination.page} de {pagination.totalPages}
                            </p>
                            <p className="text-xs text-surface-400 font-medium">Affichage des tickets indexés par ordre de criticité</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => fetchTickets(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="h-11 px-5 rounded-xl border-surface-200 dark:border-surface-700 font-bold"
                            >
                                <ChevronLeft size={20} />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => fetchTickets(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="h-11 px-5 rounded-xl border-surface-200 dark:border-surface-700 font-bold"
                            >
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Support Statistics & SLA */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-brand-500/5 border border-brand-500/10 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center">
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">SLA Réponse</p>
                        <p className="text-xl font-black text-surface-900 dark:text-white">~ 14 mins</p>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Résolution</p>
                        <p className="text-xl font-black text-surface-900 dark:text-white">94.2 %</p>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-surface-900 dark:bg-surface-800 border border-surface-800 text-white flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-surface-700 flex items-center justify-center">
                        <Smile size={24} className="text-brand-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Satisfaction Agents</p>
                        <p className="text-xl font-black italic text-brand-400">Excellent</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

