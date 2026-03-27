"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Phone, Package, Loader2, CheckCircle2, PackageCheck, KeyRound, X } from "lucide-react";
import dynamic from "next/dynamic";

const DriverDeliveryTracker = dynamic(
    () => import("./DriverDeliveryTracker").then((m) => m.DriverDeliveryTracker),
    { ssr: false, loading: () => <div className="h-48 w-full rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" /> }
);

interface DriverOrder {
    id: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string | null;
    items: Array<{ name: string; quantity: number }>;
    total: number;
    delivery_fee: number;
    status: string;
    notes: string | null;
    created_at: string;
    restaurants: { name: string; address: string | null; phone: string | null } | null;
}

function formatPrice(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ready: { label: "Prête — à récupérer", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
    out_for_delivery: { label: "En livraison", color: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400" },
    delivering: { label: "En livraison", color: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400" },
};

// ── Modale de confirmation code ──────────────────────────────────────────────
function DeliveryCodeModal({ customerName, onConfirm, onCancel, loading, error }: {
    customerName: string;
    onConfirm: (code: string) => void;
    onCancel: () => void;
    loading: boolean;
    error: string | null;
}) {
    const [code, setCode] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (code.trim().length >= 4) onConfirm(code.trim());
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <KeyRound size={18} className="text-orange-500" />
                        </div>
                        <div>
                            <p className="font-bold text-surface-900 dark:text-white text-sm">Code de confirmation</p>
                            <p className="text-xs text-surface-500 mt-0.5">Demandez le code à {customerName}</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={16} className="text-surface-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
                    <input
                        ref={inputRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        maxLength={6}
                        placeholder="Ex : A3K7MX"
                        className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] uppercase border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 text-surface-900 dark:text-white placeholder:text-surface-300 dark:placeholder:text-surface-600 placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-colors"
                        autoComplete="off"
                        spellCheck={false}
                    />

                    {error && (
                        <p className="text-xs text-red-500 text-center font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.trim().length < 4}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/25 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={17} className="animate-spin" /> : "Confirmer la livraison"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Carte commande ────────────────────────────────────────────────────────────
function OrderCard({ order, onDelivered, onStatusChange }: {
    order: DriverOrder;
    onDelivered: (id: string) => void;
    onStatusChange: (id: string, newStatus: string) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);

    const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.out_for_delivery;
    const isReady = order.status === "ready";
    const canTrack = order.status === "out_for_delivery" || order.status === "delivering";

    async function handlePickup() {
        setLoading(true);
        try {
            const res = await fetch(`/api/driver/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pickup" }),
            });
            if (res.ok) {
                onStatusChange(order.id, "out_for_delivery");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelivered(code: string) {
        setLoading(true);
        setCodeError(null);
        try {
            const res = await fetch(`/api/driver/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "deliver", delivery_code: code }),
            });
            if (res.ok) {
                setShowCodeModal(false);
                setDone(true);
                setTimeout(() => onDelivered(order.id), 900);
            } else {
                const data = await res.json().catch(() => ({}));
                setCodeError(data.error ?? "Code incorrect");
            }
        } finally {
            setLoading(false);
        }
    }

    const itemsSummary = order.items.slice(0, 3).map((i) => `${i.quantity}× ${i.name}`).join(", ");
    const moreItems = order.items.length > 3 ? ` +${order.items.length - 3}` : "";

    return (
        <>
            {showCodeModal && (
                <DeliveryCodeModal
                    customerName={order.customer_name}
                    onConfirm={handleDelivered}
                    onCancel={() => { setShowCodeModal(false); setCodeError(null); }}
                    loading={loading}
                    error={codeError}
                />
            )}

            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
                {/* Restaurant header */}
                <div className="px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                            Retirer chez
                        </p>
                        <p className="font-bold text-surface-900 dark:text-white text-sm mt-0.5">
                            {order.restaurants?.name ?? "Restaurant"}
                        </p>
                        {order.restaurants?.address && (
                            <p className="text-xs text-surface-500 mt-0.5">{order.restaurants.address}</p>
                        )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                </div>

                <div className="p-4 space-y-3">
                    {/* Client */}
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                            <MapPin size={16} className="text-surface-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-surface-900 dark:text-white text-sm">
                                {order.customer_name}
                            </p>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5 leading-snug">
                                {order.delivery_address ?? "Adresse non renseignée"}
                            </p>
                        </div>
                        <a
                            href={`tel:${order.customer_phone}`}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-200 transition-colors"
                            title={`Appeler ${order.customer_name}`}
                        >
                            <Phone size={15} />
                        </a>
                    </div>

                    {/* Articles */}
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                            <Package size={16} className="text-surface-500" />
                        </div>
                        <p className="flex-1 text-sm text-surface-600 dark:text-surface-400 leading-snug pt-1">
                            {itemsSummary}{moreItems}
                        </p>
                        <p className="flex-shrink-0 text-sm font-bold text-surface-900 dark:text-white pt-1">
                            {formatPrice(order.total)}
                        </p>
                    </div>

                    {/* Note */}
                    {order.notes && (
                        <p className="text-xs text-surface-500 dark:text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-xl px-3 py-2 italic">
                            {order.notes}
                        </p>
                    )}

                    {/* Carte GPS — visible dès la prise en charge */}
                    {canTrack && (
                        <DriverDeliveryTracker
                            orderId={order.id}
                            deliveryAddress={order.delivery_address}
                            customerName={order.customer_name}
                            customerPhone={order.customer_phone}
                        />
                    )}

                    {/* Bouton d'action principal */}
                    <div className="pt-1">
                        {isReady ? (
                            <button
                                onClick={handlePickup}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/25 transition-all disabled:opacity-70"
                            >
                                {loading ? <Loader2 size={17} className="animate-spin" /> : <><PackageCheck size={17} />Récupérer la commande</>}
                            </button>
                        ) : done ? (
                            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-green-500 text-white">
                                <CheckCircle2 size={17} />
                                Livré !
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCodeModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/25 transition-all"
                            >
                                <KeyRound size={17} />
                                Confirmer la livraison
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export function DriverActiveOrders() {
    const [orders, setOrders] = useState<DriverOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch("/api/driver/orders");
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Impossible de charger les livraisons.");
                return;
            }
            const data = await res.json();
            setOrders(data.orders ?? []);
        } catch {
            setError("Erreur de connexion.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30_000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    function removeOrder(id: string) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
    }

    function updateOrderStatus(id: string, newStatus: string) {
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-orange-500" />
                <p className="text-sm text-surface-500">Chargement des livraisons…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <Package size={28} className="text-red-400" />
                </div>
                <div>
                    <p className="font-semibold text-surface-700 dark:text-surface-300">Erreur</p>
                    <p className="text-sm text-surface-500 mt-1">{error}</p>
                </div>
                <button
                    onClick={fetchOrders}
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
                    <Package size={28} className="text-surface-400" />
                </div>
                <div>
                    <p className="font-semibold text-surface-700 dark:text-surface-300">Aucune livraison en cours</p>
                    <p className="text-sm text-surface-500 mt-1">Les nouvelles livraisons apparaîtront ici.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide">
                    En cours · {orders.length}
                </h2>
                <button onClick={fetchOrders} className="text-xs text-orange-500 font-medium hover:text-orange-600">
                    Actualiser
                </button>
            </div>

            {orders.map((order) => (
                <OrderCard key={order.id} order={order} onDelivered={removeOrder} onStatusChange={updateOrderStatus} />
            ))}
        </div>
    );
}
