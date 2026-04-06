"use client";

/**
 * MenuBrowserPanel — POS menu browser
 *
 * Fetches products from /api/menu/products and displays them as a
 * searchable, category-filtered grid. Shows quantity badges for items
 * already in the cart.
 *
 * Usage:
 *   <MenuBrowserPanel
 *     onAddProduct={(p) => addItem(p)}
 *     cartItems={state.items}
 *   />
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChefHat, Search, X } from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import type { CartItem } from "@/contexts/ServerCartContext";

// ── API types ─────────────────────────────────────────────────────────────────

interface ApiCategory {
    id: string;
    name: string;
}

interface OptionValue {
    id: string;
    name: string;
    price_adjustment: number;
    is_default: boolean;
    sort_order: number;
}

interface ProductOption {
    id: string;
    name: string;
    /** "single" → radio (pick 1), "multiple" → checkbox (pick many) */
    type: "single" | "multiple";
    is_required: boolean;
    max_selections: number | null;
    sort_order: number;
    menu_item_option_values: OptionValue[];
}

interface ApiProduct {
    id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    is_available: boolean;
    categories: ApiCategory | null;
    menu_item_options: ProductOption[];
}

// ── Component props ───────────────────────────────────────────────────────────

interface AddProductPayload {
    productId: string;
    name: string;
    price: number;
    cartKey: string;
    selectedOptions?: Record<string, string>;
}

interface MenuBrowserPanelProps {
    onAddProduct: (product: AddProductPayload) => void;
    /** Used to show quantity badges on product cards */
    cartItems: CartItem[];
    className?: string;
}

// ── Product Options Modal ─────────────────────────────────────────────────────

interface ProductOptionsModalProps {
    product: ApiProduct;
    onConfirm: (payload: AddProductPayload) => void;
    onClose: () => void;
}

