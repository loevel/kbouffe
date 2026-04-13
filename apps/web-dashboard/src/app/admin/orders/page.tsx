"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Search,
    X,
    Clock,
    CheckCircle,
    XCircle,
    Utensils,
    User,
    CreditCard,
    MapPin,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";
import { Badge, Button, adminFetch, toast } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";
import { useAdminOrders } from "@/hooks/admin";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { DateRangePicker, type DateRange } from "@/components/admin/DateRangePicker";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

interface OrderStats {
    totalToday: number;
    totalRevenueToday: number;
    pendingCount: number;
    disputedCount: number;
    refundedToday: number;
}

interface OrderDetail {
    id: string;
    restaurant: {
        id: string | null;
        name: string | null;
        logoUrl: string | null;
    };
    customer: {
        name: string;
        phone: string | null;
        address: string | null;
    };
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        notes?: string | null;
    }>;
    pricing: {
        subtotal: number;
        deliveryFee: number;
        serviceFee: number;
        tip: number;
        total: number;
    };
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    deliveryType: string;
    createdAt: string;
    updatedAt: string;
    notes: string | null;
    paymentTransaction: {
        id: string;
        provider: string | null;
        reference_id: string | null;
        external_id: string | null;
        amount: number;
        currency: string;
        status: string;
        provider_status: string | null;
        requested_at: string;
        completed_at: string | null;
        failed_reason: string | null;
    } | null;
}

const orderStatusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; className: string }> = {
    scheduled: { label: "Programmée", variant: "info", className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    pending: { label: "En attente", variant: "warning", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    accepted: { label: "Acceptée", variant: "info", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    preparing: { label: "En préparation", variant: "brand", className: "bg-brand-500/10 text-brand-600 dark:text-brand-400" },
    ready: { label: "Prête", variant: "success", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    completed: { label: "Finalisée", variant: "success", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
    cancelled: { label: "Annulée", variant: "danger", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "brand"; className: string }> = {
    pending: { label: "En attente", variant: "warning", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    paid: { label: "Payé", variant: "success", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Échoué", variant: "danger", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    refunded: { label: "Remboursé", variant: "info", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
};

const editableStatuses = ["scheduled", "pending", "accepted", "preparing", "ready", "completed", "cancelled"] as const;

function formatFCFA(value: number | null | undefined) {
    return new Intl.NumberFormat("fr-FR").format(value ?? 0) + " FCFA";
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return "—";
    return new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatCard({
    label,
    value,
    tone = "default",
}: {
    label: string;
    value: string | number;
    tone?: "default" | "warning" | "danger" | "success";
}) {
    const tones = {
        default: "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800",
        warning: "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/10",
        danger: "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/10",
        success: "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/10",
    } as const;

    return (
        <div className={cn("rounded-2xl border p-5", tones[tone])}>
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-surface-900 dark:text-white">{value}</p>
        </div>
    );
}

export default function AdminOrdersPage() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
    const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [statusDraft, setStatusDraft] = useState("pending");
    const [refundAmount, setRefundAmount] = useState("");
    const [refundType, setRefundType] = useState<"full" | "partial">("full");
    const [refundReason, setRefundReason] = useState("");
    const [submittingStatus, setSubmittingStatus] = useState(false);
    const [submittingRefund, setSubmittingRefund] = useState(false);

    const { orders, total, totalPages, loading, error, refetch } = useAdminOrders({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        payment_status: paymentStatusFilter || undefined,
        date_from: dateRange.from || undefined,
        date_to: dateRange.to || undefined,
        page,
        limit: 20,
    });

    const { data: stats } = useAdminQuery<OrderStats>("/api/admin/orders/stats");

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, paymentStatusFilter, dateRange.from, dateRange.to]);

    useEffect(() => {
        if (!selectedOrderId) return;

        let cancelled = false;
        setDetailLoading(true);
        setDetailError(null);

        adminFetch(`/api/admin/orders/${selectedOrderId}`)
            .then(async (res) => {
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error((json as { error?: string }).error ?? "Impossible de charger la commande");
                }
                if (!cancelled) {
                    const detail = json as OrderDetail;
                    setSelectedOrder(detail);
                    setStatusDraft(detail.status);
                    setRefundAmount(String(detail.pricing.total));
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setDetailError(err instanceof Error ? err.message : "Impossible de charger la commande");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setDetailLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [selectedOrderId]);

    const activeFilterCount = useMemo(
        () =>
            [
                debouncedSearch !== "",
                statusFilter !== "",
                paymentStatusFilter !== "",
                dateRange.from !== "" || dateRange.to !== "",
            ].filter(Boolean).length,
        [debouncedSearch, statusFilter, paymentStatusFilter, dateRange.from, dateRange.to],
    );

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("");
        setPaymentStatusFilter("");
        setDateRange({ from: "", to: "" });
        setPage(1);
    };

    const closePanel = () => {
        setSelectedOrderId(null);
        setSelectedOrder(null);
        setDetailError(null);
        setRefundReason("");
        setRefundType("full");
    };

    const refreshSelectedOrder = async () => {
        if (!selectedOrderId) return;
        setSelectedOrderId(null);
        setTimeout(() => setSelectedOrderId(selectedOrderId), 0);
    };

    const handleStatusUpdate = async () => {
        if (!selectedOrderId) return;
        setSubmittingStatus(true);
        try {
            const res = await adminFetch(`/api/admin/orders/${selectedOrderId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: statusDraft }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error((json as { error?: string }).error ?? "Impossible de mettre à jour le statut");
            }
            toast.success("Statut de la commande mis à jour");
            refetch();
            await refreshSelectedOrder();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur réseau");
        } finally {
            setSubmittingStatus(false);
        }
    };

    const handleRefund = async () => {
        if (!selectedOrderId || !selectedOrder) return;
        const amount = Number(refundAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Montant de remboursement invalide");
            return;
        }
        if (!refundReason.trim()) {
            toast.error("Le motif du remboursement est requis");
            return;
        }

        setSubmittingRefund(true);
        try {
            const res = await adminFetch(`/api/admin/orders/${selectedOrderId}/refund`, {
                method: "POST",
                body: JSON.stringify({
                    amount,
                    reason: refundReason.trim(),
                    type: refundType,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error((json as { error?: string }).error ?? "Impossible de rembourser la commande");
            }
            toast.success("Remboursement enregistré");
            setRefundReason("");
            refetch();
            await refreshSelectedOrder();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur réseau");
        } finally {
            setSubmittingRefund(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white">
                        Commandes plateforme
                    </h1>
                    <p className="mt-1 flex items-center gap-2 text-surface-500">
                        <ShoppingBag size={14} className="text-brand-500" />
                        Recherche, remboursement et correction de statut depuis le back-office.
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()} className="gap-2">
                    <RefreshCw size={16} />
                    Actualiser
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Commandes du jour" value={stats?.totalToday ?? 0} />
                <StatCard label="Revenus du jour" value={formatFCFA(stats?.totalRevenueToday)} tone="success" />
                <StatCard label="En attente" value={stats?.pendingCount ?? 0} tone="warning" />
                <StatCard label="Paiements en échec" value={stats?.disputedCount ?? 0} tone="danger" />
                <StatCard label="Remboursées aujourd'hui" value={stats?.refundedToday ?? 0} />
            </div>

            <AdminFilterBar onReset={resetFilters} activeFilterCount={activeFilterCount}>
                <div className="relative min-w-[280px] flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par ID, restaurant ou client..."
                        className="w-full rounded-xl bg-surface-50 px-11 py-3 text-sm text-surface-900 outline-none ring-0 dark:bg-surface-800/50 dark:text-white"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Statut</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-900 outline-none dark:bg-surface-800/50 dark:text-white"
                    >
                        <option value="">Tous</option>
                        {editableStatuses.map((status) => (
                            <option key={status} value={status}>
                                {orderStatusConfig[status]?.label ?? status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Paiement</span>
                    <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-900 outline-none dark:bg-surface-800/50 dark:text-white"
                    >
                        <option value="">Tous</option>
                        {Object.entries(paymentStatusConfig).map(([key, config]) => (
                            <option key={key} value={key}>
                                {config.label}
                            </option>
                        ))}
                    </select>
                </div>

                <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onChange={setDateRange}
                    label="Date commande"
                />
            </AdminFilterBar>

            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 bg-surface-50/60 dark:border-surface-800 dark:bg-surface-800/20">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Commande</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Restaurant</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Client</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">Montant</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-surface-400">Paiement</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-surface-400">Statut</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <AdminTableSkeleton rows={8} cols={7} />
                            ) : error ? (
                                <tr>
                                    <td colSpan={7}>
                                        <AdminEmptyState
                                            icon={<AlertTriangle size={28} />}
                                            title="Chargement impossible"
                                            description={error}
                                            action={{ label: "Réessayer", onClick: () => refetch() }}
                                        />
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <AdminEmptyState
                                            title="Aucune commande trouvée"
                                            description="Modifiez les filtres ou élargissez la période de recherche."
                                            action={{ label: "Réinitialiser", onClick: resetFilters }}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="cursor-pointer border-b border-surface-100 transition-colors hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800/20"
                                        onClick={() => setSelectedOrderId(order.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold text-surface-900 dark:text-white">{order.id}</span>
                                                <span className="text-xs text-surface-400">{order.itemCount} article(s)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-surface-900 dark:text-white">{order.restaurantName}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-surface-900 dark:text-white">{order.customerName}</span>
                                                <span className="text-xs text-surface-400">{order.customerPhone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-surface-900 dark:text-white">{formatFCFA(order.total)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={paymentStatusConfig[order.paymentStatus]?.variant ?? "default"} className={cn("border-none", paymentStatusConfig[order.paymentStatus]?.className)}>
                                                {paymentStatusConfig[order.paymentStatus]?.label ?? order.paymentStatus}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={orderStatusConfig[order.status]?.variant ?? "default"} className={cn("border-none", orderStatusConfig[order.status]?.className)}>
                                                {orderStatusConfig[order.status]?.label ?? order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-500">{formatDateTime(order.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-surface-100 px-6 py-4 dark:border-surface-800">
                        <p className="text-xs text-surface-500">
                            {orders.length} commande(s) affichée(s) sur {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                                Précédent
                            </Button>
                            <span className="text-xs font-bold text-surface-500">Page {page} / {totalPages}</span>
                            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                                Suivant
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedOrderId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={closePanel}
                    >
                        <motion.aside
                            initial={{ x: 480 }}
                            animate={{ x: 0 }}
                            exit={{ x: 480 }}
                            transition={{ type: "spring", stiffness: 260, damping: 28 }}
                            className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-surface-950"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-500">Commande</p>
                                    <h2 className="mt-1 text-xl font-black text-surface-900 dark:text-white">{selectedOrderId}</h2>
                                </div>
                                <Button variant="ghost" size="sm" onClick={closePanel}>
                                    <X size={16} />
                                </Button>
                            </div>

                            {detailLoading ? (
                                <div className="space-y-3">
                                    <div className="h-24 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
                                    <div className="h-48 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
                                </div>
                            ) : detailError || !selectedOrder ? (
                                <AdminEmptyState
                                    icon={<AlertTriangle size={28} />}
                                    title="Impossible de charger la commande"
                                    description={detailError ?? "Veuillez réessayer."}
                                    action={{ label: "Réessayer", onClick: () => refreshSelectedOrder() }}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-surface-200 p-4 dark:border-surface-800">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Client</p>
                                            <div className="mt-3 space-y-2 text-sm text-surface-700 dark:text-surface-300">
                                                <p className="flex items-center gap-2 font-semibold"><User size={14} /> {selectedOrder.customer.name}</p>
                                                <p className="flex items-center gap-2"><CreditCard size={14} /> {selectedOrder.customer.phone ?? "Téléphone indisponible"}</p>
                                                <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> {selectedOrder.customer.address ?? "Adresse indisponible"}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-surface-200 p-4 dark:border-surface-800">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Paiement</p>
                                            <div className="mt-3 space-y-2 text-sm text-surface-700 dark:text-surface-300">
                                                <p>Méthode : <span className="font-semibold">{selectedOrder.paymentMethod ?? "Non renseignée"}</span></p>
                                                <p>Statut : <span className="font-semibold">{paymentStatusConfig[selectedOrder.paymentStatus]?.label ?? selectedOrder.paymentStatus}</span></p>
                                                <p>Référence : <span className="font-mono text-xs">{selectedOrder.paymentTransaction?.reference_id ?? selectedOrder.paymentTransaction?.external_id ?? "—"}</span></p>
                                                <p>Transaction : <span className="font-semibold">{selectedOrder.paymentTransaction?.status ?? "—"}</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-surface-200 p-4 dark:border-surface-800">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Articles commandés</p>
                                                <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-white">{selectedOrder.restaurant.name ?? "Restaurant inconnu"}</p>
                                            </div>
                                            <Badge variant={orderStatusConfig[selectedOrder.status]?.variant ?? "default"} className={cn("border-none", orderStatusConfig[selectedOrder.status]?.className)}>
                                                {orderStatusConfig[selectedOrder.status]?.label ?? selectedOrder.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item) => (
                                                <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-900">
                                                    <div>
                                                        <p className="font-semibold text-surface-900 dark:text-white">{item.quantity} × {item.name}</p>
                                                        {item.notes && <p className="mt-1 text-xs text-surface-400">{item.notes}</p>}
                                                    </div>
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white">{formatFCFA(item.price * item.quantity)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 space-y-2 border-t border-surface-100 pt-4 text-sm dark:border-surface-800">
                                            <div className="flex justify-between"><span>Sous-total</span><span>{formatFCFA(selectedOrder.pricing.subtotal)}</span></div>
                                            <div className="flex justify-between"><span>Livraison</span><span>{formatFCFA(selectedOrder.pricing.deliveryFee)}</span></div>
                                            <div className="flex justify-between"><span>Frais de service</span><span>{formatFCFA(selectedOrder.pricing.serviceFee)}</span></div>
                                            <div className="flex justify-between"><span>Pourboire</span><span>{formatFCFA(selectedOrder.pricing.tip)}</span></div>
                                            <div className="flex justify-between border-t border-surface-100 pt-2 font-black dark:border-surface-800"><span>Total</span><span>{formatFCFA(selectedOrder.pricing.total)}</span></div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-2xl border border-surface-200 p-4 dark:border-surface-800">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Modifier le statut</p>
                                            <div className="mt-4 flex gap-3">
                                                <select
                                                    value={statusDraft}
                                                    onChange={(e) => setStatusDraft(e.target.value)}
                                                    className="flex-1 rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-900 outline-none dark:bg-surface-900 dark:text-white"
                                                >
                                                    {editableStatuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {orderStatusConfig[status]?.label ?? status}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button onClick={handleStatusUpdate} disabled={submittingStatus}>
                                                    {submittingStatus ? "Mise à jour..." : "Enregistrer"}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-surface-200 p-4 dark:border-surface-800">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Remboursement</p>
                                            <div className="mt-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={selectedOrder.pricing.total}
                                                        value={refundAmount}
                                                        onChange={(e) => setRefundAmount(e.target.value)}
                                                        className="rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-900 outline-none dark:bg-surface-900 dark:text-white"
                                                        placeholder="Montant"
                                                    />
                                                    <select
                                                        value={refundType}
                                                        onChange={(e) => setRefundType(e.target.value as "full" | "partial")}
                                                        className="rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-900 outline-none dark:bg-surface-900 dark:text-white"
                                                    >
                                                        <option value="full">Complet</option>
                                                        <option value="partial">Partiel</option>
                                                    </select>
                                                </div>
                                                <textarea
                                                    value={refundReason}
                                                    onChange={(e) => setRefundReason(e.target.value)}
                                                    className="min-h-24 w-full rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-900 outline-none dark:bg-surface-900 dark:text-white"
                                                    placeholder="Motif du remboursement"
                                                />
                                                <Button variant="outline" onClick={handleRefund} disabled={submittingRefund}>
                                                    {submittingRefund ? "Remboursement..." : "Confirmer le remboursement"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-surface-200 p-4 dark:border-surface-800">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">Chronologie</p>
                                        <div className="mt-4 space-y-3 text-sm text-surface-700 dark:text-surface-300">
                                            <div className="flex items-center gap-3">
                                                <Clock size={14} className="text-brand-500" />
                                                <span>Créée le {formatDateTime(selectedOrder.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle size={14} className="text-surface-400" />
                                                <span>Dernière mise à jour le {formatDateTime(selectedOrder.updatedAt)}</span>
                                            </div>
                                            {selectedOrder.paymentTransaction?.completed_at && (
                                                <div className="flex items-center gap-3">
                                                    <CreditCard size={14} className="text-emerald-500" />
                                                    <span>Paiement finalisé le {formatDateTime(selectedOrder.paymentTransaction.completed_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
