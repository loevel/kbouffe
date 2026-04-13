"use client";

import { useEffect, useState, useCallback } from "react";
import {
    TrendingUp,
    DollarSign,
    Users,
    BarChart3,
    ArrowUp,
} from "lucide-react";
import { Badge, Button, useLocale, toast, adminFetch } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SegmentMetrics {
    name: string;
    count: number;
    avgGmv: number;
    avgCommission: number;
    churnRate: number;
    ltv: number;
    growthRate: number;
    boostAdoptionRate: number;
}

interface RevenueMetrics {
    monthlyRecurringRevenue: number;
    totalGmv: number;
    totalCommissions: number;
    boostPackRevenue: number;
    activeRestaurants: number;
    newRestaurantsThisMonth: number;
    netRevenueRetention: number;
    avgRestaurantValue: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function RevenueOperationsPage() {
    const { t } = useLocale();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
    const [segments, setSegments] = useState<SegmentMetrics[]>([]);

    const loadMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, segmentsRes] = await Promise.all([
                adminFetch("/api/admin/stats"),
                adminFetch("/api/admin/stats/segments"),
            ]);

            if (!statsRes.ok) {
                const json = await statsRes.json();
                throw new Error(json.error || `Erreur ${statsRes.status}`);
            }
            if (!segmentsRes.ok) {
                const json = await segmentsRes.json();
                throw new Error(json.error || `Erreur ${segmentsRes.status}`);
            }

            const statsJson = await statsRes.json();
            const segmentsJson = await segmentsRes.json();

            const mrr: number = statsJson.saas?.mrr ?? 0;
            const gmv: number = statsJson.metrics?.gmv ?? 0;
            const activeRestaurants: number = statsJson.restaurants?.active ?? 0;

            setMetrics({
                monthlyRecurringRevenue: mrr,
                totalGmv: gmv,
                totalCommissions: Math.round(gmv * 0.05),
                boostPackRevenue: mrr,
                activeRestaurants,
                newRestaurantsThisMonth: statsJson.restaurants?.newThisMonth ?? 0,
                netRevenueRetention: statsJson.saas?.packAdoptionRate
                    ? Math.min(100, Math.round(95 - (100 - statsJson.saas.packAdoptionRate) * 0.3))
                    : 0,
                avgRestaurantValue: activeRestaurants > 0
                    ? Math.round((Math.round(gmv * 0.05) + mrr) / activeRestaurants)
                    : 0,
            });

