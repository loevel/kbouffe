"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    ChefHat,
    Clock,
    Loader2,
    MapPin,
    Package,
    RotateCcw,
    Truck,
    Utensils,
    X,
} from "lucide-react";
import { formatCFA } from "@/lib/format";
import { useRecentOrders } from "@/store/client-store";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderDetail {
    id: string;
    status: string;
    payment_status: string;
    delivery_type: string;
    delivery_address: string | null;
    customer_name: string;
    customer_phone: string;
    items: Array<{ productId: string; name: string; price: number; quantity: number }>;
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    total: number;
    created_at: string;
    updated_at: string;
    preparation_time_minutes: number | null;
    scheduled_for: string | null;
    delivered_at: string | null;
    delivery_note: string | null;
    notes: string | null;
    table_number: string | null;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STEPS = [
    { id: "pending",    label: "Commande reçue",       desc: "Votre commande a été enregistrée" },
    { id: "confirmed",  label: "Confirmée",             desc: "Le restaurant a confirmé votre commande" },
    { id: "preparing",  label: "En préparation",        desc: "Le restaurant prépare vos plats" },
    { id: "ready",      label: "Prête",                 desc: "Votre commande est prête" },
    { id: "delivering", label: "En cours de livraison", desc: "Un livreur est en route" },
    { id: "delivered",  label: "Livrée",                desc: "Commande remise avec succès" },
] as const;

const CANCELLED_STEP = { id: "cancelled", label: "Annulée", desc: "Cette commande a été annulée" };

const STATUS_ORDER = STATUS_STEPS.map((s) => s.id);

const DELIVERY_TYPE_LABELS: Record<string, string> = {
    delivery: "Livraison à domicile",
    pickup:   "À emporter",
    dine_in:  "Sur place",
};

const DELIVERY_TYPE_ICONS: Record<string, React.ReactNode> = {
    delivery: <Truck size={16} />,
    pickup:   <Package size={16} />,
    dine_in:  <Utensils size={16} />,
};

// ── Timeline ──────────────────────────────────────────────────────────────────
function Timeline({ status }: { status: string }) {
    const isCancelled = status === "cancelled";
    const currentIdx  = STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number]);

    if (isCancelled) {
        return (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <X size={20} className="text-red-500 shrink-0" />
                <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">{CANCELLED_STEP.label}</p>
                    <p className="text-sm text-red-600/70 dark:text-red-400">{CANCELLED_STEP.desc}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {STATUS_STEPS.map((step, idx) => {
                const done   = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                    <div key={step.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                            <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                                    done   ? "bg-brand-500 text-white" :
                                    active ? "bg-brand-500 text-white ring-4 ring-brand-500/20" :
                                             "bg-surface-100 dark:bg-surface-800 text-surface-400"
                                }`}
                            >
                                {done ? <CheckCircle2 size={14} /> : active && step.id === "preparing" ? <Loader2 size={14} className="animate-spin" /> : ""}
                            </span>
                            {idx < STATUS_STEPS.length - 1 && (
                                <div className={`w-0.5 h-7 mt-1 ${done ? "bg-brand-500" : "bg-surface-100 dark:bg-surface-800"}`} />
                            )}
                        </div>
                        <div className="pt-1.5 pb-6">
                            <p className={`text-sm font-semibold ${active || done ? "text-surface-900 dark:text-white" : "text-surface-400 dark:text-surface-600"}`}>
                                {step.label}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">{step.desc}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── ETA banner ────────────────────────────────────────────────────────────────
function EtaBanner({
    status,
    createdAt,
    preparationTimeMinutes,
    scheduledFor,
}: {
    status: string;
    createdAt: string;
    preparationTimeMinutes: number | null;
    scheduledFor: string | null;
}) {
    if (["delivered", "cancelled"].includes(status)) return null;

    // For scheduled orders, show the scheduled time
    if (scheduledFor) {
        const scheduledDate = new Date(scheduledFor);
        const scheduledLabel = scheduledDate.toLocaleString("fr-FR", {
            weekday: "short", day: "numeric", month: "short",
            hour: "2-digit", minute: "2-digit",
        });
        const remaining = Math.max(0, Math.round((scheduledDate.getTime() - Date.now()) / 60_000));

        return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <Clock size={18} className="text-blue-500 shrink-0" />
                <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                        Commande programmée pour {scheduledLabel}
                    </p>
                    {remaining > 0 && (
                        <p className="text-xs text-blue-600/70 dark:text-blue-400">
                            Dans environ {remaining > 60 ? `${Math.floor(remaining / 60)}h${remaining % 60 > 0 ? ` ${remaining % 60}min` : ""}` : `${remaining} min`}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const created   = new Date(createdAt).getTime();
    const etaMs     = (preparationTimeMinutes ?? 40) * 60 * 1000;
    const etaDate   = new Date(created + etaMs);
    const etaLabel  = etaDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const remaining = Math.max(0, Math.round((etaDate.getTime() - Date.now()) / 60_000));

    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
            <Clock size={18} className="text-brand-500 shrink-0" />
            <div>
                <p className="font-semibold text-brand-700 dark:text-brand-300 text-sm">
                    Livraison estimée à {etaLabel}
                </p>
                {remaining > 0 && (
                    <p className="text-xs text-brand-600/70 dark:text-brand-400">
                        Environ {remaining} min restantes
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function OrderTrackingClient() {
    const { id } = useParams<{ id: string }>();
    const updateOrderStatus = useRecentOrders((s) => s.updateOrderStatus);

    const [order,   setOrder]   = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        try {
            const res = await fetch(`/api/store/orders/${id}`);
            if (!res.ok) {
                if (res.status === 404) { setError("Commande introuvable"); return; }
                setError("Erreur de chargement");
                return;
            }
            const data = await res.json();
            const fetched: OrderDetail = data.order;
            setOrder(fetched);
            // Sync the local store
            updateOrderStatus(fetched.id, fetched.status as Parameters<typeof updateOrderStatus>[1]);
        } catch {
            setError("Impossible de charger la commande");
        } finally {
            setLoading(false);
        }
    }, [id, updateOrderStatus]);

    // Initial fetch + polling every 20s if still active
    useEffect(() => {
        void fetchOrder();
        const timer = setInterval(() => {
            if (order && !["delivered", "cancelled"].includes(order.status)) {
                void fetchOrder();
            }
        }, 20_000);
        return () => clearInterval(timer);
    }, [fetchOrder, order]);

    const shortRef  = id ? `#KB-${id.slice(-6).toUpperCase()}` : "…";
    const isActive  = order && !["delivered", "cancelled"].includes(order.status);

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/stores/orders"
                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="font-bold text-surface-900 dark:text-white leading-tight">
                                Suivi commande
                            </h1>
                            {order && (
                                <p className="text-xs text-surface-500 dark:text-surface-400 leading-tight">
                                    {shortRef}
                                </p>
                            )}
                        </div>
                    </div>
                    {isActive && (
                        <button
                            onClick={() => void fetchOrder()}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium flex items-center gap-1"
                        >
                            <Loader2 size={12} />
                            Actualiser
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20">
                        <ChefHat size={48} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                        <p className="text-xl font-bold text-surface-900 dark:text-white mb-2">{error}</p>
                        <Link href="/stores/orders" className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
                            Voir mes commandes
                        </Link>
                    </div>
                )}

                {order && !loading && (
                    <>
                        {/* ETA */}
                        <EtaBanner
                            status={order.status}
                            createdAt={order.created_at}
                            preparationTimeMinutes={order.preparation_time_minutes}
                            scheduledFor={order.scheduled_for}
                        />

                        {/* Proof of delivery */}
                        {order.status === "delivered" && order.delivered_at && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-green-700 dark:text-green-300 text-sm">
                                        Commande livrée
                                    </p>
                                    <p className="text-xs text-green-600/70 dark:text-green-400">
                                        {new Date(order.delivered_at).toLocaleString("fr-FR", {
                                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                    {order.delivery_note && (
                                        <p className="text-xs text-green-600 dark:text-green-400 italic">
                                            « {order.delivery_note} »
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-4">Statut de la commande</h2>
                            <Timeline status={order.status} />
                        </section>

                        {/* Order items */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                <ChefHat size={16} className="text-brand-500" />
                                Articles commandés
                            </h2>
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                <div className="space-y-2">
                                    {order.items.map((item, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-surface-700 dark:text-surface-300">
                                                {item.quantity}× {item.name}
                                            </span>
                                            <span className="font-medium text-surface-900 dark:text-white">
                                                {formatCFA(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-surface-500 dark:text-surface-400">Détails indisponibles</p>
                            )}
                        </section>

                        {/* Delivery info */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-3">Informations</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                    {DELIVERY_TYPE_ICONS[order.delivery_type] ?? <Package size={16} />}
                                    <span>{DELIVERY_TYPE_LABELS[order.delivery_type] ?? order.delivery_type}</span>
                                </div>
                                {order.delivery_address && (
                                    <div className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                                        <MapPin size={16} className="shrink-0 mt-0.5" />
                                        <span>{order.delivery_address}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-surface-100 dark:border-surface-800 space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-surface-500 dark:text-surface-400">Sous-total</span>
                                        <span className="font-medium text-surface-900 dark:text-white">{formatCFA(order.subtotal)}</span>
                                    </div>
                                    {order.delivery_fee > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-surface-500 dark:text-surface-400">Livraison</span>
                                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(order.delivery_fee)}</span>
                                        </div>
                                    )}
                                    {order.service_fee > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-surface-500 dark:text-surface-400">Service</span>
                                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(order.service_fee)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-surface-100 dark:border-surface-800">
                                        <span className="font-bold text-surface-900 dark:text-white">Total</span>
                                        <span className="font-extrabold text-surface-900 dark:text-white">{formatCFA(order.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CTAs */}
                        <div className="space-y-2">
                            {order.status === "delivered" && (
                                <Link
                                    href="/stores"
                                    className="w-full flex items-center justify-center gap-2 h-12 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl transition-colors"
                                >
                                    <RotateCcw size={16} />
                                    Commander à nouveau
                                </Link>
                            )}
                            <Link
                                href="/stores/support"
                                className="w-full flex items-center justify-center gap-2 h-12 bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium text-sm rounded-2xl border border-surface-200 dark:border-surface-700 transition-colors"
                            >
                                Un problème ? Contacter le support
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
