"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Search,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    AlertTriangle,
    Filter,
    ArrowUpRight,
    Calendar,
    Utensils,
    User,
    Info,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Admin Orders page — cross-restaurant view of all orders.
 */

interface OrderRow {
    id: string;
    restaurantName: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; icon: any; color: string }> = {
    pending: { label: "En attente", variant: "warning", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
    confirmed: { label: "Confirmée", variant: "info", icon: CheckCircle, color: "text-blue-500 bg-blue-500/10" },
    preparing: { label: "En préparation", variant: "info", icon: Utensils, color: "text-indigo-500 bg-indigo-500/10" },
    ready: { label: "Prête", variant: "success", icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
    delivering: { label: "En livraison", variant: "brand", icon: Truck, color: "text-brand-500 bg-brand-500/10" },
    delivered: { label: "Livrée", variant: "success", icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
    cancelled: { label: "Annulée", variant: "danger", icon: XCircle, color: "text-red-500 bg-red-500/10" },
    disputed: { label: "Litige", variant: "danger", icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10" },
};

// Placeholder data (matches the existing mock but extended for better feel)
const mockOrders: OrderRow[] = [
    { id: "ORD-001", restaurantName: "Le Tchop Gourmet", customerName: "Jean Kamga", total: 8500, status: "delivered", createdAt: "2026-03-04T14:30:00Z" },
    { id: "ORD-002", restaurantName: "Chez Mama", customerName: "Marie Ngo", total: 12000, status: "preparing", createdAt: "2026-03-04T15:12:00Z" },
    { id: "ORD-003", restaurantName: "Pizza Express", customerName: "Paul Mbarga", total: 6500, status: "pending", createdAt: "2026-03-04T15:45:00Z" },
    { id: "ORD-004", restaurantName: "Le Tchop Gourmet", customerName: "Aline Fotso", total: 15200, status: "delivering", createdAt: "2026-03-04T16:00:00Z" },
    { id: "ORD-005", restaurantName: "Saveurs du Cameroun", customerName: "Eric Njoh", total: 9800, status: "cancelled", createdAt: "2026-03-04T12:20:00Z" },
    { id: "ORD-006", restaurantName: "Burger Lab", customerName: "Sandra Etoudi", total: 7400, status: "disputed", createdAt: "2026-03-04T10:15:00Z" },
    { id: "ORD-007", restaurantName: "Pasta House", customerName: "Kevin Talla", total: 11000, status: "ready", createdAt: "2026-03-04T11:45:00Z" },
];

function formatFCFA(value: number) {
    return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function AdminOrdersPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredOrders = mockOrders.filter((o) => {
        const matchesQuery = !query || o.restaurantName.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()) || o.id.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "all" || o.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
                        Flux des Commandes
                    </h1>
                    <p className="text-surface-500 mt-1 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-brand-500" />
                        Vue globale de toutes les transactions de la plateforme
                    </p>
                </div>
                
                {/* Real-time status indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Live platform tracking</span>
                </div>
            </div>

            {/* Premium Info Banner */}
            <motion.div 
                variants={itemVariants}
                className="relative overflow-hidden group p-4 rounded-2xl bg-gradient-to-br from-brand-500/5 to-amber-500/5 border border-brand-500/10 shadow-sm transition-all hover:shadow-md"
            >
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <Info size={20} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-surface-900 dark:text-white">Environnement de Démonstration</p>
                        <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed max-w-2xl">
                            Les commandes affichées ici sont synchronisées depuis les bases de données tenant individuelles. 
                            Le moteur de routage global est actif. Certaines actions directes peuvent être restreintes en mode lecture seule.
                        </p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-500/10 transition-colors" />
            </motion.div>

            {/* Controls Bar */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800"
            >
                <div className="relative flex-1 w-full sm:w-auto">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par #ID, restaurant ou client..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-9 pr-8 py-3 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer transition-all"
                        >
                            <option value="all">Tous les statuts</option>
                            <optgroup label="Actives">
                                <option value="pending">En attente</option>
                                <option value="confirmed">Confirmée</option>
                                <option value="preparing">En préparation</option>
                                <option value="ready">Prête</option>
                                <option value="delivering">En livraison</option>
                            </optgroup>
                            <optgroup label="Finalisées">
                                <option value="delivered">Livrée</option>
                                <option value="cancelled">Annulée</option>
                                <option value="disputed">Litiges</option>
                            </optgroup>
                        </select>
                    </div>
                    <Button variant="outline" className="h-[44px] px-4 rounded-xl border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800">
                        <Calendar size={16} />
                    </Button>
                </div>
            </motion.div>

            {/* Orders Data Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                                <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-surface-400">Référence</th>
                                <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-surface-400">Origine Restaurant</th>
                                <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-surface-400">Client final</th>
                                <th className="text-right px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-surface-400">Montant</th>
                                <th className="text-center px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-surface-400">Statut actuel</th>
                                <th className="text-center px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-surface-400">Horodatage</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <AnimatePresence mode="popLayout">
                                {filteredOrders.length === 0 ? (
                                    <motion.tr 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={7} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3 text-surface-400">
                                                <div className="p-4 rounded-full bg-surface-50 dark:bg-surface-800">
                                                    <ShoppingBag size={40} strokeWidth={1.5} />
                                                </div>
                                                <p className="text-sm font-medium">Aucun enregistrement ne correspond à vos critères</p>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-brand-500 hover:text-brand-600"
                                                    onClick={() => { setQuery(""); setStatusFilter("all"); }}
                                                >
                                                    Réinitialiser les filtres
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    filteredOrders.map((o, idx) => {
                                        const sc = statusConfig[o.status] ?? statusConfig.pending;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <motion.tr 
                                                key={o.id} 
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="group hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-all cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[11px] font-bold text-surface-900 dark:text-white bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                                                            {o.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
                                                            <Utensils size={14} />
                                                        </div>
                                                        <span className="text-sm font-bold text-surface-900 dark:text-white line-clamp-1">{o.restaurantName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500">
                                                            <User size={14} />
                                                        </div>
                                                        <span className="text-sm font-medium text-surface-600 dark:text-surface-300 line-clamp-1">{o.customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white">{formatFCFA(o.total)}</p>
                                                    <p className="text-[10px] text-surface-400">Paiement Mobile</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <Badge variant={sc.variant} className={cn("gap-1.5 px-2.5 py-0.5 border-none shadow-sm", sc.color)}>
                                                            <StatusIcon size={12} strokeWidth={2.5} />
                                                            <span className="font-bold">{sc.label}</span>
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                                            {new Date(o.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                                        </p>
                                                        <p className="text-[10px] text-surface-400">
                                                            {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="p-2 rounded-lg hover:bg-brand-500/10 text-surface-400 hover:text-brand-500">
                                                            <ArrowUpRight size={18} />
                                                        </div>
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

                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-800/10 flex items-center justify-between">
                    <p className="text-xs text-surface-500 font-medium">Affichage de {filteredOrders.length} résultats</p>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled>
                            <ChevronLeft size={16} />
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            <span className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-brand-500/20">1</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled>
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
