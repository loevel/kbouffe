"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    ChefHat,
    CreditCard,
    Smartphone,
    Loader2,
    CheckCircle2,
    MapPin,
    Package,
    Utensils,
    KeyRound,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCFA } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

type DeliveryType = "delivery" | "pickup" | "dine_in";
type PaymentMethod = "cash" | "mobile_money_mtn" | "mobile_money_orange";

const DELIVERY_OPTIONS: { id: DeliveryType; label: string; icon: React.ReactNode; fee: number }[] = [
    { id: "delivery", label: "Livraison",      icon: <MapPin   size={16} />, fee: 1000 },
    { id: "pickup",   label: "À emporter",     icon: <Package  size={16} />, fee: 0    },
    { id: "dine_in",  label: "Sur place",      icon: <Utensils size={16} />, fee: 0    },
];

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: "cash",                label: "Cash",          icon: <CreditCard  size={16} /> },
    { id: "mobile_money_mtn",    label: "MTN Money",     icon: <Smartphone  size={16} /> },
    { id: "mobile_money_orange", label: "Orange Money",  icon: <Smartphone  size={16} /> },
];

// ── CartDrawer ───────────────────────────────────────────────────────────────

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
    const { restaurant, items, itemCount, subtotal, updateQty, removeItem, clear } = useCart();

    // Checkout step: "cart" | "checkout" | "success"
    const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");

    // Checkout form state
    const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [deliveryCode, setDeliveryCode] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [paymentReferenceId, setPaymentReferenceId] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed" | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // ── Responsive: detect desktop to switch between bottom-sheet (mobile) and
    //    side-drawer (lg+) animations without duplicating JSX. ──────────────────
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        const supabase = createClient();
        if (!supabase) return;
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    }, []);

    // Reset step when drawer closes
    const prevOpen = useRef(open);
    useEffect(() => {
        if (!open && prevOpen.current) {
            setTimeout(() => setStep("cart"), 300);
        }
        prevOpen.current = open;
    }, [open]);

    const deliveryFee = DELIVERY_OPTIONS.find((o) => o.id === deliveryType)?.fee ?? 0;
    const total = subtotal + deliveryFee;

    const handleSubmitOrder = async () => {
        setError(null);
        if (!customerName.trim()) { setError("Votre nom est requis."); return; }
        if (!customerPhone.trim()) { setError("Votre numéro de téléphone est requis."); return; }
        if (deliveryType === "delivery" && !deliveryAddress.trim()) {
            setError("L'adresse de livraison est requise."); return;
        }

        setSubmitting(true);
        setPaymentReferenceId(null);
        setPaymentStatus(null);
        setPaymentError(null);
        try {
            const res = await fetch("/api/store/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurantId: restaurant!.id,
                    items: items.map((i) => ({
                        productId: i.id,
                        productName: i.name,
                        name: i.name,
                        unitPrice: i.price,
                        price: i.price,
                        quantity: i.quantity,
                    })),
                    deliveryType,
                    deliveryAddress: deliveryType === "delivery" ? deliveryAddress : undefined,
                    tableNumber: deliveryType === "dine_in" ? tableNumber : undefined,
                    customerName,
                    customerPhone,
                    paymentMethod,
                    subtotal,
                    deliveryFee,
                    total,
                    customerId: userId ?? undefined,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Erreur inconnue");

            const createdOrderId = json.orderId as string;
            setOrderId(createdOrderId);
            setDeliveryCode((json.deliveryCode as string | null) ?? null);

            if (paymentMethod === "mobile_money_mtn") {
                const paymentRes = await fetch("/api/store/payment/mtn/request-to-pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: createdOrderId,
                        payerMsisdn: customerPhone,
                        payerMessage: "Paiement commande Kbouffe",
                        payeeNote: `Commande ${createdOrderId}`,
                    }),
                });

                const paymentJson = await paymentRes.json().catch(() => ({}));
                const referenceId = paymentJson?.payment?.referenceId as string | undefined;

                if (!paymentRes.ok) {
                    setPaymentStatus("failed");
                    setPaymentError(paymentJson?.error ?? "Paiement MTN non initié.");
                } else {
                    setPaymentStatus("pending");
                    if (referenceId) setPaymentReferenceId(referenceId);

                    if (referenceId) {
                        for (let i = 0; i < 6; i += 1) {
                            await new Promise((resolve) => setTimeout(resolve, 4000));
                            const statusRes = await fetch(`/api/store/payment/mtn/status/${referenceId}`);
                            const statusJson = await statusRes.json().catch(() => ({}));
                            if (!statusRes.ok) break;

                            const status = statusJson?.payment?.status as "pending" | "paid" | "failed" | undefined;
                            if (!status) continue;
                            setPaymentStatus(status);
                            if (status === "paid" || status === "failed") break;
                        }
                    }
                }
            }

            clear();
            setStep("success");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Erreur lors de la commande. Réessayez.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Drawer — right-side panel on lg+, bottom sheet that slides up on < lg */}
            <motion.aside
                initial={false}
                animate={
                    open
                        ? { y: 0, x: 0 }
                        : isDesktop
                        ? { y: 0, x: "100%" }
                        : { y: "100%", x: 0 }
                }
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed z-50 flex flex-col bg-white dark:bg-surface-900 shadow-2xl
                    inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh]
                    lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:rounded-none lg:w-full lg:max-w-md lg:max-h-full"
                aria-label="Panier"
                aria-modal="true"
                role="dialog"
            >
                {/* Drag handle pill — bottom sheet affordance, hidden on desktop */}
                <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden" aria-hidden="true">
                    <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full" />
                </div>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-2">
                        {step === "cart" ? (
                            <>
                                <ShoppingBag size={20} className="text-brand-500" />
                                <h2 className="font-bold text-surface-900 dark:text-white">
                                    Mon panier
                                    {itemCount > 0 && (
                                        <span className="ml-2 text-sm font-normal text-surface-500">
                                            ({itemCount} article{itemCount > 1 ? "s" : ""})
                                        </span>
                                    )}
                                </h2>
                            </>
                        ) : step === "checkout" ? (
                            <h2 className="font-bold text-surface-900 dark:text-white">Finaliser la commande</h2>
                        ) : (
                            <h2 className="font-bold text-surface-900 dark:text-white">Commande confirmée !</h2>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        aria-label="Fermer le panier"
                    >
                        <X size={20} className="text-surface-500" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* Step: cart */}
                    {step === "cart" && (
                        <>
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
                                    <ChefHat size={48} className="text-surface-200 dark:text-surface-700" />
                                    <p className="text-surface-500 dark:text-surface-400">
                                        Votre panier est vide.
                                        <br />Ajoutez des plats pour commencer !
                                    </p>
                                </div>
                            ) : (
                                <div className="px-5 py-4 space-y-3">
                                    {restaurant && (
                                        <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">
                                            Commande chez <span className="font-medium text-brand-500">{restaurant.name}</span>
                                        </p>
                                    )}
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-3 items-start bg-surface-50 dark:bg-surface-800 rounded-xl p-3"
                                        >
                                            {/* Image */}
                                            {item.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center shrink-0">
                                                    <ChefHat size={20} className="text-surface-400" />
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-surface-900 dark:text-white line-clamp-1">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-brand-500 font-semibold mt-0.5">
                                                    {formatCFA(item.price)}
                                                </p>
                                                {/* Qty controls */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => updateQty(item.id, item.quantity - 1)}
                                                        className="w-7 h-7 rounded-full border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                                        aria-label="Diminuer la quantité"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-sm font-semibold text-surface-900 dark:text-white w-4 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQty(item.id, item.quantity + 1)}
                                                        className="w-7 h-7 rounded-full border border-surface-200 dark:border-surface-600 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                                        aria-label="Augmenter la quantité"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Line total + delete */}
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <span className="text-sm font-bold text-surface-900 dark:text-white">
                                                    {formatCFA(item.price * item.quantity)}
                                                </span>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-surface-400 hover:text-red-500 transition-colors p-1"
                                                    aria-label={`Supprimer ${item.name}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Step: checkout */}
                    {step === "checkout" && (
                        <div className="px-5 py-4 space-y-5">
                            {/* Delivery type */}
                            <div>
                                <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
                                    Mode de réception
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {DELIVERY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setDeliveryType(opt.id)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                                                deliveryType === opt.id
                                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                                    : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300"
                                            }`}
                                            aria-pressed={deliveryType === opt.id}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                            {opt.fee > 0 && (
                                                <span className="text-surface-400 font-normal">+{formatCFA(opt.fee)}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer info */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                                    Vos informations
                                </p>
                                <input
                                    type="text"
                                    placeholder="Nom complet *"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                                />
                                <input
                                    type="tel"
                                    placeholder="Téléphone * (ex: 690 000 000)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                                />
                                {deliveryType === "delivery" && (
                                    <input
                                        type="text"
                                        placeholder="Adresse de livraison *"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                                    />
                                )}
                                {deliveryType === "dine_in" && (
                                    <input
                                        type="text"
                                        placeholder="Numéro de table (optionnel)"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:border-brand-500"
                                    />
                                )}
                            </div>

                            {/* Payment method */}
                            <div>
                                <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
                                    Paiement
                                </p>
                                <div className="space-y-2">
                                    {PAYMENT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setPaymentMethod(opt.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                                                paymentMethod === opt.id
                                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                                    : "border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-brand-300"
                                            }`}
                                            aria-pressed={paymentMethod === opt.id}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Order summary */}
                            <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4 space-y-2 text-sm">
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Sous-total</span>
                                    <span>{formatCFA(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Livraison</span>
                                    <span>{deliveryFee === 0 ? "Gratuit" : formatCFA(deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-surface-900 dark:text-white pt-2 border-t border-surface-200 dark:border-surface-700">
                                    <span>Total</span>
                                    <span className="text-brand-500">{formatCFA(total)}</span>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step: success */}
                    {step === "success" && (
                        <div className="flex flex-col items-center justify-center h-80 gap-4 text-center px-8">
                            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 size={36} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                                    Commande reçue !
                                </h3>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                                    Votre commande a été transmise au restaurant.
                                    Vous serez contacté dès confirmation.
                                </p>
                                {paymentMethod === "mobile_money_mtn" && (
                                    <p className="text-xs mt-2 text-surface-500 dark:text-surface-400">
                                        {paymentStatus === "paid"
                                            ? "Paiement MTN confirmé. Merci !"
                                            : paymentStatus === "failed"
                                            ? `Paiement MTN échoué${paymentError ? `: ${paymentError}` : "."}`
                                            : "Paiement MTN initié. Validez sur votre téléphone."}
                                    </p>
                                )}
                                {paymentReferenceId && (
                                    <p className="text-[11px] text-surface-400 mt-1">
                                        Réf paiement : {paymentReferenceId.slice(0, 8).toUpperCase()}
                                    </p>
                                )}
                                {deliveryCode && (
                                    <div className="mt-4 rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 px-5 py-4">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <KeyRound size={15} className="text-orange-500" />
                                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                                                Code de livraison
                                            </p>
                                        </div>
                                        <p className="text-3xl font-mono font-black tracking-[0.4em] text-orange-600 dark:text-orange-400 text-center mt-1">
                                            {deliveryCode}
                                        </p>
                                        <p className="text-xs text-orange-500/80 dark:text-orange-400/70 text-center mt-2 leading-relaxed">
                                            Communiquez ce code au livreur<br />lors de la remise de votre commande.
                                        </p>
                                    </div>
                                )}
                                {orderId && (
                                    <p className="text-xs text-surface-400 mt-2 font-mono">
                                        Réf : #{orderId.slice(0, 8).toUpperCase()}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {step !== "success" && items.length > 0 && (
                    <div className="px-5 py-4 border-t border-surface-200 dark:border-surface-700">
                        {step === "cart" && (
                            <>
                                <div className="flex justify-between text-sm mb-3">
                                    <span className="text-surface-500 dark:text-surface-400">Sous-total</span>
                                    <span className="font-bold text-surface-900 dark:text-white">
                                        {formatCFA(subtotal)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setStep("checkout")}
                                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-xl transition-colors"
                                >
                                    Commander — {formatCFA(subtotal)}
                                </button>
                            </>
                        )}
                        {step === "checkout" && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setError(null); setStep("cart"); }}
                                    disabled={submitting}
                                    className="px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-medium text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> En cours…</>
                                    ) : (
                                        `Confirmer — ${formatCFA(total)}`
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === "success" && (
                    <div className="px-5 py-4 border-t border-surface-200 dark:border-surface-700">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                )}
            </motion.aside>
        </>
    );
}
