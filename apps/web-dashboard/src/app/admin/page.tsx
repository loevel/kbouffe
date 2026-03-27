"use client";

import { useEffect, useState } from "react";
import {
    Store,
    Users,
    ShoppingBag,
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Star,
    Truck,
    ArrowUpRight,
    Activity,
    Shield,
    Zap,
    LayoutDashboard,
    Brain,
    Package,
} from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { useAdmin } from "@/components/providers/AdminProvider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge, Button, adminFetch } from "@kbouffe/module-core/ui";

interface PlatformStats {
    restaurants: { total: number; active: number; pending: number };
    users: { total: number; customers: number; merchants: number; drivers: number };
    metrics: { gmv: number; totalOrders: number; avgOrderValue: number };
    saas: { mrr: number; restaurantsWithPacks: number; packAdoptionRate: number; activeSubscriptions: number };
    aiUsage: { todayCalls: number; monthCalls: number };
    recentActivity: {
        newRestaurants: Array<{
            id: string;
            name: string;
            isActive: boolean;
            createdAt: string;
        }>;
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface KpiCardProps {
    label: string;
    value: string;
    sub?: string;
    icon: typeof Store;
    variant: "brand" | "blue" | "emerald" | "amber";
}

function KpiCard({ label, value, sub, icon: Icon, variant }: KpiCardProps) {
    const variants = {
        brand: "bg-brand-500/10 text-brand-500 shadow-brand-500/5",
        blue: "bg-blue-500/10 text-blue-500 shadow-blue-500/5",
        emerald: "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5",
        amber: "bg-amber-500/10 text-amber-500 shadow-amber-500/5",
    };

    return (
        <motion.div 
            variants={itemVariants}
            className="group bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 p-8 flex items-start gap-6 hover:border-brand-500/20 transition-all duration-500 shadow-sm"
        >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", variants[variant])}>
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-3xl font-black text-surface-900 dark:text-white tabular-nums tracking-tight">{value}</p>
                {sub && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{sub}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function AdminDashboardPage() {
    const { t } = useLocale();
    const { adminRole } = useAdmin();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await adminFetch("/api/admin/stats");
                if (res.ok) setStats(await res.json());
            } catch (err) {
                console.error("Failed to fetch admin stats:", err);
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
            className="space-y-10 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-surface-100 dark:border-surface-800">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-500">
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Controller</span>
                    </div>
                    <h1 className="text-5xl font-black text-surface-900 dark:text-white tracking-tight">
                        {t.admin?.greeting ?? "Command"} <span className="text-brand-500">Center</span>
                    </h1>
                    <p className="text-surface-500 font-medium max-w-xl text-lg leading-relaxed">
                        Interface de pilotage stratégique de KBouffe. Monitoring global des indicateurs clés et surveillance du réseau partenaire.
                    </p>
                </div>
                
                <div className="hidden lg:flex items-center gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
                    <div className="px-6 py-2 text-center border-r border-surface-100 dark:border-surface-800">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Systems</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm font-black text-surface-900 dark:text-white">Active</p>
                        </div>
                    </div>
                    <div className="px-6 py-2 text-center">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-0.5">Security</p>
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-brand-500" />
                            <p className="text-sm font-black text-surface-900 dark:text-white">Hardened</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-44 bg-white dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Main KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                        <KpiCard
                            label="Répertoire Marchand"
                            value={`${s?.restaurants.active ?? 0} / ${s?.restaurants.total ?? 0}`}
                            sub={`${s?.restaurants.pending ?? 0} Dossiers en attente`}
                            icon={Store}
                            variant="brand"
                        />
                        <KpiCard
                            label="Population Utilisateur"
                            value={(s?.users.total ?? 0).toLocaleString("fr-FR")}
                            sub={`${s?.users.merchants ?? 0} marchands · ${s?.users.customers ?? 0} clients`}
                            icon={Users}
                            variant="blue"
                        />
                        <KpiCard
                            label="GMV Plateforme"
                            value={`${((s?.metrics.gmv ?? 0) / 1000).toFixed(0)}k FCFA`}
                            sub={`${(s?.metrics.totalOrders ?? 0).toLocaleString("fr-FR")} commandes`}
                            icon={ShoppingBag}
                            variant="emerald"
                        />
                    </div>

                    {/* SaaS & AI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <motion.div
                            variants={itemVariants}
                            className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet size={18} className="text-violet-200" />
                                <span className="text-[10px] font-black text-violet-200 uppercase tracking-widest">MRR</span>
                            </div>
                            <p className="text-3xl font-black tabular-nums">
                                {((s?.saas.mrr ?? 0) / 1000).toFixed(0)}k
                            </p>
                            <p className="text-xs text-violet-200 mt-1">FCFA / mois (packs actifs)</p>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Package size={16} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Pack adoption</span>
                            </div>
                            <p className="text-3xl font-black text-surface-900 dark:text-white tabular-nums">
                                {s?.saas.packAdoptionRate ?? 0}%
                            </p>
                            <p className="text-xs text-surface-400 mt-1">
                                {s?.saas.restaurantsWithPacks ?? 0} restaurants avec packs
                            </p>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Brain size={16} className="text-purple-500" />
                                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">IA aujourd'hui</span>
                            </div>
                            <p className="text-3xl font-black text-surface-900 dark:text-white tabular-nums">
                                {(s?.aiUsage.todayCalls ?? 0).toLocaleString("fr-FR")}
                            </p>
                            <p className="text-xs text-surface-400 mt-1">appels Gemini</p>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={16} className="text-brand-500" />
                                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">IA ce mois</span>
                            </div>
                            <p className="text-3xl font-black text-surface-900 dark:text-white tabular-nums">
                                {(s?.aiUsage.monthCalls ?? 0).toLocaleString("fr-FR")}
                            </p>
                            <p className="text-xs text-surface-400 mt-1">appels Gemini</p>
                        </motion.div>
                    </div>

                    {/* Content Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        {/* Recent Activity Ledger */}
                        <motion.div 
                            variants={itemVariants}
                            className="xl:col-span-2 bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden flex flex-col"
                        >
                            <div className="px-10 py-8 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <Activity size={24} className="text-brand-500" />
                                        Flux Partenaires
                                    </h3>
                                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Temps réel / Nouveaux enregistrements</p>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6">Exporter Log</Button>
                            </div>
                            
                            <div className="p-4 flex-1">
                                {s?.recentActivity.newRestaurants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                        <Store size={48} className="text-surface-200 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest text-surface-400">Aucun signal détecté</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {s?.recentActivity.newRestaurants.map((restaurant) => (
                                            <div key={restaurant.id} className="flex items-center gap-6 p-6 rounded-3xl hover:bg-surface-50 dark:hover:bg-brand-500/5 transition-all group">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500",
                                                    restaurant.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                )}>
                                                    <Store size={26} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-base font-black text-surface-900 dark:text-white uppercase tracking-tight group-hover:text-brand-500 transition-colors">
                                                            {restaurant.name}
                                                        </span>
                                                        <Badge variant={restaurant.isActive ? "success" : "warning"} className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-none">
                                                            {restaurant.isActive ? "LIVE" : "PENDING"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Truck size={12} className="text-surface-300" />
                                                            Onboarded: {new Date(restaurant.createdAt).toLocaleDateString("fr-FR", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric"
                                                            })}
                                                        </p>
                                                        <span className="text-[10px] font-mono text-brand-500/50">#{restaurant.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                                <a 
                                                    href={`/admin/restaurants/${restaurant.id}`}
                                                    className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm group-hover:rotate-12"
                                                >
                                                    <ArrowUpRight size={22} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Master Operations Quick Actions */}
                        <motion.div 
                            variants={itemVariants}
                            className="bg-surface-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl flex flex-col justify-between"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Master Ops</h3>
                                    <p className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em]">Accès Instantané Systèmes</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Marchands", href: "/admin/restaurants", icon: Store, color: "bg-surface-800 hover:bg-brand-500" },
                                        { label: "Identités", href: "/admin/users", icon: Users, color: "bg-surface-800 hover:bg-blue-500" },
                                        { label: "Usage IA", href: "/admin/ai-usage", icon: Brain, color: "bg-surface-800 hover:bg-purple-500" },
                                        { label: "Monétique", href: "/admin/billing", icon: Wallet, color: "bg-surface-800 hover:bg-amber-500" },
                                    ].map((action) => (
                                        <a
                                            key={action.href}
                                            href={action.href}
                                            className={cn(
                                                "flex flex-col items-center gap-4 p-6 rounded-[2rem] transition-all duration-500 group/btn border border-white/5",
                                                action.color
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/btn:scale-110 group-hover/btn:rotate-6 transition-all duration-500">
                                                <action.icon size={24} strokeWidth={1.5} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10 mt-10 pt-8 border-t border-white/10 text-center">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">KBOUFFE ENTERPRISE OS</p>
                            </div>

                            <LayoutDashboard size={200} className="absolute -right-20 -bottom-20 text-white/5 rotate-12 group-hover:scale-125 transition-transform duration-1000" />
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
