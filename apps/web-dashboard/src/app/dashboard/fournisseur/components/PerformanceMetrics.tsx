"use client";

/**
 * PerformanceMetrics -- 4 extra stat cards:
 *   1. On-time delivery rate (%)
 *   2. Cancellation rate (%)
 *   3. Average order value (FCFA)
 *   4. Total restaurants served
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Timer,
    Ban,
    Receipt,
    Store,
} from "lucide-react";

interface Order {
    delivery_status: string;
    total_price: number;
    restaurant_id?: string;
    expected_delivery_date?: string | null;
    actual_delivery_date?: string | null;
    created_at: string;
}

interface PerformanceMetricsProps {
    orders: Order[];
    loading?: boolean;
}

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
}

function formatPercent(value: number): string {
    return value.toFixed(1) + "%";
}

interface StatCardProps {
    label: string;
    value: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    loading?: boolean;
    delay?: number;
}

function StatCard({
    label,
    value,
    icon: Icon,
    iconColor,
    iconBg,
    loading,
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="bg-surface-900 border border-white/8 rounded-2xl p-5"
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                        {label}
                    </p>
                    {loading ? (
                        <div className="h-7 w-20 rounded-lg bg-surface-800 animate-pulse" />
                    ) : (
                        <p className="text-2xl font-bold text-white truncate">{value}</p>
                    )}
                </div>
                <div
                    className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ml-3`}
                >
                    <Icon size={20} className={iconColor} />
                </div>
            </div>
        </motion.div>
    );
}

export function PerformanceMetrics({ orders, loading }: PerformanceMetricsProps) {
    const metrics = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                onTimeRate: 0,
                cancellationRate: 0,
                avgOrderValue: 0,
                totalRestaurants: 0,
            };
        }

        const total = orders.length;
        const cancelled = orders.filter((o) => o.delivery_status === "cancelled").length;
        const delivered = orders.filter((o) => o.delivery_status === "delivered");

        // On-time: delivered orders where actual <= expected (if both dates exist)
        const withDates = delivered.filter(
            (o) => o.expected_delivery_date && o.actual_delivery_date
        );
        const onTime = withDates.filter(
            (o) =>
                new Date(o.actual_delivery_date!) <= new Date(o.expected_delivery_date!)
        ).length;
        const onTimeRate =
            withDates.length > 0 ? (onTime / withDates.length) * 100 : delivered.length > 0 ? 100 : 0;

        const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

        // Average order value (non-cancelled)
        const nonCancelled = orders.filter((o) => o.delivery_status !== "cancelled");
        const avgOrderValue =
            nonCancelled.length > 0
                ? nonCancelled.reduce((acc, o) => acc + (o.total_price ?? 0), 0) / nonCancelled.length
                : 0;

        // Unique restaurants
        const restaurantIds = new Set(
            orders.filter((o) => o.restaurant_id).map((o) => o.restaurant_id!)
        );
        const totalRestaurants = restaurantIds.size;

        return { onTimeRate, cancellationRate, avgOrderValue, totalRestaurants };
    }, [orders]);

    const stats = [
        {
            label: "Livraisons a temps",
            value: formatPercent(metrics.onTimeRate),
            icon: Timer,
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/15",
            delay: 0.3,
        },
        {
            label: "Taux d'annulation",
            value: formatPercent(metrics.cancellationRate),
            icon: Ban,
            iconColor: "text-red-400",
            iconBg: "bg-red-500/15",
            delay: 0.35,
        },
        {
            label: "Panier moyen",
            value: formatFCFA(metrics.avgOrderValue),
            icon: Receipt,
            iconColor: "text-brand-400",
            iconBg: "bg-brand-500/15",
            delay: 0.4,
        },
        {
            label: "Restaurants servis",
            value: String(metrics.totalRestaurants),
            icon: Store,
            iconColor: "text-cyan-400",
            iconBg: "bg-cyan-500/15",
            delay: 0.45,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="region" aria-label="Performance metrics">
            {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} loading={loading} />
            ))}
        </div>
    );
}
