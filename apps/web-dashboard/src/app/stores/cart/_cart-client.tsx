"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    ChefHat,
    Minus,
    Package,
    Plus,
    ShoppingBag,
    Tag,
    Trash2,
    Utensils,
    MapPin,
    AlertCircle,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCFA } from "@kbouffe/module-core/ui";
import { UpsellModal } from "@/components/store/UpsellModal";

// ── Types ─────────────────────────────────────────────────────────────────────
type DeliveryType = "delivery" | "pickup" | "dine_in";

const DELIVERY_OPTIONS: { id: DeliveryType; label: string; desc: string; icon: React.ReactNode; fee: number }[] = [
    { id: "delivery", label: "Livraison",   desc: "Livraison à domicile",  icon: <MapPin   size={18} />, fee: 1000 },
    { id: "pickup",   label: "À emporter",  desc: "Récupérer au restaurant", icon: <Package  size={18} />, fee: 0    },
    { id: "dine_in",  label: "Sur place",   desc: "Manger dans le restaurant", icon: <Utensils size={18} />, fee: 0 },
];

const SERVICE_FEE = 250; // FCFA fixe

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartItemRow({
    item,
    onQtyChange,
    onRemove,
}: {
    item: { id: string; cartKey: string; name: string; price: number; quantity: number; imageUrl: string | null; selectedOptions?: Array<{ name: string; choice: string; extra_price: number }>; notes?: string };
    onQtyChange: (qty: number) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-4 py-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
            {/* Image */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0">
                {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ChefHat size={20} className="text-surface-300" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">{item.name}</p>
                {/* Selected options pills */}
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedOptions.map((opt) => (
                            <span key={opt.name} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[11px] font-semibold">
                                {opt.choice}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                    {formatCFA(item.price)}
                </p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-1 shrink-0">
                {item.quantity === 1 ? (
                    <button
                        onClick={onRemove}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        aria-label="Supprimer"
                    >
                        <Trash2 size={15} />
                    </button>
                ) : (
                    <button
                        onClick={() => onQtyChange(item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                        aria-label="Diminuer"
                    >
                        <Minus size={14} />
                    </button>
                )}
                <span className="w-7 text-center font-bold text-sm text-surface-900 dark:text-white">
                    {item.quantity}
                </span>
                <button
                    onClick={() => onQtyChange(item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                    aria-label="Augmenter"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Line total */}
            <p className="w-20 text-right font-bold text-sm text-surface-900 dark:text-white shrink-0">
                {formatCFA(item.price * item.quantity)}
            </p>
        </div>
    );
}

// ── Empty cart ────────────────────────────────────────────────────────────────
function EmptyCart() {
    return (
        <div className="text-center py-24 px-4">
            <ShoppingBag size={64} className="mx-auto text-surface-200 dark:text-surface-700 mb-5" />
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                Votre panier est vide
            </h2>
            <p className="text-surface-500 dark:text-surface-400 mb-8 max-w-sm mx-auto">
                Parcourez nos restaurants et ajoutez vos plats préférés.
            </p>
            <Link
                href="/stores"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl transition-colors"
            >
                <ChefHat size={18} />
                Explorer les restaurants
            </Link>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CartPageClient() {
    const router = useRouter();
    const { restaurant, items, subtotal, updateQty, removeItem, clear } = useCart();

    const [deliveryType, setDeliveryType]     = useState<DeliveryType>("delivery");
    const [promoCode, setPromoCode]           = useState("");
    const [promoDiscount, setPromoDiscount]   = useState(0);
    const [promoError, setPromoError]         = useState<string | null>(null);
    const [promoLoading, setPromoLoading]     = useState(false);
    const [showUpsell, setShowUpsell]         = useState(false);

    const deliveryFee = DELIVERY_OPTIONS.find((o) => o.id === deliveryType)?.fee ?? 0;
    const total       = subtotal + deliveryFee + SERVICE_FEE - promoDiscount;

    // ── Promo code validation ─────────────────────────────────────────────
    const validatePromo = async () => {
        if (!promoCode.trim()) return;
        setPromoError(null);
        setPromoLoading(true);
        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode.trim(), subtotal }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPromoError(data.error ?? "Code invalide");
                setPromoDiscount(0);
            } else {
                setPromoDiscount(data.discount ?? 0);
            }
        } catch {
            setPromoError("Impossible de valider le code");
        } finally {
            setPromoLoading(false);
        }
    };

    const handleCheckout = () => {
        // Show upsell modal before proceeding to checkout
        setShowUpsell(true);
    };

    const handleProceedToCheckout = () => {
        setShowUpsell(false);
        router.push(`/stores/checkout?deliveryType=${deliveryType}`);
    };

    if (items.length === 0) return (
        <div className="min-h-screen bg-white dark:bg-surface-950">
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <Link href="/stores" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="font-bold text-surface-900 dark:text-white">Panier</h1>
                </div>
            </header>
            <EmptyCart />
        </div>
    );

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* ── Header ───────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={restaurant ? `/r/${restaurant.slug}` : "/stores"}
                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="font-bold text-surface-900 dark:text-white leading-tight">Mon panier</h1>
                            {restaurant && (
                                <p className="text-xs text-surface-500 dark:text-surface-400 leading-tight">{restaurant.name}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={clear}
                        className="text-xs text-surface-400 hover:text-red-500 transition-colors"
                    >
                        Vider le panier
                    </button>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                {/* ── Items ────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 px-5">
                    {items.map((item) => (
                        <CartItemRow
                            key={item.cartKey}
                            item={item}
                            onQtyChange={(qty) => updateQty(item.cartKey, qty)}
                            onRemove={() => removeItem(item.cartKey)}
                        />
                    ))}
                    {restaurant && (
                        <div className="py-4 border-t border-surface-100 dark:border-surface-800">
                            <Link
                                href={`/r/${restaurant.slug}`}
                                className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                            >
                                + Ajouter d&apos;autres articles
                            </Link>
                        </div>
                    )}
                </section>

                {/* ── Delivery type ─────────────────────────────────────── */}
                <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                    <h2 className="font-bold text-surface-900 dark:text-white mb-3">Mode de récupération</h2>
                    <div className="space-y-2">
                        {DELIVERY_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setDeliveryType(opt.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                    deliveryType === opt.id
                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                                        : "border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600"
                                }`}
                            >
                                <span className={deliveryType === opt.id ? "text-brand-500" : "text-surface-400"}>
                                    {opt.icon}
                                </span>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{opt.label}</p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">{opt.desc}</p>
                                </div>
                                <span className="text-sm font-bold">
                                    {opt.fee === 0 ? "Gratuit" : formatCFA(opt.fee)}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Promo code ────────────────────────────────────────── */}
                <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                    <h2 className="font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <Tag size={16} className="text-surface-400" /> Code promo
                    </h2>
                    <div className="flex gap-2">
                        <input
                            value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); setPromoDiscount(0); }}
                            placeholder="KBOUFFE20"
                            className="flex-1 h-10 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition uppercase"
                        />
                        <button
                            onClick={validatePromo}
                            disabled={!promoCode.trim() || promoLoading}
                            className="px-4 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                        >
                            {promoLoading ? "…" : "Appliquer"}
                        </button>
                    </div>
                    {promoError && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                            <AlertCircle size={13} /> {promoError}
                        </p>
                    )}
                    {promoDiscount > 0 && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Réduction de {formatCFA(promoDiscount)} appliquée
                        </p>
                    )}
                </section>

                {/* ── Order summary ─────────────────────────────────────── */}
                <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                    <h2 className="font-bold text-surface-900 dark:text-white mb-4">Récapitulatif</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-surface-600 dark:text-surface-400">
                            <span>Sous-total</span>
                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-surface-600 dark:text-surface-400">
                            <span>Frais de livraison</span>
                            <span className="font-medium text-surface-900 dark:text-white">
                                {deliveryFee === 0 ? "Gratuit" : formatCFA(deliveryFee)}
                            </span>
                        </div>
                        <div className="flex justify-between text-surface-600 dark:text-surface-400">
                            <span>Frais de service</span>
                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(SERVICE_FEE)}</span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Réduction promo</span>
                                <span className="font-bold">- {formatCFA(promoDiscount)}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex justify-between">
                            <span className="font-bold text-surface-900 dark:text-white text-base">Total</span>
                            <span className="font-extrabold text-surface-900 dark:text-white text-base">{formatCFA(total)}</span>
                        </div>
                    </div>
                </section>

                {/* ── CTA ──────────────────────────────────────────────── */}
                <button
                    onClick={handleCheckout}
                    className="w-full h-14 flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                >
                    Commander • {formatCFA(total)}
                    <ArrowRight size={18} />
                </button>

                <p className="text-xs text-center text-surface-400 dark:text-surface-500">
                    En passant commande, vous acceptez les{" "}
                    <Link href="/terms" className="underline">Conditions d&apos;utilisation</Link>
                    {" "}de Kbouffe.
                </p>
            </div>

            {/* Upsell Modal — shown before checkout */}
            <UpsellModal
                isOpen={showUpsell}
                onClose={() => setShowUpsell(false)}
                onProceed={handleProceedToCheckout}
            />
        </div>
    );
}
