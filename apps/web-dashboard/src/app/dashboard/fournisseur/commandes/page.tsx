"use client";

/**
 * Commandes Reçues — Dashboard Fournisseur KBouffe
 *
 * Fonctionnalités :
 *   - Tableau des commandes avec date, produit, qté, restaurant, total, statut
 *   - Filtre par statut
 *   - Résumé du chiffre d'affaires en haut
 *   - Boutons d'action : Confirmer (pending) / Marquer livré (confirmed)
 *   - État vide illustré si aucune commande
 */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    ShoppingCart,
    TrendingUp,
    Loader2,
    Filter,
    AlertCircle,
    Store,
    Calendar,
    CheckCircle2,
    PackageCheck,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { useSupplier } from "../SupplierContext";

// ── Types ──────────────────────────────────────────────────────────────────

interface Order {
    id: string;
    supplier_id: string;
    product_id: string;
    restaurant_id: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    delivery_status: "pending" | "confirmed" | "delivered" | "disputed" | "cancelled";
    expected_delivery_date: string | null;
    actual_delivery_date: string | null;
    notes: string | null;
    created_at: string;
    // Joined
    product?: { id: string; name: string; category: string; unit: string };
    supplier?: { id: string; name: string };
    restaurant?: { id: string; name: string };
}

type StatusFilter = "all" | "pending" | "confirmed" | "delivered" | "disputed" | "cancelled";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(dateStr));
}

// ── Status badge ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    pending: {
        label: "En attente",
        bg: "bg-amber-500/15",
        text: "text-amber-300",
        border: "border-amber-500/20",
        dot: "bg-amber-400",
    },
    confirmed: {
        label: "Confirmée",
        bg: "bg-blue-500/15",
        text: "text-blue-300",
        border: "border-blue-500/20",
        dot: "bg-blue-400",
    },
    delivered: {
        label: "Livrée",
        bg: "bg-emerald-500/15",
        text: "text-emerald-300",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400",
    },
    disputed: {
        label: "En litige",
        bg: "bg-red-500/15",
        text: "text-red-300",
        border: "border-red-500/20",
        dot: "bg-red-400",
    },
    cancelled: {
        label: "Annulée",
        bg: "bg-surface-800",
        text: "text-surface-500",
        border: "border-white/8",
        dot: "bg-surface-500",
    },
} as const;

