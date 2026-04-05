"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboardStats } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "3m";

export function RevenueChart() {
    const { t } = useLocale();
    const [period, setPeriod] = useState<Period>("7d");
    const { revenueChart, isLoading } = useDashboardStats(period);

    const periodOptions: { value: Period; label: string }[] = [
        { value: "7d",  label: t.finances.periodWeek ?? "7j" },
        { value: "30d", label: t.finances.periodMonth ?? "30j" },
        { value: "3m",  label: t.finances.period3Months ?? "3 mois" },
    ];

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>{t.dashboard.revenueChart}</CardTitle></CardHeader>
                <div className="p-6 pt-2">
                    <div className="flex items-end gap-3 h-48 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-t-md" style={{ height: `${30 + Math.random() * 70}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    const maxVal = Math.max(...revenueChart.map((d) => d.value), 1);
    const total = revenueChart.reduce((sum, d) => sum + d.value, 0);
    // For 3m, group by week to avoid overcrowding the chart
    const chartData = period === "3m"
        ? revenueChart.filter((_, i) => i % 7 === 6 || i === revenueChart.length - 1).slice(-13)
        : revenueChart;
    const chartMax = Math.max(...chartData.map((d) => d.value), 1);

    const exportCSV = () => {
        const rows = [["Période", "Chiffre d'affaires (FCFA)"], ...chartData.map((d) => [d.label, d.value])];
        const csv = rows.map((r) => r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chiffre-affaires-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle>{t.dashboard.revenueChart}</CardTitle>
                    <div className="flex items-center gap-1">
                        {periodOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                    period === opt.value
                                        ? "bg-brand-500 text-white shadow-sm"
                                        : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <button
                            onClick={exportCSV}
                            title="Exporter en CSV"
                            className="ml-1 p-1.5 rounded-lg text-surface-400 hover:text-brand-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            <Download size={14} />
                        </button>
                    </div>
                    <span className="text-lg font-bold text-surface-900 dark:text-white w-full sm:w-auto">
                        {formatCFA(total)}
                    </span>
                </div>
            </CardHeader>
            <div className="p-6 pt-2">
                <div className="flex items-end gap-1 sm:gap-2 h-48 overflow-x-auto">
                    {chartData.map((d, i) => {
                        const heightPct = (d.value / chartMax) * 100;
                        return (
                            <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-2">
                                {d.value > 0 && (
                                    <span className="text-xs text-surface-500 dark:text-surface-400 font-medium whitespace-nowrap hidden sm:block">
                                        {formatCFA(d.value).replace(" FCFA", "")}
                                    </span>
                                )}
                                <div className="w-full flex items-end" style={{ height: "160px" }}>
                                    <div
                                        className="w-full bg-brand-500 rounded-t-md transition-all hover:bg-brand-400"
                                        style={{ height: `${Math.max(heightPct, d.value > 0 ? 4 : 0)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
                                    {d.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
