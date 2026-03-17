"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Ban } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { OrderStatusBadge } from "@kbouffe/module-orders/ui";
import { formatCFA, formatDateTime, formatOrderId } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useOrders, updateOrderStatus } from "@/hooks/use-data";
import { useState } from "react";

export function RecentOrders() {
    const { t } = useLocale();
    const { orders, isLoading } = useOrders({ limit: 5, sort: "newest" });
    const recent = orders.slice(0, 5);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const quickUpdate = async (id: string, status: "ready" | "cancelled") => {
        setProcessingId(id);
        const { success, error } = await updateOrderStatus(id, status as any);
        if (!success) {
            console.error(error);
        }
        setProcessingId(null);
    };

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
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-surface-900 dark:text-white">
                                {formatCFA(order.total)}
                            </span>
                            {order.status === "pending" && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.preventDefault(); quickUpdate(order.id, "ready"); }}
                                        disabled={processingId === order.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={14} /> {t.dashboard.markReady ?? "Prêt"}
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); quickUpdate(order.id, "cancelled"); }}
                                        disabled={processingId === order.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                    >
                                        <Ban size={14} /> {t.common.cancel}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    );
}
