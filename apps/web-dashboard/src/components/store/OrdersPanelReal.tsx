import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    AlertCircle,
    ChefHat,
    CheckCircle2,
    Clock,
    ClipboardList,
    Loader2,
    Package,
    RotateCcw,
    ShoppingBag,
    Star,
    Truck,
    X,
} from "lucide-react";
import { useRecentOrders, type RecentOrder } from "@/store/client-store";
import { formatCFA } from "@kbouffe/module-core/ui";
import toast from "react-hot-toast";

// ── Status display ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<
    RecentOrder["status"],
    { label: string; color: string; icon: React.ReactNode }
> = {
    pending:    { label: "En attente",     color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300 border-yellow-100 dark:border-yellow-500/20",   icon: <Clock size={12} /> },
    accepted:   { label: "Confirmée",      color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-100 dark:border-blue-500/20",               icon: <CheckCircle2 size={12} /> },
    preparing:  { label: "En préparation", color: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 border-brand-100 dark:border-brand-500/20",        icon: <Loader2 size={12} className="animate-spin" /> },
    ready:      { label: "Prête",          color: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 border-green-100 dark:border-green-500/20",         icon: <CheckCircle2 size={12} /> },
    delivering: { label: "En livraison",   color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border-purple-100 dark:border-purple-500/20",  icon: <Truck size={12} /> },
    delivered:  { label: "Livrée",         color: "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border-surface-200 dark:border-surface-700", icon: <CheckCircle2 size={12} /> },
    cancelled:  { label: "Annulée",        color: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 border-red-100 dark:border-red-500/20",                    icon: <X size={12} /> },
};

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ 
    order, 
    onCancel, 
    isCancelling 
}: { 
    order: RecentOrder; 
    onCancel?: (id: string) => Promise<void>;
    isCancelling?: boolean;
}) {
    const meta = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
    const dateLabel = new Date(order.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const shortRef = `#KB-${order.id.slice(-6).toUpperCase()}`;

    return (
        <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-surface-300 dark:hover:border-surface-600 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <p className="font-semibold text-surface-900 dark:text-white text-sm">{shortRef}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {order.restaurantName}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${meta.color}`}>
                    {meta.icon}
                    {meta.label}
                </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-surface-500 dark:text-surface-400 mt-3">
                <span>{order.itemCount} article{order.itemCount !== 1 ? "s" : ""} • {formatCFA(order.total)}</span>
                <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                {order.status === "pending" && onCancel && (
                    <button
                        onClick={() => onCancel(order.id)}
                        disabled={isCancelling}
                        className="flex-1 text-center py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                        {isCancelling ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Annuler"}
                    </button>
                )}
                {order.status === "delivered" && (
                    <Link
                        href={`/stores/orders/${order.id}#review`}
                        className="flex-1 text-center py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-300 transition-colors inline-flex items-center justify-center gap-1"
                    >
                        <Star size={12} />
                        Laisser un avis
                    </Link>
                )}
                <Link
                    href={`/stores/orders/${order.id}`}
                    className="flex-1 text-center py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-xs font-semibold text-surface-700 dark:text-surface-300 transition-colors"
                >
                    Détails
                </Link>
                <Link
                    href={`/r/${order.restaurantSlug}`}
                    className="flex-[1.5] text-center py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white transition-colors"
                >
                    Commander à nouveau
                </Link>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function OrdersPanelReal() {
    const [orders, setOrders] = useState<RecentOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancellingId, setIsCancellingId] = useState<string | null>(null);
    const syncStore = useRecentOrders((s) => s.addOrder);

    const fetchOrders = useCallback(async () => {
        const localOrders = useRecentOrders.getState().orders;
        try {
            const res = await fetch("/api/auth/orders");
            if (res.ok) {
                const data = await res.json();
                // Merge API orders with local store orders (dedup by id, API takes precedence)
                const apiIds = new Set(data.map((o: RecentOrder) => o.id));
                const localOnly = localOrders.filter((o) => !apiIds.has(o.id));
                setOrders([...data, ...localOnly]);
                data.slice(0, 5).forEach((o: RecentOrder) => syncStore(o));
            } else {
                // Not authenticated or API error — show local store orders
                setOrders(localOrders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            setOrders(localOrders);
        } finally {
            setIsLoading(false);
        }
    }, [syncStore]);

    useEffect(() => {
        fetchOrders();
        // Refresh every 30 seconds to update statuses
        const interval = setInterval(fetchOrders, 30_000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleCancel = async (id: string) => {
        if (isCancellingId) return;
        setIsCancellingId(id);
        try {
            const res = await fetch(`/api/auth/orders/${id}/cancel`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Commande annulée");
                await fetchOrders();
            } else {
                const err = await res.json();
                toast.error(err.error || "Impossible d'annuler");
            }
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setIsCancellingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
                <p className="text-surface-500 text-sm">Chargement de votre historique...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-8 text-center">
                <ShoppingBag size={48} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                    Aucune commande
                </h2>
                <p className="text-surface-500 dark:text-surface-400 text-sm mb-6 max-w-xs mx-auto">
                    Vos commandes apparaîtront ici après votre premier achat.
                </p>
                <Link
                    href="/stores"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                    <ChefHat size={16} />
                    Explorer les restaurants
                </Link>
            </div>
        );
    }

    const active = orders.filter((o) => ["pending", "accepted", "preparing", "ready", "delivering"].includes(o.status));
    const past = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

    return (
        <div className="space-y-6">
            {active.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <Loader2 size={16} className="text-brand-500 animate-spin" />
                        En cours
                        <span className="ml-1 text-sm font-normal text-surface-500">({active.length})</span>
                    </h2>
                    <div className="space-y-3">
                        {active.map((o) => (
                            <OrderCard 
                                key={o.id} 
                                order={o} 
                                onCancel={handleCancel}
                                isCancelling={isCancellingId === o.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {past.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <ClipboardList size={16} className="text-surface-400" />
                        Historique
                        <span className="ml-1 text-sm font-normal text-surface-500">({past.length})</span>
                    </h2>
                    <div className="space-y-3">
                        {past.map((o) => <OrderCard key={o.id} order={o} />)}
                    </div>
                </section>
            )}
        </div>
    );
}
