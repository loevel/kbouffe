"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Wallet,
    Search,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Store,
} from "lucide-react";
import { Badge, adminFetch } from "@kbouffe/module-core/ui";

interface PayoutRow {
    id: string;
    restaurantId: string;
    restaurantName: string | null;
    amount: number;
    commissionAmount: number;
    grossAmount: number;
    status: string;
    paymentMethod: string;
    paymentReference: string | null;
    recipientPhone: string | null;
    recipientName: string | null;
    createdAt: string;
    processedAt: string | null;
    completedAt: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const statusBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; icon: typeof Clock }> = {
    pending: { label: "En attente", variant: "warning", icon: Clock },
    processing: { label: "En cours", variant: "info", icon: Loader2 },
    completed: { label: "Terminé", variant: "success", icon: CheckCircle },
    failed: { label: "Échoué", variant: "danger", icon: XCircle },
};

function formatFCFA(val: number) {
    return new Intl.NumberFormat("fr-FR").format(val) + " FCFA";
}

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchPayouts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(statusFilter !== "all" && { status: statusFilter }),
            });
            const res = await adminFetch(`/api/admin/billing/payouts?${params}`);
            const json = await res.json();
            setPayouts(json.data ?? []);
            setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch {
            console.error("Failed to fetch payouts");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchPayouts(1);
    }, [fetchPayouts]);

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdating(id);
        try {
            const res = await adminFetch("/api/admin/billing/payouts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
            }
        } finally {
            setUpdating(null);
        }
    };

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Payouts</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    {pagination.total} payouts — Gérez les virements vers les restaurants
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="processing">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="failed">Échoué</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                                <th className="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Restaurant</th>
                                <th className="text-right px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Brut</th>
                                <th className="text-right px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Commission</th>
                                <th className="text-right px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Net</th>
                                <th className="text-center px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Statut</th>
                                <th className="text-center px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Date</th>
                                <th className="text-center px-4 py-3 font-medium text-surface-500 dark:text-surface-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-surface-400">Chargement...</td>
                                </tr>
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-surface-400">Aucun payout trouvé</td>
                                </tr>
                            ) : (
                                payouts.map((p) => {
                                    const sc = statusBadge[p.status] ?? statusBadge.pending;
                                    const StatusIcon = sc.icon;
                                    return (
                                        <tr key={p.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Store size={14} className="text-surface-400" />
                                                    <span className="font-medium text-surface-900 dark:text-white">{p.restaurantName ?? "—"}</span>
                                                </div>
                                                {p.recipientPhone && (
                                                    <p className="text-xs text-surface-400 mt-0.5">{p.recipientPhone}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-300">{formatFCFA(p.grossAmount)}</td>
                                            <td className="px-4 py-3 text-right text-red-500">{formatFCFA(p.commissionAmount)}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-surface-900 dark:text-white">{formatFCFA(p.amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={sc.variant}>
                                                    <span className="flex items-center gap-1">
                                                        <StatusIcon size={12} />
                                                        {sc.label}
                                                    </span>
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-surface-400">
                                                {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {p.status === "pending" && (
                                                    <button
                                                        onClick={() => updateStatus(p.id, "processing")}
                                                        disabled={updating === p.id}
                                                        className="px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        Traiter
                                                    </button>
                                                )}
                                                {p.status === "processing" && (
                                                    <div className="flex gap-1 justify-center">
                                                        <button
                                                            onClick={() => updateStatus(p.id, "completed")}
                                                            disabled={updating === p.id}
                                                            className="px-2.5 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            Valider
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(p.id, "failed")}
                                                            disabled={updating === p.id}
                                                            className="px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            Échoué
                                                        </button>
                                                    </div>
                                                )}
                                                {(p.status === "completed" || p.status === "failed") && (
                                                    <span className="text-xs text-surface-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
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
                                onClick={() => fetchPayouts(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => fetchPayouts(pagination.page + 1)}
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