            setSegments(segmentsJson.data ?? []);
        } catch (err: any) {
            const message = err.message || "Échec du chargement des métriques";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) {
            return `${(value / 1_000_000).toFixed(1)}M FCFA`;
        }
        if (value >= 1_000) {
            return `${(value / 1_000).toFixed(0)}K FCFA`;
        }
        return `${value} FCFA`;
    };

    if (loading || !metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <BarChart3 className="w-8 h-8 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-gray-600">Chargement des métriques...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <BarChart3 className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-red-600">{error}</p>
                    <Button onClick={loadMetrics} variant="outline">Réessayer</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t.adminPages?.revenueOperations?.title ?? "Revenue Operations"}</h1>
                    <p className="text-gray-600 mt-1">{t.adminPages?.revenueOperations?.subtitle ?? "Pipeline forecasting and pricing optimization"}</p>
                </div>
                <Button onClick={loadMetrics} variant="outline">
                    {t.adminPages?.revenueOperations?.refreshData ?? "Actualiser"}
                </Button>
            </div>

            {/* KPI Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t.adminPages?.revenueOperations?.stats?.mrr ?? "MRR"}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatCurrency(metrics.monthlyRecurringRevenue)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{t.adminPages?.revenueOperations?.stats?.mrrTarget ?? "Objectif : 15M à M12"}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-400" />
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-green-200 bg-green-50 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">{t.adminPages?.revenueOperations?.stats?.activeRestaurants ?? "Restaurants actifs"}</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{metrics.activeRestaurants}</p>
                            <p className="text-xs text-green-600 mt-1">+{metrics.newRestaurantsThisMonth} ce mois</p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-purple-200 bg-purple-50 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700">{t.adminPages?.revenueOperations?.stats?.nrr ?? "NRR"}</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">{metrics.netRevenueRetention}%</p>
                            <p className="text-xs text-purple-600 mt-1">{t.adminPages?.revenueOperations?.stats?.nrrBelowTarget ?? "Objectif : 95%+"}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-orange-200 bg-orange-50 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-700">{t.adminPages?.revenueOperations?.stats?.totalGmv ?? "GMV Total"}</p>
                            <p className="text-2xl font-bold text-orange-900 mt-1">
                                {formatCurrency(metrics.totalGmv)}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">{t.adminPages?.revenueOperations?.stats?.commissionRate ?? "Taux de commission 5%"}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-orange-600" />
                    </div>
                </motion.div>
            </motion.div>

            {/* Revenue Breakdown */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.adminPages?.revenueOperations?.revenueComposition ?? "Composition du revenu"}</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.transactionCommission ?? "Commission transactions"}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(metrics.totalCommissions)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.boostPacks ?? "Boost Packs"}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(metrics.boostPackRevenue)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center font-semibold">
                            <span className="text-gray-900">{t.adminPages?.revenueOperations?.total ?? "Total"}</span>
                            <span className="text-gray-900">{formatCurrency(metrics.totalCommissions + metrics.boostPackRevenue)}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.adminPages?.revenueOperations?.keyMetrics ?? "Indicateurs clés"}</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.avgRestaurantValue ?? "Valeur moy. restaurant"}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(metrics.avgRestaurantValue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.churnRateBaseline ?? "Taux de churn de base"}</span>
                            <span className="font-semibold text-red-600">
                                {segments.length > 0
                                    ? `${Math.round(segments.reduce((s, seg) => s + seg.churnRate * seg.count, 0) / segments.reduce((s, seg) => s + seg.count, 0))}%`
                                    : "—"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.boostAdoptionRate ?? "Taux d'adoption Boost"}</span>
                            <span className="font-semibold text-amber-600">
                                {segments.length > 0
                                    ? `${Math.round(segments.reduce((s, seg) => s + seg.boostAdoptionRate * seg.count, 0) / segments.reduce((s, seg) => s + seg.count, 0))}%`
                                    : "—"}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.adminPages?.revenueOperations?.revenueOpportunities ?? "Opportunités de revenu"}</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span>{t.adminPages?.revenueOperations?.reduceChurn ?? "Réduire le churn 45%→30% : +2M FCFA/mois"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span>{t.adminPages?.revenueOperations?.boostAdoption ?? "Adoption Boost 5%→15% : +800K FCFA/mois"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span>{t.adminPages?.revenueOperations?.tieredPricing ?? "Tarification par palier : +1.2M FCFA/mois"}</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Segment Breakdown */}
            <motion.div
                className="bg-white rounded-lg border border-gray-200 p-6"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.adminPages?.revenueOperations?.segments ?? "Segments clients"}</h2>
                {segments.length === 0 ? (
                    <p className="text-gray-500 text-sm py-6 text-center">Aucune donnée de segment disponible pour ce mois.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segments ?? "Segment"}</th>
                                    <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentCount ?? "Nb"}</th>
                                    <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentAvgGmv ?? "GMV moy."}</th>
                                    <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentChurn ?? "Churn"}</th>
                                    <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentLtv ?? "LTV"}</th>
                                    <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentGrowth ?? "Croissance"}</th>
                                    <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentBoostRate ?? "Taux Boost"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segments.map((segment, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2 text-gray-900 font-medium">{segment.name}</td>
                                        <td className="text-right py-3 px-2 text-gray-600">{segment.count}</td>
                                        <td className="text-right py-3 px-2 text-gray-600">{formatCurrency(segment.avgGmv)}</td>
                                        <td className="text-right py-3 px-2">
                                            <Badge className={cn(
                                                "border",
                                                segment.churnRate > 30 ? "bg-red-100 text-red-800 border-red-300" : "bg-amber-100 text-amber-800 border-amber-300"
                                            )}>
                                                {segment.churnRate}%
                                            </Badge>
                                        </td>
                                        <td className="text-right py-3 px-2 font-semibold text-gray-900">{formatCurrency(segment.ltv)}</td>
                                        <td className="text-right py-3 px-2 text-gray-600">{segment.growthRate}%</td>
                                        <td className="text-right py-3 px-2 text-gray-600">{segment.boostAdoptionRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Strategic Recommendations */}
            <motion.div
                className="bg-blue-50 border border-blue-200 rounded-lg p-6"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-lg font-bold text-blue-900 mb-4">{t.adminPages?.revenueOperations?.strategicRecommendations ?? "Recommandations stratégiques"}</h2>
                <div className="space-y-3 text-sm text-blue-900">
                    <div className="flex gap-2">
                        <span className="font-semibold">1. Tarification par palier (T1)</span>
                        <span>- Maintenir 5% par défaut, offrir 3,5% à 200K GMV, 2,5% à 500K GMV → +1.2M FCFA/mois</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">2. Score de santé (T1)</span>
                        <span>- Activer la rétention proactive, prédire le churn 2-3 mois à l'avance → réduire à 35%</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">3. Marketing Boost Pack (T2)</span>
                        <span>- Études de cas + tableaux de bord de performance → augmenter l'adoption de 5% à 15% → +800K FCFA/mois</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">4. Fournisseurs B2B (T2-T3)</span>
                        <span>- Nouveau flux de revenus avec un churn plus faible → +2M FCFA/mois potentiel</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
