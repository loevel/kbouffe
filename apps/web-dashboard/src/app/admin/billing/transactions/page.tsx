"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Store,
} from "lucide-react";
import { Badge, adminFetch } from "@kbouffe/module-core/ui";

interface TransactionRow {
    id: string;
    restaurantId: string | null;
    restaurantName: string | null;
    type: string;
    direction: string;
    amount: number;
    referenceType: string | null;
    referenceId: string | null;
    description: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const typeLabels: Record<string, string> = {
    order_commission: "Commission commande",
    payout: "Payout",
    refund: "Remboursement",
    ad_payment: "Publicité",
    subscription: "Abonnement",
};

function formatFCFA(val: number) {
    return new Intl.NumberFormat("fr-FR").format(val) + " FCFA";
}

export default function AdminTransactionsPage() {
    const [txs, setTxs] = useState<TransactionRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [directionFilter, setDirectionFilter] = useState("all");

    const fetchTxs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(typeFilter !== "all" && { type: typeFilter }),
                ...(directionFilter !== "all" && { direction: directionFilter }),
            });
            const res = await adminFetch(`/api/admin/billing/transactions?${params}`);
            const json = await res.json();
            setTxs(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch {
            console.error("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    }, [typeFilter, directionFilter]);

    useEffect(() => {
        fetchTxs(1);
    }, [fetchTxs]);

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Transactions</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Historique des mouvements financiers de la plateforme
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                >
                    <option value="all">Tous les types</option>
                    <option value="order_commission">Commission</option>
                    <option value="payout">Payout</option>
                    <option value="refund">Remboursement</option>
                    <option value="ad_payment">Publicité</option>
                    <option value="subscription">Abonnement</option>
                </select>
                <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                >
                    <option value="all">Toutes directions</option>
                    <option value="in">Entrant (revenu)</option>
                    <option value="out">Sortant (dépense)</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                                <th className="text-center px-4 py-3 font-medium text-surface-500 dark:text-surface-400 w-10"></th>
                                <th className="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Type</th>
                                <th className="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Restaurant</th>
                                <th className="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Description</th>
                                <th className="text-right px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Montant</th>
                                <th className="text-center px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-surface-400">Chargement...</td>
                                </tr>
                            ) : txs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-surface-400">Aucune transaction</td>
                                </tr>
                            ) : (
                                txs.map((tx) => (
                                    <tr key={tx.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                                        <td className="px-4 py-3 text-center">
                                            {tx.direction === "in" ? (
                                                <ArrowDownLeft size={16} className="text-green-500 inline-block" />
                                            ) : (
                                                <ArrowUpRight size={16} className="text-red-500 inline-block" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={tx.direction === "in" ? "success" : "danger"}>
                                                {typeLabels[tx.type] ?? tx.type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-surface-600 dark:text-surface-300">
                                            {tx.restaurantName ? (
                                                <span className="flex items-center gap-1">
                                                    <Store size={12} className="text-surface-400" />
                                                    {tx.restaurantName}
                                                </span>
                                            ) : (
                                                <span className="text-surface-400">Plateforme</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-surface-500 dark:text-surface-400 text-xs truncate max-w-[220px]">
                                            {tx.description ?? (tx.referenceId ? `Réf: ${tx.referenceId}` : "—")}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-semibold ${tx.direction === "in" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                            {tx.direction === "in" ? "+" : "−"}{formatFCFA(tx.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-surface-400">
                                            {new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-800">
                        <p className="text-sm text-surface-500">
                            Page {pagination.page} / {pagination.totalPages} — {pagination.total} résultats
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchTxs(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => fetchTxs(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
