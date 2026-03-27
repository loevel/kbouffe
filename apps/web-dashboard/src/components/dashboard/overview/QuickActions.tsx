"use client";

import Link from "next/link";
import { AlertTriangle, Timer, CalendarClock, ArrowRight } from "lucide-react";
import { Card } from "@kbouffe/module-core/ui";
import { useDashboardStats, useOrders } from "@kbouffe/module-orders/ui";
import { useLocale } from "@kbouffe/module-core/ui";

export function QuickActions() {
    const { t } = useLocale();
    const { stats } = useDashboardStats();
    const { orders } = useOrders({ status: "pending", limit: 10, sort: "newest" });

    const pendingOrders = stats?.orders?.pending ?? orders.length;

    const cards = [
        {
            title: t.dashboard.pendingOrders ?? "Commandes en attente",
            value: pendingOrders,
            description: t.dashboard.pendingOrdersDesc ?? "Valider ou préparer les commandes en file.",
            href: "/dashboard/orders?status=pending",
            icon: <Timer size={16} />,
            tone: "amber",
        },
        {
            title: t.reservations?.title ?? "Réservations du jour",
            value: "—",
            description: t.reservations ? t.reservations.subtitle ?? "Confirmer les arrivées." : "Confirmer les arrivées et assigner les tables.",
            href: "/dashboard/reservations",
            icon: <CalendarClock size={16} />,
            tone: "blue",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Actions rapides">
            {cards.map((card, idx) => (
                <Card key={idx} className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3">
                        <span className={`p-2 rounded-lg ${card.tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"} dark:${card.tone === "amber" ? "bg-amber-500/10 text-amber-200" : "bg-blue-500/10 text-blue-200"}`}>
                            {card.icon}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-surface-900 dark:text-white">{card.title}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">{card.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-surface-900 dark:text-white">{card.value}</span>
                        <Link href={card.href} className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-semibold">
                            {t.dashboard.viewAll} <ArrowRight size={14} />
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    );
}
