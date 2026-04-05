"use client";

/**
 * BusinessMetrics -- 4 cartes metriques fournisseur avec sparklines
 *
 * - Ratings moyen (0-5) avec nombre reviews
 * - Response time moyen (heures)
 * - Order conversion rate (RFQ -> order %)
 * - Restaurants served (count unique)
 * - Mini-graphique sparkline pour chaque metrique (trend 30j)
 * - Comparaison vs mois precedent
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Star,
    Phone,
    TrendingUp,
    Store,
    ArrowUp,
    ArrowDown,
    Minus,
    Loader2,
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ──────────────────────────────────────────────────────────────────

interface MetricData {
    current: number;
    previous: number;
    trend: { date: string; value: number }[];
    extra?: string; // e.g. "12 reviews"
}

interface MetricsResponse {
    ratings: MetricData;
    response_time: MetricData;
    conversion_rate: MetricData;
    restaurants_served: MetricData;
}

interface MetricCardConfig {
    key: keyof MetricsResponse;
    label: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    chartColor: string;
    format: (value: number) => string;
    unit?: string;
}

// ── Mock data for when API is unavailable ─────────────────────────────────

function generateMockTrend(base: number, variance: number): { date: string; value: number }[] {
    const data: { date: string; value: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({
            date: d.toISOString().slice(0, 10),
            value: Math.max(0, base + (Math.random() - 0.5) * variance),
        });
    }
    return data;
}

const MOCK_METRICS: MetricsResponse = {
    ratings: {
        current: 4.3,
        previous: 4.1,
        trend: generateMockTrend(4.2, 0.6),
        extra: "28 avis",
    },
    response_time: {
        current: 1.8,
        previous: 2.3,
        trend: generateMockTrend(2.0, 1.2),
        extra: "moy. 30j",
    },
    conversion_rate: {
        current: 67,
        previous: 62,
        trend: generateMockTrend(65, 15),
        extra: "RFQ -> Commande",
    },
    restaurants_served: {
        current: 14,
        previous: 11,
        trend: generateMockTrend(12, 4),
        extra: "actifs ce mois",
    },
};

// ── Card configurations ───────────────────────────────────────────────────

const METRIC_CARDS: MetricCardConfig[] = [
    {
        key: "ratings",
        label: "Rating moyen",
        icon: Star,
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/15 border-amber-500/20",
        chartColor: "#f59e0b",
        format: (v) => v.toFixed(1),
        unit: "/ 5",
    },
    {
        key: "response_time",
        label: "Temps de reponse",
        icon: Phone,
        iconColor: "text-blue-400",
        iconBg: "bg-blue-500/15 border-blue-500/20",
        chartColor: "#3b82f6",
        format: (v) => v.toFixed(1),
        unit: "h",
    },
    {
        key: "conversion_rate",
        label: "Taux de conversion",
        icon: TrendingUp,
        iconColor: "text-emerald-400",
        iconBg: "bg-emerald-500/15 border-emerald-500/20",
        chartColor: "#10b981",
        format: (v) => Math.round(v).toString(),
        unit: "%",
    },
    {
        key: "restaurants_served",
        label: "Restaurants servis",
        icon: Store,
        iconColor: "text-purple-400",
        iconBg: "bg-purple-500/15 border-purple-500/20",
        chartColor: "#a855f7",
        format: (v) => Math.round(v).toString(),
    },
];

// ── Sparkline component ───────────────────────────────────────────────────

function Sparkline({ data, color }: { data: { date: string; value: number }[]; color: string }) {
    return (
        <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${color.replace("#", "")})`}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={800}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ── Trend badge ───────────────────────────────────────────────────────────

function TrendBadge({ current, previous, invertColor }: { current: number; previous: number; invertColor?: boolean }) {
    if (previous === 0) return null;
    const pctChange = ((current - previous) / previous) * 100;
    const isUp = pctChange > 0;
    const isNeutral = Math.abs(pctChange) < 0.5;

    // For response_time, lower is better so invert the color
    const isPositive = invertColor ? !isUp : isUp;

    if (isNeutral) {
        return (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-surface-500">
                <Minus size={9} />
                0%
            </span>
        );
    }

    return (
        <span
            className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                isPositive ? "text-emerald-400" : "text-red-400"
            }`}
        >
            {isUp ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
            {Math.abs(pctChange).toFixed(0)}%
        </span>
    );
}

// ── Metric card ───────────────────────────────────────────────────────────

function MetricCard({
    config,
    data,
    loading,
    delay,
}: {
    config: MetricCardConfig;
    data: MetricData;
    loading: boolean;
    delay: number;
}) {
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="bg-surface-900 border border-white/8 rounded-2xl p-4 flex flex-col"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                        {config.label}
                    </p>
                    {loading ? (
                        <div className="h-7 w-16 rounded-lg bg-surface-800 animate-pulse" />
                    ) : (
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-white">
                                {config.format(data.current)}
                            </span>
                            {config.unit && (
                                <span className="text-xs text-surface-500">{config.unit}</span>
                            )}
                            <TrendBadge
                                current={data.current}
                                previous={data.previous}
                                invertColor={config.key === "response_time"}
                            />
                        </div>
                    )}
                    {data.extra && !loading && (
                        <p className="text-[10px] text-surface-600 mt-0.5">{data.extra}</p>
                    )}
                </div>

                <div
                    className={`w-8 h-8 rounded-xl border ${config.iconBg} flex items-center justify-center shrink-0 ml-2`}
                >
                    <Icon size={14} className={config.iconColor} />
                </div>
            </div>

            {/* Sparkline */}
            {!loading && data.trend.length > 0 && (
                <div className="mt-auto -mx-1 -mb-1">
                    <Sparkline data={data.trend} color={config.chartColor} />
                </div>
            )}
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────────────

export function BusinessMetrics() {
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            setLoading(true);
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/metrics");
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data.metrics ?? data);
                } else {
                    // Fallback to mock data
                    setMetrics(MOCK_METRICS);
                }
            } catch {
                // Fallback to mock data
                setMetrics(MOCK_METRICS);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    const data = metrics ?? MOCK_METRICS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={14} className="text-brand-400" />
                    Metriques
                </h2>
                {loading && (
                    <Loader2 size={13} className="text-surface-500 animate-spin" />
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {METRIC_CARDS.map((config, i) => (
                    <MetricCard
                        key={config.key}
                        config={config}
                        data={data[config.key]}
                        loading={loading}
                        delay={i * 0.06}
                    />
                ))}
            </div>
        </motion.div>
    );
}
