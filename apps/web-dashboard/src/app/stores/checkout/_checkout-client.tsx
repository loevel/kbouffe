"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChefHat,
    CreditCard,
    Loader2,
    MapPin,
    Package,
    ShoppingBag,
    Smartphone,
    Utensils,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useRecentOrders } from "@/store/client-store";

// ── Types ─────────────────────────────────────────────────────────────────────
type DeliveryType    = "delivery" | "pickup" | "dine_in";
type PaymentMethod   = "cash" | "mobile_money_mtn" | "mobile_money_orange";

const SERVICE_FEE = 250;

const DELIVERY_FEES: Record<DeliveryType, number> = {
    delivery: 1000,
    pickup:   0,
    dine_in:  0,
};

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
    {
        id:    "cash",
        label: "Paiement en espèces",
        desc:  "Réglez à la livraison / au retrait",
        icon:  <CreditCard size={20} />,
    },
    {
        id:    "mobile_money_mtn",
        label: "MTN Mobile Money",
        desc:  "Paiement via MTN MoMo",
        icon:  <Smartphone size={20} className="text-yellow-500" />,
    },
    {
        id:    "mobile_money_orange",
        label: "Orange Money",
        desc:  "Paiement via Orange Money",
        icon:  <Smartphone size={20} className="text-orange-500" />,
    },
];

