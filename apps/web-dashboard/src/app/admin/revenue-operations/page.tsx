"use client";

import { useEffect, useState, useCallback } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Target,
    BarChart3,
    PieChart,
    ArrowUp,
} from "lucide-react";
import { Badge, Button, useLocale, toast } from "@kbouffe/module-core/ui";
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
    const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
    const [segments, setSegments] = useState<SegmentMetrics[]>([]);

    const loadMetrics = useCallback(async () => {
        setLoading(true);
        try {
            // Mock data based on strategy document
            const mockMetrics: RevenueMetrics = {
                monthlyRecurringRevenue: 8_000_000, // 8M FCFA
                totalGmv: 150_000_000, // 150M FCFA
                totalCommissions: 7_500_000, // 7.5M FCFA (5%)
                boostPackRevenue: 500_000, // 500K FCFA
                activeRestaurants: 450,
                newRestaurantsThisMonth: 20,
                netRevenueRetention: 92, // 92% - below 95% target
                avgRestaurantValue: 18_000, // ~18K FCFA avg commission per restaurant
            };

            const mockSegments: SegmentMetrics[] = [
                {
                    name: "Casual Restaurants (Segment A)",
                    count: 180, // 40% of 450
                    avgGmv: 3_500_000,
                    avgCommission: 175_000,
                    churnRate: 45,
                    ltv: 2_500_000,
                    growthRate: 10,
                    boostAdoptionRate: 3,
                },
                {
                    name: "Growth Restaurants (Segment B)",
                    count: 158, // 35% of 450
                    avgGmv: 15_000_000,
                    avgCommission: 750_000,
                    churnRate: 25,
                    ltv: 12_500_000,
                    growthRate: 5,
                    boostAdoptionRate: 8,
                },
                {
                    name: "Established Players (Segment C)",
                    count: 90, // 20% of 450
                    avgGmv: 40_000_000,
                    avgCommission: 2_000_000,
                    churnRate: 10,
                    ltv: 50_000_000,
                    growthRate: 2,
                    boostAdoptionRate: 30,
                },
                {
                    name: "B2B Suppliers (Segment D)",
                    count: 22, // 5% of 450
                    avgGmv: 1_250_000,
                    avgCommission: 312_500,
                    churnRate: 40,
                    ltv: 7_500_000,
                    growthRate: 15,
                    boostAdoptionRate: 5,
                },
            ];

            setMetrics(mockMetrics);
            setSegments(mockSegments);
        } catch (error) {
            toast.error("Failed to load metrics");
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
                    <p className="text-gray-600">Loading revenue metrics...</p>
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
                    {t.adminPages?.revenueOperations?.refreshData ?? "Refresh Data"}
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
                            <p className="text-xs text-gray-500 mt-1">{t.adminPages?.revenueOperations?.stats?.mrrTarget ?? "Target: 15M by M12"}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-400" />
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-green-200 bg-green-50 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">{t.adminPages?.revenueOperations?.stats?.activeRestaurants ?? "Active Restaurants"}</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{metrics.activeRestaurants}</p>
                            <p className="text-xs text-green-600 mt-1">+{metrics.newRestaurantsThisMonth} {t.adminPages?.revenueOperations?.stats?.mrrTarget?.split(" ")[1]}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-purple-200 bg-purple-50 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700">{t.adminPages?.revenueOperations?.stats?.nrr ?? "NRR"}</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">{metrics.netRevenueRetention}%</p>
                            <p className="text-xs text-purple-600 mt-1">{t.adminPages?.revenueOperations?.stats?.nrrBelowTarget ?? "Target: 95%+ (below target)"}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-orange-200 bg-orange-50 p-4" variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-700">{t.adminPages?.revenueOperations?.stats?.totalGmv ?? "Total GMV"}</p>
                            <p className="text-2xl font-bold text-orange-900 mt-1">
                                {formatCurrency(metrics.totalGmv)}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">{t.adminPages?.revenueOperations?.stats?.commissionRate ?? "5% commission rate"}</p>
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
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.adminPages?.revenueOperations?.revenueComposition ?? "Revenue Composition"}</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.transactionCommission ?? "Transaction Commission"}</span>
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
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.adminPages?.revenueOperations?.keyMetrics ?? "Key Metrics"}</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.avgRestaurantValue ?? "Avg Restaurant Value"}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(metrics.avgRestaurantValue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.churnRateBaseline ?? "Churn Rate Baseline"}</span>
                            <span className="font-semibold text-red-600">45%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.adminPages?.revenueOperations?.boostAdoptionRate ?? "Boost Adoption Rate"}</span>
                            <span className="font-semibold text-amber-600">5%</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.adminPages?.revenueOperations?.revenueOpportunities ?? "Revenue Opportunities"}</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span>{t.adminPages?.revenueOperations?.reduceChurn ?? "Reduce churn 45%→30%: +2M FCFA/mo"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span>{t.adminPages?.revenueOperations?.boostAdoption ?? "Boost adoption 5%→15%: +800K FCFA/mo"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span>{t.adminPages?.revenueOperations?.tieredPricing ?? "Tiered pricing model: +1.2M FCFA/mo"}</span>
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
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.adminPages?.revenueOperations?.segments ?? "Customer Segments"}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segments ?? "Segment"}</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentCount ?? "Count"}</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentAvgGmv ?? "Avg GMV"}</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentChurn ?? "Churn Rate"}</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentLtv ?? "LTV"}</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentGrowth ?? "Growth"}</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-900">{t.adminPages?.revenueOperations?.segmentBoostRate ?? "Boost Rate"}</th>
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
            </motion.div>

            {/* Strategic Recommendations */}
            <motion.div
                className="bg-blue-50 border border-blue-200 rounded-lg p-6"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-lg font-bold text-blue-900 mb-4">{t.adminPages?.revenueOperations?.strategicRecommendations ?? "Strategic Recommendations"}</h2>
                <div className="space-y-3 text-sm text-blue-900">
                    <div className="flex gap-2">
                        <span className="font-semibold">1. Implement Tiered Pricing (Q1)</span>
                        <span>- Keep 5% default, offer 3.5% at 200K GMV, 2.5% at 500K GMV → +1.2M FCFA/mo</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">2. Launch Health Scoring (Q1)</span>
                        <span>- Enable proactive retention, predict churn 2-3 months in advance → reduce to 35%</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">3. Boost Pack Marketing (Q2)</span>
                        <span>- Case studies + performance dashboards → increase adoption from 5% to 15% → +800K FCFA/mo</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">4. B2B Supplier Focus (Q2-Q3)</span>
                        <span>- New revenue stream with lower churn, competitive moat → +2M FCFA/mo potential</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
