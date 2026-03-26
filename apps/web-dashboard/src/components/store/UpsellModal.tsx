"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Sparkles, Flame, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCFA } from "@kbouffe/module-core/ui";

// ── Types ────────────────────────────────────────────────────────────────────

interface UpsellProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    discountedPrice: number;
    imageUrl: string | null;
}

interface UpsellSuggestion {
    ruleId: string;
    product: UpsellProduct;
    discountPercent: number;
    customMessage: string | null;
    position: string;
}

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function UpsellModal({ isOpen, onClose, onProceed }: UpsellModalProps) {
    const { restaurant, items, subtotal, addItem } = useCart();
    const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
    const [animatingOut, setAnimatingOut] = useState(false);

    // Fetch upsell suggestions
    const fetchSuggestions = useCallback(async () => {
        if (!restaurant || items.length === 0) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        try {
            const cartItemIds = items.map((i) => i.id).join(",");
            const params = new URLSearchParams({
                restaurantId: restaurant.id,
                cartItems: cartItemIds,
                cartTotal: subtotal.toString(),
            });

            const res = await fetch(`/api/store/upsell-suggestions?${params}`);
            const data = await res.json();
            setSuggestions(data.suggestions ?? []);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [restaurant, items, subtotal]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setAddedItems(new Set());
            fetchSuggestions();
        }
    }, [isOpen, fetchSuggestions]);

    // Handle add to cart
    const handleAddItem = (suggestion: UpsellSuggestion) => {
        if (!restaurant) return;

        addItem(
            { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
            {
                id: suggestion.product.id,
                name: suggestion.product.name,
                price: suggestion.product.discountedPrice,
                imageUrl: suggestion.product.imageUrl,
            },
        );

        setAddedItems((prev) => new Set([...prev, suggestion.product.id]));
    };

    // Handle proceed (with animation)
    const handleProceed = () => {
        setAnimatingOut(true);
        setTimeout(() => {
            setAnimatingOut(false);
            onProceed();
        }, 200);
    };

    const handleClose = () => {
        setAnimatingOut(true);
        setTimeout(() => {
            setAnimatingOut(false);
            onClose();
        }, 200);
    };

    if (!isOpen) return null;

    // Skip modal if no suggestions (auto-proceed)
    if (!loading && suggestions.length === 0) {
        // Use setTimeout to avoid calling onProceed during render
        setTimeout(() => onProceed(), 0);
        return null;
    }

    const addedCount = addedItems.size;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
                    animatingOut ? "opacity-0" : "opacity-100"
                }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-lg mx-auto bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all duration-300 max-h-[85vh] flex flex-col ${
                    animatingOut
                        ? "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
                        : "translate-y-0 sm:scale-100 opacity-100"
                }`}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-surface-900 dark:text-white">
                                    Un petit extra ?
                                </h2>
                                <p className="text-sm text-surface-500 dark:text-surface-400">
                                    Complétez votre commande
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Suggestions list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-surface-400">Chargement des suggestions...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {suggestions.map((suggestion) => {
                                const isAdded = addedItems.has(suggestion.product.id);
                                const hasDiscount = suggestion.discountPercent > 0;

                                return (
                                    <div
                                        key={suggestion.ruleId}
                                        className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                            isAdded
                                                ? "border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10"
                                                : "border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-500/30 hover:shadow-md"
                                        }`}
                                    >
                                        {/* Discount badge */}
                                        {hasDiscount && !isAdded && (
                                            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                                <Flame size={10} />
                                                -{suggestion.discountPercent}%
                                            </div>
                                        )}

                                        {/* Product image */}
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0">
                                            {suggestion.product.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={suggestion.product.imageUrl}
                                                    alt={suggestion.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag size={20} className="text-surface-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">
                                                {suggestion.product.name}
                                            </p>

                                            {/* Custom message */}
                                            {suggestion.customMessage && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-1">
                                                    {suggestion.customMessage}
                                                </p>
                                            )}

                                            {/* Pricing */}
                                            <div className="flex items-center gap-2 mt-1">
                                                {hasDiscount ? (
                                                    <>
                                                        <span className="text-xs text-surface-400 line-through">
                                                            {formatCFA(suggestion.product.price)}
                                                        </span>
                                                        <span className="text-sm font-bold text-red-500">
                                                            {formatCFA(suggestion.product.discountedPrice)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
                                                        +{formatCFA(suggestion.product.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add button */}
                                        <button
                                            onClick={() => !isAdded && handleAddItem(suggestion)}
                                            disabled={isAdded}
                                            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                isAdded
                                                    ? "bg-green-500 text-white scale-95"
                                                    : "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:scale-105 active:scale-95"
                                            }`}
                                        >
                                            {isAdded ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <Plus size={20} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-surface-100 dark:border-surface-800 shrink-0 space-y-3">
                    {addedCount > 0 && (
                        <div className="text-center">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                {addedCount} article{addedCount > 1 ? "s" : ""} ajouté{addedCount > 1 ? "s" : ""} !
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleProceed}
                        className="w-full h-13 py-3.5 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                    >
                        {addedCount > 0 ? "Continuer avec mes extras" : "Non merci, continuer"}
                    </button>

                    {addedCount === 0 && (
                        <p className="text-xs text-center text-surface-400 dark:text-surface-500">
                            Vous ne serez pas facturé pour ce que vous n&apos;ajoutez pas
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