const DELIVERY_LABELS: Record<DeliveryType, string> = {
    delivery: "Livraison",
    pickup:   "À emporter",
    dine_in:  "Sur place",
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: "info" | "payment" | "review" }) {
    const steps: { id: "info" | "payment" | "review"; label: string }[] = [
        { id: "info",    label: "Coordonnées" },
        { id: "payment", label: "Paiement" },
        { id: "review",  label: "Confirmation" },
    ];
    const currentIdx = steps.findIndex((s) => s.id === step);

    return (
        <div className="flex items-center gap-0 mb-6">
            {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                        <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                idx < currentIdx
                                    ? "bg-brand-500 text-white"
                                    : idx === currentIdx
                                    ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                                    : "bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400"
                            }`}
                        >
                            {idx < currentIdx ? <CheckCircle2 size={14} /> : idx + 1}
                        </span>
                        <span className={`text-xs mt-1 font-medium ${idx === currentIdx ? "text-brand-600 dark:text-brand-400" : "text-surface-400"}`}>
                            {s.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 mx-2 transition-colors ${idx < currentIdx ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CheckoutPageClient() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const { restaurant, items, subtotal, clear } = useCart();
    const addOrder     = useRecentOrders((s) => s.addOrder);

    const deliveryType = (searchParams.get("deliveryType") as DeliveryType) ?? "delivery";
    const deliveryFee  = DELIVERY_FEES[deliveryType] ?? 0;
    const total        = subtotal + deliveryFee + SERVICE_FEE;

    // ── Form state ─────────────────────────────────────────────────────────
    const [step, setStep]                     = useState<"info" | "payment" | "review">("info");
    const [customerName, setCustomerName]     = useState("");
    const [customerPhone, setCustomerPhone]   = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [tableNumber, setTableNumber]       = useState("");
    const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>("cash");
    const [submitting, setSubmitting]         = useState(false);
    const [error, setError]                   = useState<string | null>(null);

    // ── Empty cart guard ───────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col items-center justify-center px-4 gap-4">
                <ShoppingBag size={56} className="text-surface-200 dark:text-surface-700" />
                <p className="text-xl font-bold text-surface-900 dark:text-white">Panier vide</p>
                <p className="text-surface-500 dark:text-surface-400 text-sm">Ajoutez des articles avant de passer commande.</p>
                <Link href="/stores" className="mt-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl transition-colors">
                    Découvrir les restaurants
                </Link>
            </div>
        );
    }

    // ── Step 1 validation ──────────────────────────────────────────────────
    const validateStep1 = () => {
        if (!customerName.trim()) { setError("Votre nom est requis."); return false; }
        if (!customerPhone.trim()) { setError("Votre téléphone est requis."); return false; }
        if (deliveryType === "delivery" && !deliveryAddress.trim()) {
            setError("L'adresse de livraison est requise.");
            return false;
        }
        setError(null);
        return true;
    };

    // ── Submit order ───────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!restaurant) { setError("Restaurant introuvable."); return; }
        setError(null);
        setSubmitting(true);
        try {
            const body = {
                restaurantId:    restaurant.id,
                items:           items.map((i) => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
                deliveryType,
                deliveryAddress: deliveryType === "delivery" ? deliveryAddress.trim() : undefined,
                tableNumber:     deliveryType === "dine_in"  ? tableNumber.trim() : undefined,
                customerName:    customerName.trim(),
                customerPhone:   customerPhone.trim(),
                paymentMethod,
                subtotal,
                deliveryFee,
                total,
            };
            const res = await fetch("/api/store/order", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Erreur lors de la commande.");
                return;
            }
            const orderId = data.order?.id ?? data.id ?? data.orderId;
            // Persister dans le store local pour le suivi
            if (orderId && restaurant) {
                addOrder({
                    id:             orderId,
                    restaurantId:   restaurant.id,
                    restaurantName: restaurant.name,
                    restaurantSlug: restaurant.slug,
                    total,
                    itemCount:      items.reduce((n, i) => n + i.quantity, 0),
                    status:         "pending",
                    deliveryType,
                    createdAt:      new Date().toISOString(),
                });
            }
            clear();
            router.push(`/stores/confirmation?orderId=${orderId}&restaurant=${encodeURIComponent(restaurant.name)}&total=${total}`);
        } catch {
            setError("Impossible de passer la commande. Vérifiez votre connexion.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* ── Header ───────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (step === "payment") setStep("info");
                            else if (step === "review") setStep("payment");
                            else router.back();
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="font-bold text-surface-900 dark:text-white">Finaliser la commande</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                <StepIndicator step={step} />

                {/* ── Error ────────────────────────────────────────────── */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* ── Step 1 : Customer info ────────────────────────────── */}
                {step === "info" && (
                    <div className="space-y-4">
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-4">Vos coordonnées</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                        Nom complet *
                                    </label>
                                    <input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Jean-Paul Mbida"
                                        className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                        Téléphone *
                                    </label>
                                    <input
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        type="tel"
                                        placeholder="6XX XXX XXX"
                                        className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Mode-specific fields */}
                        {deliveryType === "delivery" && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MapPin size={16} className="text-brand-500" /> Adresse de livraison
                                </h2>
                                <textarea
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    placeholder="Quartier, rue, point de repère…"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition resize-none"
                                />
                            </section>
                        )}

                        {deliveryType === "dine_in" && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Utensils size={16} className="text-brand-500" /> Numéro de table
                                </h2>
                                <input
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    placeholder="Ex: Table 5"
                                    className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                />
                            </section>
                        )}

                        {deliveryType === "pickup" && (
                            <section className="bg-brand-50 dark:bg-brand-500/10 rounded-2xl border border-brand-200 dark:border-brand-500/20 p-4 flex items-start gap-3">
                                <Package size={18} className="text-brand-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-brand-700 dark:text-brand-300">
                                    Vous récupérerez votre commande directement au restaurant.
                                </p>
                            </section>
                        )}

                        <button
                            onClick={() => { if (validateStep1()) setStep("payment"); }}
                            className="w-full h-13 py-3.5 flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            Continuer → Paiement
                        </button>
                    </div>
                )}

                {/* ── Step 2 : Payment ──────────────────────────────────── */}
                {step === "payment" && (
                    <div className="space-y-4">
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-4">Mode de paiement</h2>
                            <div className="space-y-2">
                                {PAYMENT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setPaymentMethod(opt.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                                            paymentMethod === opt.id
                                                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                                                : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                                        }`}
                                    >
                                        <span className={paymentMethod === opt.id ? "text-brand-500" : "text-surface-400"}>
                                            {opt.icon}
                                        </span>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm ${paymentMethod === opt.id ? "text-brand-700 dark:text-brand-300" : "text-surface-900 dark:text-white"}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-xs text-surface-500 dark:text-surface-400">{opt.desc}</p>
                                        </div>
                                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            paymentMethod === opt.id ? "border-brand-500" : "border-surface-300 dark:border-surface-600"
                                        }`}>
                                            {paymentMethod === opt.id && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <button
                            onClick={() => setStep("review")}
                            className="w-full h-13 py-3.5 flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            Continuer → Récapitulatif
                        </button>
                    </div>
                )}

                {/* ── Step 3 : Review & confirm ─────────────────────────── */}
                {step === "review" && (
                    <div className="space-y-4">
                        {/* Restaurant */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <ChefHat size={20} className="text-brand-500" />
                                <div>
                                    <p className="font-bold text-surface-900 dark:text-white">{restaurant?.name}</p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">{DELIVERY_LABELS[deliveryType]}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-surface-700 dark:text-surface-300">
                                            {item.quantity}× {item.name}
                                        </span>
                                        <span className="font-medium text-surface-900 dark:text-white">{formatCFA(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Order details */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 space-y-3">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-1">Détails de la commande</h2>
                            <Detail label="Nom" value={customerName} />
                            <Detail label="Téléphone" value={customerPhone} />
                            {deliveryType === "delivery" && <Detail label="Adresse" value={deliveryAddress} />}
                            {deliveryType === "dine_in" && tableNumber && <Detail label="Table" value={tableNumber} />}
                            <Detail label="Paiement" value={PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.label ?? paymentMethod} />
                        </section>

                        {/* Totals */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-3">Récapitulatif</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Sous-total</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{formatCFA(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Frais de livraison</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{deliveryFee === 0 ? "Gratuit" : formatCFA(deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Frais de service</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{formatCFA(SERVICE_FEE)}</span>
                                </div>
                                <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex justify-between">
                                    <span className="font-bold text-surface-900 dark:text-white text-base">Total</span>
                                    <span className="font-extrabold text-surface-900 dark:text-white text-base">{formatCFA(total)}</span>
                                </div>
                            </div>
                        </section>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold text-base rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Envoi en cours…</>
                            ) : (
                                <><CheckCircle2 size={18} /> Confirmer la commande • {formatCFA(total)}</>
                            )}
                        </button>

                        <p className="text-xs text-center text-surface-400 dark:text-surface-500">
                            En confirmant, vous acceptez les{" "}
                            <Link href="/terms" className="underline">Conditions d&apos;utilisation</Link>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm gap-4">
            <span className="text-surface-500 dark:text-surface-400 shrink-0">{label}</span>
            <span className="font-medium text-surface-900 dark:text-white text-right">{value}</span>
        </div>
    );
}
