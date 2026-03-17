"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { OrderStatusBadge } from "@kbouffe/module-orders/ui";
import { formatCFA, formatDateTime, formatOrderId } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useOrders } from "@/hooks/use-data";

export function RecentOrders() {
    const { t } = useLocale();
    const { orders, isLoading } = useOrders({ limit: 5, sort: "newest" });
    const recent = orders.slice(0, 5);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t.dashboard.recentOrders}</CardTitle>
                </CardHeader>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-6 py-3 animate-pulse">
                            <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{t.dashboard.recentOrders}</CardTitle>
                    <Link href="/dashboard/orders" className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                        {t.dashboard.viewAll} <ArrowRight size={14} />
                    </Link>
                </div>
            </CardHeader>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {recent.map((order) => (
                    <Link
                        key={order.id}
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-center justify-between px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-surface-900 dark:text-white">
                                    {formatOrderId(order.id)}
                                </span>
                                <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                {order.customer_name} — {formatDateTime(order.created_at)}
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-surface-900 dark:text-white ml-4">
                            {formatCFA(order.total)}
                        </span>
                    </Link>
                ))}
            </div>
        </Card>
    );
}
