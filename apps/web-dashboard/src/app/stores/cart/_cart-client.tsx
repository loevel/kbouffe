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
import {
    DELIVERY_DESCRIPTIONS,
    DELIVERY_FEES,
    DELIVERY_LABELS,
    computeOrderTotals,
    type DeliveryType,
} from "@/lib/store/pricing";

// ── Types ─────────────────────────────────────────────────────────────────────
const DELIVERY_OPTIONS: { id: DeliveryType; icon: React.ReactNode }[] = [
    { id: "delivery", icon: <MapPin   size={18} /> },
    { id: "pickup",   icon: <Package  size={18} /> },
    { id: "dine_in",  icon: <Utensils size={18} /> },
];

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
    const { restaurant, items, subtotal, hydrated, updateQty, removeItem, clear } = useCart();

    const [deliveryType, setDeliveryType]     = useState<DeliveryType>("delivery");
    const [promoCode, setPromoCode]           = useState("");
    const [appliedPromo, setAppliedPromo]     = useState<{ code: string; discount: number; subtotal: number } | null>(null);
    const [promoError, setPromoError]         = useState<string | null>(null);
    const [promoLoading, setPromoLoading]     = useState(false);
    const [showUpsell, setShowUpsell]         = useState(false);
    const [confirmClear, setConfirmClear]     = useState(false);

    // Une remise en pourcentage dépend du sous-total : si le panier change après
    // l'application du code, le montant calculé n'est plus valable.
    const promoStale = appliedPromo !== null && appliedPromo.subtotal !== subtotal;
    const promoDiscount = appliedPromo && !promoStale ? appliedPromo.discount : 0;
    const totals = computeOrderTotals({ subtotal, deliveryType, discount: promoDiscount });
    const { deliveryFee, serviceFee, total } = totals;

    // ── Promo code validation ─────────────────────────────────────────────
    // L'endpoint attend { code, restaurant_id, order_subtotal, delivery_type } :
    // l'ancien payload { code, subtotal } était systématiquement rejeté en 400.
    const validatePromo = async (rawCode?: string) => {
        const code = (rawCode ?? promoCode).trim().toUpperCase();
        if (!code || promoLoading) return;
        if (!restaurant) {
            setPromoError("Ajoutez d'abord des articles à votre panier.");
            return;
        }
        setPromoError(null);
        setPromoLoading(true);
        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    restaurant_id: restaurant.id,
                    order_subtotal: subtotal,
                    delivery_type: deliveryType,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.valid) {
                setPromoError(data.error ?? "Code invalide");
                setAppliedPromo(null);
                return;
            }
            const discount = Number(data.discount ?? 0);
            if (!Number.isFinite(discount) || discount <= 0) {
                setPromoError("Ce code ne donne aucune réduction sur ce panier.");
                setAppliedPromo(null);
                return;
            }
            setAppliedPromo({ code, discount, subtotal });
        } catch {
            setPromoError("Impossible de valider le code");
        } finally {
            setPromoLoading(false);
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode("");
        setPromoError(null);
    };

    const handleCheckout = () => {
        // Show upsell modal before proceeding to checkout
        setShowUpsell(true);
    };

    const handleProceedToCheckout = () => {
        setShowUpsell(false);
        // Le code promo doit suivre jusqu'au checkout, sinon la réduction
        // affichée ici disparaît silencieusement du total facturé.
        const params = new URLSearchParams({ deliveryType });
        if (appliedPromo && !promoStale) {
            params.set("promoCode", appliedPromo.code);
            params.set("promoDiscount", String(appliedPromo.discount));
        }
        router.push(`/stores/checkout?${params.toString()}`);
    };

    // Avant hydratation du localStorage le panier est vide : afficher l'écran
    // "panier vide" ferait clignoter un faux état au rechargement de la page.
    if (!hydrated) {
        return (
            <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" aria-label="Chargement du panier" role="status" />
            </div>
        );
    }

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
                    {confirmClear ? (
                        <span className="flex items-center gap-2 text-xs">
                            <span className="text-surface-500 dark:text-surface-400">Tout supprimer ?</span>
                            <button
                                onClick={() => { clear(); setConfirmClear(false); }}
                                className="font-semibold text-red-500 hover:text-red-600 transition-colors"
                            >
                                Oui
                            </button>
                            <button
                                onClick={() => setConfirmClear(false)}
                                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                            >
                                Annuler
                            </button>
                        </span>
                    ) : (
                        <button
                            onClick={() => setConfirmClear(true)}
                            className="text-xs text-surface-400 hover:text-red-500 transition-colors"
                        >
                            Vider le panier
                        </button>
                    )}
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
                                    <p className="font-semibold text-sm">{DELIVERY_LABELS[opt.id]}</p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">{DELIVERY_DESCRIPTIONS[opt.id]}</p>
                                </div>
                                <span className="text-sm font-bold">
                                    {DELIVERY_FEES[opt.id] === 0 ? "Gratuit" : formatCFA(DELIVERY_FEES[opt.id])}
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
                    {appliedPromo ? (
                        <div className={`flex items-center justify-between gap-3 px-4 h-11 rounded-xl border ${
                            promoStale
                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                                : "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                        }`}>
                            <p className={`text-sm font-semibold truncate ${promoStale ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`}>
                                {promoStale
                                    ? `${appliedPromo.code} · panier modifié`
                                    : `${appliedPromo.code} · − ${formatCFA(appliedPromo.discount)}`}
                            </p>
                            <div className="flex items-center gap-3 shrink-0">
                                {promoStale && (
                                    <button
                                        onClick={() => void validatePromo(appliedPromo.code)}
                                        disabled={promoLoading}
                                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                                    >
                                        {promoLoading ? "…" : "Revalider"}
                                    </button>
                                )}
                                <button
                                    onClick={removePromo}
                                    className="text-xs font-semibold text-surface-500 hover:text-red-500 transition-colors"
                                >
                                    Retirer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <label htmlFor="promo-code" className="sr-only">Code promo</label>
                            <input
                                id="promo-code"
                                value={promoCode}
                                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void validatePromo(); } }}
                                placeholder="KBOUFFE20"
                                autoComplete="off"
                                autoCapitalize="characters"
                                aria-invalid={Boolean(promoError)}
                                className="flex-1 h-10 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition uppercase"
                            />
                            <button
                                onClick={() => void validatePromo()}
                                disabled={!promoCode.trim() || promoLoading}
                                className="px-4 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                            >
                                {promoLoading ? "…" : "Appliquer"}
                            </button>
                        </div>
                    )}
                    {promoError && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5" role="alert">
                            <AlertCircle size={13} /> {promoError}
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
                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(serviceFee)}</span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Réduction promo{appliedPromo ? ` (${appliedPromo.code})` : ""}</span>
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