function ProductOptionsModal({ product, onConfirm, onClose }: ProductOptionsModalProps) {
    // Map: optionId → Set of selected valueIds
    const [selections, setSelections] = useState<Record<string, Set<string>>>(() => {
        const init: Record<string, Set<string>> = {};
        for (const opt of product.menu_item_options) {
            const defaults = opt.menu_item_option_values
                .filter((v) => v.is_default)
                .map((v) => v.id);
            init[opt.id] = new Set(defaults);
        }
        return init;
    });

    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const toggle = (optionId: string, valueId: string, isSingle: boolean) => {
        setSelections((prev) => {
            const next = { ...prev, [optionId]: new Set(prev[optionId]) };
            if (isSingle) {
                next[optionId] = new Set([valueId]);
            } else {
                if (next[optionId].has(valueId)) {
                    next[optionId].delete(valueId);
                } else {
                    next[optionId].add(valueId);
                }
            }
            return next;
        });
    };

    // Compute final price
    const finalPrice = useMemo(() => {
        let total = product.price;
        for (const opt of product.menu_item_options) {
            const selected = selections[opt.id] ?? new Set();
            for (const v of opt.menu_item_option_values) {
                if (selected.has(v.id)) total += v.price_adjustment;
            }
        }
        return total;
    }, [product, selections]);

    // Validate: all required options have at least one selection
    const missingRequired = useMemo(
        () =>
            product.menu_item_options
                .filter((o) => o.is_required)
                .filter((o) => (selections[o.id]?.size ?? 0) === 0),
        [product, selections],
    );

    const handleConfirm = () => {
        if (missingRequired.length > 0) return;

        // Build selectedOptions map: optionName → comma-joined valueName(s)
        const selectedOptions: Record<string, string> = {};
        for (const opt of product.menu_item_options) {
            const selected = selections[opt.id] ?? new Set();
            const names = opt.menu_item_option_values
                .filter((v) => selected.has(v.id))
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((v) => v.name);
            if (names.length > 0) selectedOptions[opt.name] = names.join(", ");
        }

        const cartKey = `${product.id}|${JSON.stringify(selectedOptions)}`;
        onConfirm({ productId: product.id, name: product.name, price: finalPrice, cartKey, selectedOptions });
        onClose();
    };

    const sortedOptions = [...product.menu_item_options].sort(
        (a, b) => a.sort_order - b.sort_order,
    );

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdrop}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Options pour ${product.name}`}
        >
            <div className="w-full sm:max-w-md bg-white dark:bg-surface-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 border-b border-surface-100 dark:border-surface-800">
                    <div className="flex-1 min-w-0 pr-3">
                        <h2 className="text-base font-bold text-surface-900 dark:text-white truncate">
                            {product.name}
                        </h2>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                            Prix de base : {formatCFA(product.price)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Options list — scrollable */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {sortedOptions.map((opt) => {
                        const isSingle = opt.type === "single";
                        const selectedSet = selections[opt.id] ?? new Set();
                        const sortedValues = [...opt.menu_item_option_values].sort(
                            (a, b) => a.sort_order - b.sort_order,
                        );
                        const isMissing = missingRequired.some((o) => o.id === opt.id);

                        return (
                            <fieldset key={opt.id}>
                                <legend className="flex items-center gap-1.5 mb-2">
                                    <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                                        {opt.name}
                                    </span>
                                    {opt.is_required && (
                                        <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                isMissing
                                                    ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                                    : "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"
                                            }`}
                                        >
                                            Requis
                                        </span>
                                    )}
                                    {!isSingle && opt.max_selections && (
                                        <span className="text-[10px] text-surface-400 dark:text-surface-500">
                                            (max {opt.max_selections})
                                        </span>
                                    )}
                                </legend>
                                <div className="grid grid-cols-2 gap-2">
                                    {sortedValues.map((v) => {
                                        const isSelected = selectedSet.has(v.id);
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => toggle(opt.id, v.id, isSingle)}
                                                className={[
                                                    "flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-all",
                                                    isSelected
                                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-semibold"
                                                        : "border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600",
                                                ].join(" ")}
                                                aria-pressed={isSelected}
                                            >
                                                <span className="truncate">{v.name}</span>
                                                <span className="shrink-0 flex items-center gap-1">
                                                    {v.price_adjustment !== 0 && (
                                                        <span className="text-xs text-surface-500 dark:text-surface-400">
                                                            {v.price_adjustment > 0 ? "+" : ""}
                                                            {formatCFA(v.price_adjustment)}
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <Check size={12} className="text-brand-500 dark:text-brand-400 shrink-0" />
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-3 shrink-0 border-t border-surface-100 dark:border-surface-800">
                    {missingRequired.length > 0 && (
                        <p className="text-xs text-red-500 dark:text-red-400 mb-2 text-center">
                            Veuillez sélectionner : {missingRequired.map((o) => o.name).join(", ")}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={missingRequired.length > 0}
                        className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        style={{ backgroundColor: missingRequired.length > 0 ? undefined : "var(--brand-primary, #f97316)" }}
                    >
                        Ajouter au panier — {formatCFA(finalPrice)}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function ProductSkeleton() {
    return (
        <div className="rounded-xl border border-surface-100 dark:border-surface-800 overflow-hidden animate-pulse">
            <div className="aspect-square bg-surface-200 dark:bg-surface-700" />
            <div className="p-2.5 space-y-2">
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
                <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded-full w-full mt-1" />
            </div>
        </div>
    );
}

// ── Product card ──────────────────────────────────────────────────────────────

interface ProductCardProps {
    product: ApiProduct;
    cartQty: number;
    brandColor: string;
    onAdd: () => void;
}

function ProductCard({ product, cartQty, brandColor, onAdd }: ProductCardProps) {
    const isAvailable = product.is_available;
    const hasOptions = product.menu_item_options?.length > 0;

    return (
        <div
            onClick={() => isAvailable && onAdd()}
            role={isAvailable ? "button" : undefined}
            tabIndex={isAvailable ? 0 : undefined}
            onKeyDown={(e) => {
                if (isAvailable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onAdd();
                }
            }}
            aria-label={
                isAvailable
                    ? hasOptions
                        ? `Choisir les options pour ${product.name}`
                        : `Ajouter ${product.name} au panier`
                    : `${product.name} — épuisé`
            }
            className={[
                "rounded-xl border bg-white dark:bg-surface-900 overflow-hidden transition-all duration-150",
                isAvailable
                    ? "border-surface-100 dark:border-surface-800 cursor-pointer hover:shadow-md hover:border-surface-200 dark:hover:border-surface-700 active:scale-[0.98]"
                    : "border-surface-100 dark:border-surface-800 opacity-60 cursor-not-allowed",
            ].join(" ")}
        >
            {/* Image */}
            <div className="aspect-square bg-surface-100 dark:bg-surface-800 overflow-hidden relative">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ChefHat size={28} className="text-surface-300 dark:text-surface-600" />
                    </div>
                )}

                {/* Options badge */}
                {isAvailable && hasOptions && (
                    <div className="absolute top-1.5 right-1.5">
                        <span className="bg-white/90 dark:bg-surface-900/90 text-surface-600 dark:text-surface-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-surface-200 dark:border-surface-700">
                            Options
                        </span>
                    </div>
                )}

                {/* Épuisé overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-900/50">
                        <span className="bg-white/90 dark:bg-surface-900/90 text-surface-700 dark:text-surface-300 text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                            Épuisé
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-2.5">
                {/* Name — 2 lines max */}
                <p className="text-xs font-semibold text-surface-900 dark:text-white line-clamp-2 leading-tight mb-2 min-h-[2.5em]">
                    {product.name}
                </p>

                <div className="flex items-center justify-between gap-1">
                    {/* Price */}
                    <span
                        className="text-xs font-extrabold leading-none"
                        style={{ color: brandColor }}
                    >
                        {formatCFA(product.price)}
                    </span>

                    {/* Add button — amber when qty > 0, brand when 0 */}
                    {isAvailable && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAdd();
                            }}
                            aria-label={
                                cartQty > 0
                                    ? `${product.name} — ${cartQty} dans le panier, ajouter un de plus`
                                    : hasOptions
                                      ? `Choisir les options pour ${product.name}`
                                      : `Ajouter ${product.name}`
                            }
                            className={[
                                "shrink-0 min-w-[1.75rem] h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all px-1.5 shadow-sm active:scale-90",
                                cartQty > 0
                                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/40"
                                    : "hover:opacity-90",
                            ].join(" ")}
                            style={cartQty > 0 ? undefined : { backgroundColor: brandColor }}
                        >
                            {cartQty > 0 ? `+${cartQty}` : "+"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MenuBrowserPanel({
    onAddProduct,
    cartItems,
    className = "",
}: MenuBrowserPanelProps) {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [loading, setLoading] = useState(true);
    /** Product pending option selection (null = no modal) */
    const [pendingProduct, setPendingProduct] = useState<ApiProduct | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const brandColor = "var(--brand-primary, #f97316)";

    // ── Fetch products on mount ───────────────────────────────────────────────

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/menu/products");
            if (!res.ok) return;
            const data = (await res.json()) as {
                success: boolean;
                products: ApiProduct[];
            };
            setProducts(data.products ?? []);
        } catch {
            // Silent — empty state renders below
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ── Derived data ──────────────────────────────────────────────────────────

    /** Unique categories extracted from product list, sorted alphabetically */
    const categories = useMemo<ApiCategory[]>(() => {
        const map = new Map<string, ApiCategory>();
        for (const p of products) {
            if (p.categories) {
                map.set(p.categories.id, p.categories);
            }
        }
        return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "fr"),
        );
    }, [products]);

    /** O(1) cart quantity lookups */
    const cartQtyMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const item of cartItems) {
            map.set(item.productId, item.quantity);
        }
        return map;
    }, [cartItems]);

    /** Filtered + searched products */
    const filteredProducts = useMemo(() => {
        let list = products;
        if (activeCategory) {
            list = list.filter((p) => p.categories?.id === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
        }
        return list;
    }, [products, activeCategory, searchQuery]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-surface-950 ${className}`}>
            {/* Search bar */}
            <div className="px-3 pt-3 pb-2 shrink-0">
                <div className="relative">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none"
                        aria-hidden
                    />
                    <input
                        type="search"
                        placeholder="Rechercher un article..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Rechercher dans le menu"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
                    />
                </div>
            </div>

            {/* Category tabs — horizontal scrollable */}
            {categories.length > 0 && (
                <div
                    className="px-3 pb-2 shrink-0 overflow-x-auto scrollbar-hide"
                    role="tablist"
                    aria-label="Catégories du menu"
                >
                    <div className="flex gap-1.5 w-max">
                        {/* "Tout" tab */}
                        <button
                            role="tab"
                            aria-selected={activeCategory === null}
                            onClick={() => setActiveCategory(null)}
                            className={[
                                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                                activeCategory === null
                                    ? "text-white shadow-sm"
                                    : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
                            ].join(" ")}
                            style={
                                activeCategory === null
                                    ? { backgroundColor: brandColor }
                                    : undefined
                            }
                        >
                            Tout
                        </button>

                        {categories.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={[
                                        "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                                        isActive
                                            ? "text-white shadow-sm"
                                            : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
                                    ].join(" ")}
                                    style={
                                        isActive
                                            ? { backgroundColor: brandColor }
                                            : undefined
                                    }
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Product grid — scrollable */}
            <div className="flex-1 overflow-y-auto px-3 pb-4" role="region" aria-label="Produits">
                {loading ? (
                    /* Loading skeleton */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ChefHat
                            size={40}
                            className="text-surface-300 dark:text-surface-600 mb-3"
                            aria-hidden
                        />
                        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                            Aucun produit disponible
                        </p>
                        {searchQuery.trim() && (
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                Essayez un autre terme de recherche.
                            </p>
                        )}
                        {!searchQuery.trim() && activeCategory && (
                            <button
                                onClick={() => setActiveCategory(null)}
                                className="mt-3 text-xs underline text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                            >
                                Voir tous les produits
                            </button>
                        )}
                    </div>
                ) : (
                    /* Product grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                cartQty={cartQtyMap.get(product.id) ?? 0}
                                brandColor={brandColor}
                                onAdd={() => {
                                    if (product.menu_item_options?.length > 0) {
                                        // Product has options — open selection modal
                                        setPendingProduct(product);
                                    } else {
                                        // No options — add directly
                                        onAddProduct({
                                            productId: product.id,
                                            name: product.name,
                                            price: product.price,
                                            cartKey: product.id,
                                        });
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Option selection modal */}
            {pendingProduct && (
                <ProductOptionsModal
                    product={pendingProduct}
                    onConfirm={(payload) => {
                        onAddProduct(payload);
                        setPendingProduct(null);
                    }}
                    onClose={() => setPendingProduct(null)}
                />
            )}
        </div>
    );
}
