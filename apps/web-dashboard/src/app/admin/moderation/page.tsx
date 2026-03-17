"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Star,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Store,
    User,
    Filter,
    ArrowUpRight,
    ShieldCheck,
    AlertCircle,
    MoreHorizontal,
    ThumbsUp,
} from "lucide-react";
import { Badge, Button } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

interface ReviewRow {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    isVisible: boolean;
    createdAt: string;
    userId: string;
    restaurantId: string;
    userName: string | null;
    userEmail: string | null;
    restaurantName: string | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

function RatingStars({ rating }: { rating: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={12} className={cn(s <= rating ? "text-amber-500 fill-amber-500" : "text-surface-300")} />
            ))}
        </span>
    );
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
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 }
};

export default function AdminModerationPage() {
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [ratingFilter, setRatingFilter] = useState("all");
    const [visibleFilter, setVisibleFilter] = useState("all");
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchReviews = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(ratingFilter !== "all" && { rating: ratingFilter }),
                ...(visibleFilter !== "all" && { visible: visibleFilter }),
            });
            const res = await fetch(`/api/admin/moderation/reviews?${params}`);
            const json = await res.json();
            setReviews(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch {
            console.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    }, [ratingFilter, visibleFilter]);

    useEffect(() => {
        fetchReviews(1);
    }, [fetchReviews]);

    const toggleVisibility = async (id: string, isVisible: boolean) => {
        setToggling(id);
        try {
            const res = await fetch("/api/admin/moderation/reviews", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isVisible }),
            });
            if (res.ok) {
                setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isVisible } : r)));
            }
        } finally {
            setToggling(null);
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <ShieldCheck size={32} className="text-brand-500" /> Centre de Modération
                    </h1>
                    <p className="text-surface-500 flex items-center gap-2">
                        <MessageSquare size={14} className="text-brand-500" />
                        Gérez l'intégrité des avis et la réputation des partenaires
                    </p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700">
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">Total reviews</p>
                    <span className="text-sm font-black text-surface-900 dark:text-white">{pagination.total}</span>
                </div>
            </div>

            {/* Premium Controls */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm"
            >
                <div className="flex items-center gap-3 w-full sm:w-auto px-2">
                    <Filter size={16} className="text-surface-400" />
                    <span className="text-xs font-bold text-surface-500 uppercase">Filtrer par</span>
                </div>
                
                <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2.5 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer transition-all font-medium"
                >
                    <option value="all">Note: Toutes</option>
                    <option value="1">1 ⭐ (Critique)</option>
                    <option value="2">2 ⭐ (Faible)</option>
                    <option value="3">3 ⭐ (Moyen)</option>
                    <option value="4">4 ⭐ (Bon)</option>
                    <option value="5">5 ⭐ (Excellent)</option>
                </select>

                <select
                    value={visibleFilter}
                    onChange={(e) => setVisibleFilter(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2.5 text-sm rounded-xl appearance-none bg-surface-50 dark:bg-surface-800/50 text-surface-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer transition-all font-medium"
                >
                    <option value="all">Statut: Tous</option>
                    <option value="true">Visibles uniquement</option>
                    <option value="false">Masqués uniquement</option>
                </select>

                <div className="hidden sm:block flex-1" />
                
                <Button variant="ghost" className="hidden sm:flex text-surface-400 hover:text-brand-500 h-[44px] rounded-xl">
                    Réinitialiser
                </Button>
            </motion.div>

            {/* Review Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 animate-pulse space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2"><div className="w-20 h-4 bg-surface-100 dark:bg-surface-800 rounded"></div></div>
                                    <div className="w-24 h-6 bg-surface-100 dark:bg-surface-800 rounded-full"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-4 bg-surface-100 dark:bg-surface-800 rounded"></div>
                                    <div className="w-2/3 h-4 bg-surface-100 dark:bg-surface-800 rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : reviews.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-surface-900 rounded-3xl border border-dashed border-surface-200 dark:border-surface-800 p-20 text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-6">
                                <MessageSquare size={40} className="text-surface-300" />
                            </div>
                            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Aucun avis à modérer</h3>
                            <p className="text-surface-500 max-w-sm mx-auto">Vos filtres sont peut-être trop restrictifs ou la plateforme n'a pas encore reçu d'avis.</p>
                        </motion.div>
                    ) : (
                        reviews.map((r, idx) => (
                            <motion.div
                                key={r.id}
                                variants={itemVariants}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "group bg-white dark:bg-surface-900 rounded-3xl border p-6 transition-all",
                                    r.isVisible
                                        ? "border-surface-200 dark:border-surface-800 hover:shadow-lg hover:shadow-surface-200/20 dark:hover:shadow-black/20"
                                        : "border-red-500/20 bg-red-50/20 dark:bg-red-950/5"
                                )}
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        {/* Status & Rating */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <RatingStars rating={r.rating} />
                                                <span className="w-1 h-1 rounded-full bg-surface-200" />
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                                            </div>
                                            <Badge 
                                                variant={r.isVisible ? "success" : "danger"}
                                                className={cn("px-3 py-1 font-bold", !r.isVisible && "bg-red-500/10 text-red-500")}
                                            >
                                                {r.isVisible ? "Affiché" : "Masqué"}
                                            </Badge>
                                        </div>

                                        {/* Comment Content */}
                                        <div className="relative">
                                            <p className="text-base text-surface-700 dark:text-surface-200 leading-relaxed">
                                                {r.comment ? `"${r.comment}"` : <span className="italic text-surface-400">Sans commentaire écrit</span>}
                                            </p>
                                        </div>

                                        {/* Merchant Response */}
                                        {r.response && (
                                            <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/10 relative">
                                                <div className="absolute top-0 left-4 -translate-y-1/2 px-2 bg-white dark:bg-surface-900 flex items-center gap-1.5">
                                                    <ThumbsUp size={10} className="text-brand-500" />
                                                    <span className="text-[10px] font-bold text-brand-500 uppercase">Réponse Marchand</span>
                                                </div>
                                                <p className="text-sm text-surface-600 dark:text-surface-400 italic">
                                                    &ldquo;{r.response}&rdquo;
                                                </p>
                                            </div>
                                        )}

                                        {/* Context Info */}
                                        <div className="flex items-center gap-6 pt-2 border-t border-surface-100 dark:border-surface-800">
                                            <div className="flex items-center gap-2 group/user cursor-pointer">
                                                <div className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] font-black group-hover/user:bg-brand-500 transition-colors group-hover/user:text-white">
                                                    {r.userName?.charAt(0) || "U"}
                                                </div>
                                                <div className="text-[11px]">
                                                    <p className="font-bold text-surface-900 dark:text-white">{r.userName || "Client Anonyme"}</p>
                                                    <p className="text-surface-400">{r.userEmail || "Pas d'email"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 group/res cursor-pointer">
                                                <div className="w-6 h-6 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover/res:bg-brand-500/10 group-hover/res:text-brand-500 transition-colors">
                                                    <Store size={12} />
                                                </div>
                                                <p className="text-[11px] font-bold text-surface-600 dark:text-surface-300 group-hover/res:text-brand-500 transition-colors">
                                                    {r.restaurantName || "Restaurant inconnu"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="flex md:flex-col items-center justify-center md:border-l border-surface-100 dark:border-surface-800 md:pl-6 gap-2">
                                        <button
                                            onClick={() => toggleVisibility(r.id, !r.isVisible)}
                                            disabled={toggling === r.id}
                                            className={cn(
                                                "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shadow-sm outline-none ring-offset-2 focus:ring-2",
                                                r.isVisible
                                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20 ring-red-500"
                                                    : "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20 ring-green-500"
                                            )}
                                            title={r.isVisible ? "Masquer cet avis" : "Rendre visible"}
                                        >
                                            {toggling === r.id ? (
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : r.isVisible ? (
                                                <EyeOff size={22} />
                                            ) : (
                                                <Eye size={22} />
                                            )}
                                        </button>
                                        <button className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all flex items-center justify-center">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination Hub */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-surface-200 dark:border-surface-800">
                    <p className="text-sm font-medium text-surface-500">
                        Page <span className="text-surface-900 dark:text-white font-bold">{pagination.page}</span> sur <span className="text-surface-900 dark:text-white font-bold">{pagination.totalPages}</span>
                        <span className="mx-2 opacity-30">|</span>
                        Total <span className="text-surface-900 dark:text-white font-bold">{pagination.total}</span> avis
                    </p>
                    <div className="flex items-center gap-2 bg-white dark:bg-surface-900 p-1 rounded-xl border border-surface-200 dark:border-surface-800">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => fetchReviews(pagination.page - 1)} 
                            disabled={pagination.page <= 1}
                            className="h-9 px-3 rounded-lg"
                        >
                            <ChevronLeft size={16} /> Précédent
                        </Button>
                        <div className="w-[1px] h-4 bg-surface-200 dark:bg-surface-800" />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => fetchReviews(pagination.page + 1)} 
                            disabled={pagination.page >= pagination.totalPages}
                            className="h-9 px-3 rounded-lg"
                        >
                            Suivant <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