function StatusBadge({ status }: { status: string }) {
    const cfg =
        STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ── Filter pill ────────────────────────────────────────────────────────────

function FilterPill({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                    ? "bg-brand-500/15 text-brand-300 border border-brand-500/25"
                    : "bg-surface-900 text-surface-400 border border-white/8 hover:text-white hover:bg-surface-800"
            }`}
            aria-pressed={active}
        >
            {label}
            {count > 0 && (
                <span
                    className={`min-w-[18px] h-[18px] rounded-full text-xs flex items-center justify-center px-1 ${
                        active
                            ? "bg-brand-500/30 text-brand-200"
                            : "bg-surface-700 text-surface-400"
                    }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

// ── Summary cards ──────────────────────────────────────────────────────────

function SummaryCard({
    label,
    value,
    icon: Icon,
    iconColor,
    iconBg,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <div className="bg-surface-900 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
            <div
                className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
            >
                <Icon size={20} className={iconColor} />
            </div>
            <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">
                    {label}
                </p>
                <p className="text-lg font-bold text-white mt-0.5">{value}</p>
            </div>
        </div>
    );
}

// ── Order action button ────────────────────────────────────────────────────

function OrderActionButton({
    order,
    onStatusChange,
}: {
    order: Order;
    onStatusChange: (id: string, newStatus: Order["delivery_status"]) => void;
}) {
    const [loading, setLoading] = useState(false);

    if (order.delivery_status !== "pending" && order.delivery_status !== "confirmed") {
        return null;
    }

    const isPending = order.delivery_status === "pending";
    const targetStatus = isPending ? "confirmed" : "delivered";
    const label = isPending ? "Confirmer" : "Marquer livré";
    const Icon = isPending ? CheckCircle2 : PackageCheck;
    const colorClass = isPending
        ? "bg-blue-500/15 text-blue-300 border-blue-500/25 hover:bg-blue-500/25"
        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25";

    async function handleClick() {
        setLoading(true);
        try {
            const res = await authFetch(
                `/api/marketplace/suppliers/me/orders/${order.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ delivery_status: targetStatus }),
                }
            );
            if (res.ok) {
                onStatusChange(order.id, targetStatus as Order["delivery_status"]);
            }
        } catch (err) {
            console.error("Order status update error:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${colorClass}`}
            title={label}
        >
            {loading ? (
                <Loader2 size={13} className="animate-spin" />
            ) : (
                <Icon size={13} />
            )}
            {label}
        </button>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function CommandesPage() {
    const { supplier } = useSupplier();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    useEffect(() => {
        if (!supplier) return;

        async function fetchOrders() {
            setLoading(true);
            setError(null);
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/orders");
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                const data = (await res.json()) as any;
                const list = Array.isArray(data) ? data : (data?.orders ?? []);
                setOrders(list as Order[]);
            } catch (err: any) {
                setError(err?.message ?? "Erreur lors du chargement des commandes.");
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [supplier]);

    function handleStatusChange(id: string, newStatus: Order["delivery_status"]) {
        setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, delivery_status: newStatus } : o))
        );
    }

    // Counts per status
    const countByStatus = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const o of orders) {
            counts[o.delivery_status] = (counts[o.delivery_status] ?? 0) + 1;
        }
        return counts;
    }, [orders]);

    // Filtered orders
    const filtered = useMemo(
        () =>
            statusFilter === "all"
                ? orders
                : orders.filter((o) => o.delivery_status === statusFilter),
        [orders, statusFilter]
    );

    // Revenue from delivered orders
    const totalRevenue = useMemo(
        () =>
            orders
                .filter((o) => o.delivery_status === "delivered")
                .reduce((acc, o) => acc + o.total_price, 0),
        [orders]
    );

    // Count of actionable orders (pending + confirmed)
    const actionableCount = useMemo(
        () => orders.filter((o) => o.delivery_status === "pending" || o.delivery_status === "confirmed").length,
        [orders]
    );

    const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
        { value: "all", label: "Toutes" },
        { value: "pending", label: "En attente" },
        { value: "confirmed", label: "Confirmées" },
        { value: "delivered", label: "Livrées" },
        { value: "cancelled", label: "Annulées" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Commandes reçues
                </h1>
                <p className="text-surface-400 text-sm mt-1">
                    Toutes les commandes passées par les restaurants
                </p>
            </div>

            {/* Actionable orders banner */}
            {!loading && actionableCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
                >
                    <CheckCircle2 size={16} className="shrink-0 text-amber-400" />
                    <span>
                        <strong className="text-amber-200">{actionableCount} commande{actionableCount > 1 ? "s" : ""}</strong>{" "}
                        nécessite{actionableCount === 1 ? "" : "nt"} votre action (confirmation ou livraison).
                    </span>
                </motion.div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SummaryCard
                    label="Total commandes"
                    value={String(orders.length)}
                    icon={ShoppingCart}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/15"
                />
                <SummaryCard
                    label="Chiffre d'affaires (livré)"
                    value={formatFCFA(totalRevenue)}
                    icon={TrendingUp}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/15"
                />
            </div>

            {/* Filters */}
            {!loading && orders.length > 0 && (
                <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Filtrer par statut"
                >
                    <Filter size={16} className="text-surface-500 self-center shrink-0" />
                    {FILTER_OPTIONS.map((f) => (
                        <FilterPill
                            key={f.value}
                            label={f.label}
                            count={f.value === "all" ? 0 : (countByStatus[f.value] ?? 0)}
                            active={statusFilter === f.value}
                            onClick={() => setStatusFilter(f.value)}
                        />
                    ))}
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    <AlertCircle size={17} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden"
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="text-brand-400 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-white/8 flex items-center justify-center mb-5">
                            <ShoppingCart size={28} className="text-surface-500" />
                        </div>
                        <p className="text-white font-semibold text-lg mb-2">
                            {statusFilter !== "all"
                                ? `Aucune commande « ${FILTER_OPTIONS.find((f) => f.value === statusFilter)?.label ?? ""} »`
                                : "Aucune commande reçue pour l'instant"}
                        </p>
                        <p className="text-sm text-surface-500 max-w-md">
                            {statusFilter === "all"
                                ? "Votre catalogue est visible par tous les restaurants de votre région une fois votre compte validé. Les commandes apparaîtront ici."
                                : "Aucune commande ne correspond à ce filtre pour le moment."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px]">
                            <thead>
                                <tr className="border-b border-white/8">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                        Produit
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden sm:table-cell">
                                        Qté
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">
                                        Restaurant
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order, i) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.3 }}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                    >
                                        {/* Date */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-sm text-surface-400">
                                                <Calendar size={13} className="text-surface-500 shrink-0" />
                                                {formatDate(order.created_at)}
                                            </div>
                                        </td>

                                        {/* Product */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm font-semibold text-white">
                                                {order.product?.name ?? "Produit #" + order.product_id.slice(0, 6)}
                                            </p>
                                            {order.product?.category && (
                                                <p className="text-xs text-surface-500">
                                                    {order.product.category}
                                                </p>
                                            )}
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <span className="text-sm text-white font-medium tabular-nums">
                                                {order.quantity}{" "}
                                                <span className="text-surface-500">
                                                    {order.unit ?? order.product?.unit ?? ""}
                                                </span>
                                            </span>
                                        </td>

                                        {/* Restaurant */}
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <Store size={13} className="text-surface-500 shrink-0" />
                                                <span className="text-sm text-surface-400">
                                                    {order.restaurant?.name ?? "Restaurant"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-bold text-white tabular-nums">
                                                {formatFCFA(order.total_price)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3.5">
                                            <StatusBadge status={order.delivery_status} />
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3.5 text-right">
                                            <OrderActionButton
                                                order={order}
                                                onStatusChange={handleStatusChange}
                                            />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
