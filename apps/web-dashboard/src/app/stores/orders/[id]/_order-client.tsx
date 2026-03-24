"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    ChefHat,
    Clock,
    CreditCard,
    KeyRound,
    Loader2,
    MapPin,
    Package,
    Phone,
    RotateCcw,
    Star,
    Smartphone,
    Store,
    Truck,
    Utensils,
    X,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useRecentOrders } from "@/store/client-store";
import dynamic from "next/dynamic";

const OrderTrackingMap = dynamic(
    () => import("@/components/store/OrderTrackingMap").then((m) => m.OrderTrackingMap),
    { ssr: false }
);
const ClientOrderChat = dynamic(
    () => import("@/components/store/ClientOrderChat").then((m) => m.ClientOrderChat),
    { ssr: false }
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderDetail {
    id: string;
    status: string;
    payment_status: string;
    payment_method: string | null;
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
    delivery_code: string | null;
    notes: string | null;
    table_number: string | null;
    restaurants: { id: string; name: string; slug: string } | null;
}

// ── Status config (varies by delivery type) ──────────────────────────────────
type StatusStep = { id: string; label: string; desc: string };

const DELIVERY_STEPS: StatusStep[] = [
    { id: "pending",    label: "Commande reçue",       desc: "Votre commande a été enregistrée" },
    { id: "accepted",   label: "Confirmée",             desc: "Le restaurant a confirmé votre commande" },
    { id: "preparing",  label: "En préparation",        desc: "Le restaurant prépare vos plats" },
    { id: "ready",      label: "Prête",                 desc: "Votre commande est prête" },
    { id: "delivering", label: "En cours de livraison", desc: "Un livreur est en route" },
    { id: "delivered",  label: "Livrée",                desc: "Commande remise avec succès" },
];

const PICKUP_STEPS: StatusStep[] = [
    { id: "pending",   label: "Commande reçue",  desc: "Votre commande a été enregistrée" },
    { id: "accepted",  label: "Confirmée",        desc: "Le restaurant a confirmé votre commande" },
    { id: "preparing", label: "En préparation",   desc: "Le restaurant prépare vos plats" },
    { id: "ready",     label: "Prête à retirer",  desc: "Vous pouvez venir récupérer votre commande" },
    { id: "delivered", label: "Récupérée",        desc: "Commande récupérée avec succès" },
];

const DINE_IN_STEPS: StatusStep[] = [
    { id: "pending",   label: "Commande reçue",  desc: "Votre commande a été enregistrée" },
    { id: "accepted",  label: "Confirmée",        desc: "Le restaurant a confirmé votre commande" },
    { id: "preparing", label: "En préparation",   desc: "La cuisine prépare vos plats" },
    { id: "ready",     label: "Prête",            desc: "Votre commande est prête" },
    { id: "delivered", label: "Servie",           desc: "Vos plats ont été servis à votre table" },
];

function getStepsForDeliveryType(deliveryType: string): StatusStep[] {
    if (deliveryType === "pickup") return PICKUP_STEPS;
    if (deliveryType === "dine_in") return DINE_IN_STEPS;
    return DELIVERY_STEPS;
}

const CANCELLED_STEP = { id: "cancelled", label: "Annulée", desc: "Cette commande a été annulée" };

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
function Timeline({ status, deliveryType }: { status: string; deliveryType: string }) {
    const steps = getStepsForDeliveryType(deliveryType);
    const statusOrder = steps.map((s) => s.id);
    const isCancelled = status === "cancelled";
    const currentIdx  = statusOrder.indexOf(status);

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
            {steps.map((step, idx) => {
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
                            {idx < steps.length - 1 && (
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
                    Prête vers {etaLabel}
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
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

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

    const handleSubmitReview = useCallback(async () => {
        if (!order || !order.restaurants?.id || reviewSubmitting) return;
        setReviewError(null);
        setReviewSubmitting(true);

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    restaurantId: order.restaurants.id,
                    rating: reviewRating,
                    comment: reviewComment.trim() || undefined,
                }),
            });

            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                setReviewError(payload?.error ?? "Erreur lors de l'envoi de l'avis.");
                return;
            }

            setReviewSubmitted(true);
            setReviewComment("");
        } catch {
            setReviewError("Erreur lors de l'envoi de l'avis.");
        } finally {
            setReviewSubmitting(false);
        }
    }, [order, reviewComment, reviewRating, reviewSubmitting]);

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
                                {order?.restaurants?.name ?? "Suivi commande"}
                            </h1>
                            <p className="text-xs text-surface-500 dark:text-surface-400 leading-tight">
                                {shortRef}
                            </p>
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

                        {/* Delivery confirmation code — affiché dès que le livreur est assigné */}
                        {order.delivery_type === "delivery" &&
                            order.delivery_code &&
                            !["delivered", "cancelled"].includes(order.status) && (
                            <div className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/40 px-5 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <KeyRound size={16} className="text-orange-500 shrink-0" />
                                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                        Code de confirmation de livraison
                                    </p>
                                </div>
                                <p className="text-4xl font-mono font-black tracking-[0.45em] text-orange-600 dark:text-orange-400 text-center py-2">
                                    {order.delivery_code}
                                </p>
                                <p className="text-xs text-orange-600/80 dark:text-orange-400/70 text-center leading-relaxed mt-1">
                                    Communiquez ce code au livreur lors de la remise de votre commande.<br />
                                    Il est nécessaire pour finaliser la livraison.
                                </p>
                            </div>
                        )}

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
                            <Timeline status={order.status} deliveryType={order.delivery_type} />
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
                            <h2 className="font-bold text-surface-900 dark:text-white mb-4">Informations</h2>
                            <div className="space-y-3 text-sm">
                                {/* Restaurant */}
                                {order.restaurants && (
                                    <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                        <Store size={16} className="shrink-0" />
                                        <span>{order.restaurants.name}</span>
                                    </div>
                                )}

                                {/* Delivery type */}
                                <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                    {DELIVERY_TYPE_ICONS[order.delivery_type] ?? <Package size={16} />}
                                    <span>{DELIVERY_TYPE_LABELS[order.delivery_type] ?? order.delivery_type}</span>
                                </div>

                                {/* Delivery address */}
                                {order.delivery_address && (
                                    <div className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                                        <MapPin size={16} className="shrink-0 mt-0.5" />
                                        <span>{order.delivery_address}</span>
                                    </div>
                                )}

                                {/* Table number (dine-in) */}
                                {order.table_number && (
                                    <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                        <Utensils size={16} className="shrink-0" />
                                        <span>Table {order.table_number}</span>
                                    </div>
                                )}

                                {/* Customer */}
                                <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                    <Phone size={16} className="shrink-0" />
                                    <span>{order.customer_name} · {order.customer_phone}</span>
                                </div>

                                {/* Payment method */}
                                <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
                                    {order.payment_method === "cash" ? (
                                        <CreditCard size={16} className="shrink-0" />
                                    ) : (
                                        <Smartphone size={16} className="shrink-0" />
                                    )}
                                    <span>
                                        {order.payment_method === "cash" ? "Espèces" :
                                         order.payment_method === "mobile_money_mtn" ? "MTN Mobile Money" :
                                         order.payment_method === "mobile_money_orange" ? "Orange Money" :
                                         order.payment_method ?? "—"}
                                    </span>
                                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        order.payment_status === "paid"
                                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                    }`}>
                                        {order.payment_status === "paid" ? "Payé" : "En attente"}
                                    </span>
                                </div>

                                {/* Notes */}
                                {order.notes && (
                                    <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg text-xs text-surface-600 dark:text-surface-400 italic">
                                        « {order.notes} »
                                    </div>
                                )}

                                {/* Totals */}
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

                                {/* Date */}
                                <p className="text-xs text-surface-400 dark:text-surface-500 pt-1">
                                    Commandé le {new Date(order.created_at).toLocaleString("fr-FR", {
                                        day: "numeric", month: "long", year: "numeric",
                                        hour: "2-digit", minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </section>

                        {/* Real-time delivery tracking map (client view) */}
                        {order.delivery_type === "delivery" && (
                            <OrderTrackingMap
                                orderId={order.id}
                                orderStatus={order.status}
                            />
                        )}

                        {/* Chat with restaurant */}
                        <ClientOrderChat
                            orderId={order.id}
                            restaurantName={order.restaurants?.name ?? "Restaurant"}
                        />

                        {/* Review */}
                        {["delivered", "completed"].includes(order.status) && order.restaurants?.id && (
                            <section id="review" className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Star size={16} className="text-amber-500" />
                                    Donner votre avis
                                </h2>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                                    Évaluez votre expérience chez {order.restaurants.name}.
                                </p>

                                {reviewSubmitted ? (
                                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-sm text-green-700 dark:text-green-300 font-medium">
                                        Merci ! Votre avis a bien été envoyé.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setReviewRating(value)}
                                                    className="p-1"
                                                    aria-label={`Noter ${value} sur 5`}
                                                >
                                                    <Star
                                                        size={20}
                                                        className={value <= reviewRating ? "text-amber-500 fill-amber-500" : "text-surface-300 dark:text-surface-700"}
                                                    />
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Partagez votre expérience (optionnel)"
                                            className="w-full min-h-[90px] rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                        />

                                        {reviewError && (
                                            <p className="text-sm text-red-500">{reviewError}</p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => void handleSubmitReview()}
                                            disabled={reviewSubmitting}
                                            className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {reviewSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                                            {reviewSubmitting ? "Envoi..." : "Envoyer mon avis"}
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* CTAs */}
                        <div className="space-y-2">
                            {order.restaurants?.slug && (
                                <Link
                                    href={`/r/${order.restaurants.slug}`}
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
