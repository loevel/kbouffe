"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, History } from "lucide-react";

interface HistoryOrder {
    id: string;
    customer_name: string;
    delivery_address: string | null;
    total: number;
    status: string;
    delivered_at: string | null;
    updated_at: string;
    restaurants: { name: string } | null;
}

function formatPrice(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

export function DriverHistory() {
    const [orders, setOrders] = useState<HistoryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        async function fetchHistory() {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);
            try {
                const res = await fetch(`/api/driver/history?page=${page}&limit=${LIMIT}`);
                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setError(data.error ?? "Impossible de charger l'historique.");
                    return;
                }

                const nextOrders = Array.isArray(data.orders) ? (data.orders as HistoryOrder[]) : [];
                setOrders((current) => (page === 1 ? nextOrders : [...current, ...nextOrders]));
                setTotal(data.total ?? 0);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        }
        fetchHistory();
    }, [page]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-orange-500" />
                <p className="text-sm text-surface-500">Chargement…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <History size={28} className="text-red-400" />
                </div>
                <div>
                    <p className="font-semibold text-surface-700 dark:text-surface-300">Historique indisponible</p>
                    <p className="text-sm text-surface-500 mt-1">{error}</p>
                </div>
                <button
                    onClick={() => setPage(1)}
                    className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <History size={28} className="text-surface-400" />
                </div>
                <div>
                    <p className="font-semibold text-surface-700 dark:text-surface-300">Aucune livraison</p>
                    <p className="text-sm text-surface-500 mt-1">Votre historique apparaîtra ici.</p>
                </div>
            </div>
        );
    }

    const hasMore = page * LIMIT < total;

    return (
        <div className="space-y-3 pb-4">
            <p className="text-xs text-surface-500">{total} livraison{total > 1 ? "s" : ""} au total</p>

            {orders.map((order) => (
                <div
                    key={order.id}
                    className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 flex items-start gap-3"
                >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-surface-900 dark:text-white text-sm truncate">
                            {order.customer_name}
                        </p>
                        {order.delivery_address && (
                            <p className="text-xs text-surface-500 mt-0.5 truncate">
                                {order.delivery_address}
                            </p>
                        )}
                        <p className="text-xs text-surface-400 mt-1">
                            {order.restaurants?.name} · {formatDate(order.delivered_at ?? order.updated_at)}
                        </p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-bold text-surface-900 dark:text-white">
                        {formatPrice(order.total)}
                    </p>
                </div>
            ))}

            {hasMore && (
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                    className="w-full py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                    {loadingMore ? "Chargement…" : "Voir plus"}
                </button>
            )}
        </div>
    );
}
