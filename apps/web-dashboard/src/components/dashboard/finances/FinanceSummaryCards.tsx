"use client";

import { TrendingUp, Truck, Wallet, DollarSign } from "lucide-react";
import { Card } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

interface FinanceSummaryProps {
    summary: {
        grossRevenue: number;
        deliveryRevenue: number;
        feesRevenue: number;
        tipsRevenue: number;
        totalRevenue: number;
        transactionCount: number;
        avgOrderValue: number;
        totalPaidOut: number;
        pendingPayouts: number;
    };
}

export function FinanceSummaryCards({ summary }: FinanceSummaryProps) {
    const { t } = useLocale();

    const cards = [
        {
            label: "Revenu brut",
            value: formatCFA(summary.grossRevenue),
            icon: <TrendingUp size={20} />,
            color: "text-green-500 bg-green-100 dark:bg-green-900/30"
        },
        {
            label: "Livraisons",
            value: formatCFA(summary.deliveryRevenue),
            icon: <Truck size={20} />,
            color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
        },
        {
            label: "Frais & Services",
            value: formatCFA(summary.feesRevenue),
            icon: <DollarSign size={20} />,
            color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30"
        },
        {
            label: "Revenu total",
            value: formatCFA(summary.totalRevenue),
            icon: <Wallet size={20} />,
            color: "text-brand-500 bg-brand-100 dark:bg-brand-900/30"
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <Card key={card.label}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm text-surface-500 dark:text-surface-400">{card.label}</p>
                            <p className="text-xl font-bold text-surface-900 dark:text-white mt-0.5">{card.value}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
