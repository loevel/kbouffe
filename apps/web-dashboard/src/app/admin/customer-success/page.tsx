"use client";

import { useEffect, useState, useCallback } from "react";
import {
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Activity,
    BarChart3,
    Filter,
    Download,
} from "lucide-react";
import { Badge, Button, useLocale, toast, adminFetch } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HealthScoreData {
    restaurant_id: string;
    restaurant_name: string;
    total_score: number;
    tier: "Healthy" | "At-Risk" | "Churning";
    components: {
        component: string;
        weight: string;
        metric_value: number;
        score: number;
        weighted_score: string;
    }[];
    recommendations: string[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const getTierColor = (tier: string) => {
    switch (tier) {
        case "Healthy":
            return "bg-emerald-50 border-emerald-200 text-emerald-900";
        case "At-Risk":
            return "bg-amber-50 border-amber-200 text-amber-900";
        case "Churning":
            return "bg-red-50 border-red-200 text-red-900";
        default:
            return "bg-gray-50 border-gray-200 text-gray-900";
    }
};

const getTierIcon = (tier: string) => {
    switch (tier) {
        case "Healthy":
            return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
        case "At-Risk":
            return <AlertCircle className="w-5 h-5 text-amber-600" />;
        case "Churning":
            return <AlertCircle className="w-5 h-5 text-red-600" />;
        default:
            return <Activity className="w-5 h-5 text-gray-600" />;
    }
};

const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
        case "Healthy":
            return "bg-emerald-100 text-emerald-800 border-emerald-300";
        case "At-Risk":
            return "bg-amber-100 text-amber-800 border-amber-300";
        case "Churning":
            return "bg-red-100 text-red-800 border-red-300";
        default:
            return "bg-gray-100 text-gray-800 border-gray-300";
    }
};

export default function CustomerSuccessPage() {
    const { t } = useLocale();
    const [healthScores, setHealthScores] = useState<HealthScoreData[]>([]);
    const [filteredScores, setFilteredScores] = useState<HealthScoreData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tierFilter, setTierFilter] = useState("all");
    const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);

    // Calculate statistics
    const stats = {
        total: healthScores.length,
        healthy: healthScores.filter(s => s.tier === "Healthy").length,
        atRisk: healthScores.filter(s => s.tier === "At-Risk").length,
        churning: healthScores.filter(s => s.tier === "Churning").length,
        avgScore: healthScores.length > 0
            ? Math.round(healthScores.reduce((sum, s) => sum + s.total_score, 0) / healthScores.length)
            : 0,
    };

    const loadHealthScores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch("/api/admin/restaurants/health-scores");
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || `Erreur ${res.status}`);
            }
            setHealthScores(json.data ?? []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Échec du chargement des scores de santé";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHealthScores();
    }, [loadHealthScores]);

    useEffect(() => {
        if (tierFilter === "all") {
            setFilteredScores(healthScores);
        } else {
            setFilteredScores(healthScores.filter(s => s.tier === tierFilter));
        }
    }, [healthScores, tierFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <Activity className="w-8 h-8 text-emerald-600 mx-auto" />
                    </div>
                    <p className="text-gray-600">Chargement des scores de santé...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-red-600">{error}</p>
                    <Button onClick={loadHealthScores} variant="outline">
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t.adminPages?.customerSuccess?.title ?? "Customer Success"}</h1>
                    <p className="text-gray-600 mt-1">{t.adminPages?.customerSuccess?.subtitle ?? "Health scoring and retention analytics"}</p>
                </div>
                <Button
                    onClick={loadHealthScores}
                    variant="outline"
                    className="gap-2"
                >
                    <Download className="w-4 h-4" />
                    {t.adminPages?.customerSuccess?.refreshData ?? "Refresh Data"}
                </Button>
            </div>

            {/* Stats Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-5 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="bg-white rounded-lg border border-gray-200 p-4"
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t.adminPages?.customerSuccess?.stats?.totalRestaurants ?? "Total Restaurants"}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-700">{t.adminPages?.customerSuccess?.stats?.healthy ?? "Healthy"}</p>
                            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.healthy}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white rounded-lg border border-amber-200 bg-amber-50 p-4"
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-700">{t.adminPages?.customerSuccess?.stats?.atRisk ?? "At-Risk"}</p>
                            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.atRisk}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white rounded-lg border border-red-200 bg-red-50 p-4"
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-700">{t.adminPages?.customerSuccess?.stats?.churning ?? "Churning"}</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">{stats.churning}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white rounded-lg border border-blue-200 bg-blue-50 p-4"
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700">{t.adminPages?.customerSuccess?.stats?.avgScore ?? "Avg Score"}</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.avgScore}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                </motion.div>
            </motion.div>

            {/* Filter */}
            <div className="flex gap-2">
                <Filter className="w-4 h-4 text-gray-600 mt-2.5" />
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: "all", label: t.adminPages?.customerSuccess?.filterAll ?? "All" },
                        { key: "Healthy", label: t.adminPages?.customerSuccess?.filterHealthy ?? "Healthy" },
                        { key: "At-Risk", label: t.adminPages?.customerSuccess?.filterAtRisk ?? "At-Risk" },
                        { key: "Churning", label: t.adminPages?.customerSuccess?.filterChurning ?? "Churning" },
                    ].map((tier) => (
                        <button
                            key={tier.key}
                            onClick={() => setTierFilter(tier.key)}
                            className={cn(
                                "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                                tierFilter === tier.key
                                    ? tier.key === "all"
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "border-current text-gray-900 bg-gray-100"
                                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                            )}
                        >
                            {tier.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Restaurants List */}
            <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {filteredScores.map((score) => (
                        <motion.div
                            key={score.restaurant_id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className={cn(
                                "rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md",
                                getTierColor(score.tier)
                            )}
                            onClick={() =>
                                setExpandedRestaurant(
                                    expandedRestaurant === score.restaurant_id
                                        ? null
                                        : score.restaurant_id
                                )
                            }
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    {getTierIcon(score.tier)}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm">{score.restaurant_name}</h3>
                                        <div className="flex gap-2 mt-2">
                                            <Badge className={cn("border", getTierBadgeStyle(score.tier))}>
                                                {score.tier}
                                            </Badge>
                                            <Badge variant="outline">
                                                Score: {score.total_score}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <TrendingUp className="w-4 h-4 opacity-50 flex-shrink-0 mt-1" />
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {expandedRestaurant === score.restaurant_id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 space-y-3 pt-4 border-t border-current border-opacity-20"
                                    >
                                        {/* Components */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase opacity-75 mb-2">
                                                {t.adminPages?.customerSuccess?.components ?? "Score Components"}
                                            </h4>
                                            <div className="space-y-1">
                                                {score.components.map((comp) => (
                                                    <div
                                                        key={comp.component}
                                                        className="flex items-center justify-between text-xs"
                                                    >
                                                        <span>{comp.component} ({comp.weight})</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 bg-black bg-opacity-10 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-current opacity-80 rounded-full"
                                                                    style={{ width: `${comp.score}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-semibold">{comp.score}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recommendations */}
                                        {score.recommendations.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase opacity-75 mb-2">
                                                    {t.adminPages?.customerSuccess?.recommendations ?? "Recommended Actions"}
                                                </h4>
                                                <ul className="space-y-1">
                                                    {score.recommendations.map((rec, idx) => (
                                                        <li key={idx} className="text-xs">
                                                            • {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredScores.length === 0 && (
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">{t.adminPages?.customerSuccess?.noResults ?? "No restaurants found for this tier"}</p>
                </div>
            )}
        </div>
    );
}
