"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Wallet,
    TrendingUp,
    BadgeDollarSign,
    ArrowRight,
    Clock,
    CheckCircle,
    BarChart3,
    ArrowUpRight,
    Search,
    Filter,
} from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

interface BillingStats {
    payouts: {
        total: number;
        totalAmount: number;
        pending: number;
        pendingAmount: number;
        completed: number;
        completedAmount: number;
    };
    transactions: { total: number };
    commissionRevenue: number;
    totalCommission: number;
}

function formatFCFA(val: number) {
    return new Intl.NumberFormat("fr-FR").format(val) + " FCFA";
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    iconColor,
    index,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: any;
    iconColor: string;
    index: number;
}) {
    return (
        <motion.div 
            variants={itemVariants}
            className="group relative bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 p-8 flex flex-col gap-6 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500"
        >
            <div className="flex items-start justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500", iconColor)}>
                    <Icon size={28} strokeWidth={1.5} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 group-hover:text-brand-500 transition-colors">{label}</p>
                    <p className="text-3xl font-black text-surface-900 dark:text-white mt-1 tabular-nums tracking-tight">{value}</p>
                </div>
            </div>
            
            {sub && (
                <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">{sub}</span>
                    <ArrowUpRight size={14} className="text-surface-300 group-hover:text-brand-500 transition-colors" />
                </div>
            )}
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </motion.div>
    );
}

export default function AdminBillingPage() {
    const { t } = useLocale();
    const [stats, setStats] = useState<BillingStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await adminFetch("/api/admin/billing/stats");
                if (res.ok) setStats(await res.json());
            } catch (err) {
                console.error("Failed to load billing stats:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const s = stats;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-12 pb-20"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-surface-100 dark:border-surface-800 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-500 mb-1">
                        <TrendingUp size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">Financial Hub</span>
                    </div>
                    <h1 className="text-5xl font-black text-surface-900 dark:text-white tracking-tighter">
                        {t.adminNav?.billing || "Trésorerie Plateforme"}
                    </h1>
                    <p className="text-surface-500 text-lg font-medium leading-relaxed max-w-2xl">
                        Monitorisation en temps réel des flux monétaires, commissions marchandes et cycles de reversement.
                    </p>
                </div>
                
                <AnimatePresence>
                    {!loading && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-1 rounded-2xl flex items-center gap-1 shadow-sm"
                        >
                            <Button variant="ghost" size="sm" className="rounded-xl h-10 px-4 font-bold text-surface-500 hover:text-brand-500">Hebdomadaire</Button>
                            <Button variant="primary" size="sm" className="rounded-xl h-10 px-4 font-black shadow-lg shadow-brand-500/20">Mensuel</Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-44 bg-surface-100 dark:bg-surface-800 rounded-[2rem]" />
                    ))}
                </div>
            ) : (
                <div className="space-y-12 text-surface-900 dark:text-white">
                    {/* Main Analytics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <KpiCard
                            label="Revenus Net Commission"
                            value={formatFCFA(s?.commissionRevenue ?? 0)}
                            sub="Propriété Plateforme"
                            icon={BadgeDollarSign}
                            iconColor="bg-brand-500 text-white shadow-xl shadow-brand-500/20"
                            index={0}
                        />
                        <KpiCard
                            label="Volume en attente"
                            value={formatFCFA(s?.payouts.pendingAmount ?? 0)}
                            sub={`${s?.payouts.pending ?? 0} demandes actives`}
                            icon={Clock}
                            iconColor="bg-amber-500 text-white shadow-xl shadow-amber-500/20"
                            index={1}
                        />
                        <KpiCard
                            label="Déboursés Effectués"
                            value={formatFCFA(s?.payouts.completedAmount ?? 0)}
                            sub="Reversements validés"
                            icon={CheckCircle}
                            iconColor="bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                            index={2}
                        />
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div 
                            variants={itemVariants}
                            className="bg-surface-900 dark:bg-surface-900/50 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/5"
                        >
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black">Audit Historique</h3>
                                    <BarChart3 className="text-brand-500" size={32} />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-surface-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Payouts</p>
                                        <p className="text-3xl font-bold">{s?.payouts.total ?? 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-surface-400 text-[10px] font-black uppercase tracking-widest mb-1">Volume Global</p>
                                        <p className="text-3xl font-bold">{formatFCFA(s?.payouts.totalAmount ?? 0)}</p>
                                    </div>
                                </div>
                                <Button className="w-full h-14 bg-white text-black hover:bg-surface-200 rounded-2xl font-black text-base shadow-2xl">
                                    Télécharger le rapport financier .XLS
                                </Button>
                            </div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mb-32 blur-3xl" />
                        </motion.div>

                        <motion.div 
                            variants={itemVariants}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                            <KpiCard
                                label="Commissions Brutes"
                                value={formatFCFA(s?.totalCommission ?? 0)}
                                sub="Historique global"
                                icon={TrendingUp}
                                iconColor="bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                                index={3}
                            />
                            <KpiCard
                                label="Audit Ledger"
                                value={String(s?.transactions.total ?? 0)}
                                sub="Écritures comptables"
                                icon={BarChart3}
                                iconColor="bg-purple-600 text-white shadow-xl shadow-purple-600/20"
                                index={4}
                            />
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Service Access Hub */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link
                    href="/admin/billing/payouts"
                    className="group bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 p-10 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500"
                >
                    <div className="flex flex-col gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                            <Wallet size={32} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">Gestion des Payouts</h3>
                            <p className="text-surface-500 text-lg leading-relaxed font-medium">
                                Validez les demandes de reversement des restaurateurs et monitorez la vélocité des paiements partenaires.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-brand-500 font-black text-sm group-hover:gap-4 transition-all uppercase tracking-widest">
                            Accéder à la console <ArrowRight size={20} />
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/billing/transactions"
                    className="group bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 p-10 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500"
                >
                    <div className="flex flex-col gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 group-hover:-rotate-6">
                            <BarChart3 size={32} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">Registre Ledger</h3>
                            <p className="text-surface-500 text-lg leading-relaxed font-medium">
                                Audit granulaire de chaque commission prélevée et traçabilité complète des écritures de trésorerie.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-purple-500 font-black text-sm group-hover:gap-4 transition-all uppercase tracking-widest">
                            Consulter le registre <ArrowRight size={20} />
                        </div>
                    </div>
                </Link>
            </motion.div>
        </motion.div>
    );
}
