"use client";

import { TrendingUp, Truck, Wallet } from "lucide-react";
import { Card } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useOrders } from "@/hooks/use-data";
import { useLocale } from "@kbouffe/module-core/ui";

export function FinanceSummaryCards() {
    const { t } = useLocale();
    const { orders, isLoading } = useOrders({ limit: 200 });
    const completedOrders = orders.filter(o => o.status === "completed" || o.status === "ready" || o.status === "preparing" || o.status === "accepted");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalDelivery = completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0);
    const netRevenue = totalRevenue;

    const cards = [
        { label: t.finances.totalRevenue, value: formatCFA(totalRevenue), icon: <TrendingUp size={20} />, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
        { label: t.finances.deliveryFees, value: formatCFA(totalDelivery), icon: <Truck size={20} />, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
        { label: t.finances.netRevenue, value: formatCFA(netRevenue), icon: <Wallet size={20} />, color: "text-brand-500 bg-brand-100 dark:bg-brand-900/30" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
