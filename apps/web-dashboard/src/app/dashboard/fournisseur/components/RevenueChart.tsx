"use client";

/**
 * RevenueChart -- Graphique ligne revenu journalier sur 30 jours
 * Utilise Recharts (LineChart)
 */

import { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

interface RevenueChartProps {
    /** Orders with created_at and total_price */
    orders: { created_at: string; total_price: number; delivery_status: string }[];
}

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload || !payload[0]) return null;
    return (
        <div className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 shadow-xl">
            <p className="text-xs text-surface-400 mb-0.5">{label}</p>
            <p className="text-sm font-bold text-white">{formatFCFA(payload[0].value as number)}</p>
        </div>
    );
}

export function RevenueChart({ orders }: RevenueChartProps) {
    const data = useMemo(() => {
        const now = new Date();
        const days: { date: string; revenue: number }[] = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push({ date: key, revenue: 0 });
        }

        const dayMap = new Map(days.map((d) => [d.date, d]));

        for (const order of orders) {
            if (order.delivery_status === "cancelled") continue;
            const key = new Date(order.created_at).toISOString().slice(0, 10);
            const entry = dayMap.get(key);
            if (entry) entry.revenue += order.total_price;
        }

        return days.map((d) => ({
            name: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(
                new Date(d.date)
            ),
            revenue: d.revenue,
        }));
    }, [orders]);

    return (
        <div className="bg-surface-900 border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Revenu (30 derniers jours)</h3>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "#71717a" }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#71717a" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) =>
                                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                            }
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-brand-500, #f97316)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "var(--color-brand-500, #f97316)", stroke: "var(--color-brand-700, #c2410c)", strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
