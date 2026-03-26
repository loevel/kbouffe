"use client";

import Image from "next/image";
import { Plus, ShoppingBag } from "lucide-react";
import type { ThemeProps } from "./types";
import { ScarcityBadge } from "./ScarcityBadge";

/**
 * Story / Instagram-like theme.
 * Full-screen cards, overlay text, horizontal category scroll, bold modern typography.
 */
export function StoryTheme({
    categories,
    products,
    activeCategory,
    onCategoryChange,
    onAddToCart,
    onProductClick,
    formatPrice,
    sectionRefs,
}: ThemeProps) {
    return (
        <div className="space-y-6">
            {/* Horizontal scrollable categories — pill style */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                            activeCategory === cat.id
                                ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-lg scale-105"
                                : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Products — stacked full-width story cards */}
            {categories.map((cat) => {
                const catProducts = products.filter((p) => p.category_id === cat.id);
                if (catProducts.length === 0) return null;

                return (
                    <section
                        key={cat.id}
                        ref={(el) => {
                            if (sectionRefs.current) sectionRefs.current[cat.id] = el;
                        }}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-black uppercase tracking-tight text-surface-900 dark:text-white px-1">
                            {cat.name}
                        </h2>

                        <div className="space-y-4">
                            {catProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="relative rounded-3xl overflow-hidden cursor-pointer group"
                                    onClick={() => onProductClick(product)}
                                >
                                    {/* Image background */}
                                    <div className="relative aspect-[4/5] w-full">
                                        {product.image_url ? (
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center">
                                                <ShoppingBag size={48} className="text-surface-400" />
                                            </div>
                                        )}

                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Badges: Promo + Scarcity */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            {product.compare_at_price && product.compare_at_price > product.price && (
                                                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg w-fit">
                                                    PROMO
                                                </div>
                                            )}
                                            {product.is_limited_edition && (
                                                <ScarcityBadge
                                                    isLimitedEdition={product.is_limited_edition}
                                                    stockQuantity={(product as any).stock_quantity}
                                                    availableUntil={(product as any).available_until}
                                                    variant="overlay"
                                                />
                                            )}
                                        </div>

                                        {/* Content overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <h3 className="text-xl font-black text-white mb-1 drop-shadow-lg">
                                                {product.name}
                                            </h3>
                                            {product.description && (
                                                <p className="text-sm text-white/80 line-clamp-2 mb-3 drop-shadow">
                                                    {product.description}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-black text-white drop-shadow-lg">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                                        <span className="ml-2 text-sm text-white/50 line-through">
                                                            {formatPrice(product.compare_at_price)}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(product);
                                                    }}
                                                    className="p-3 rounded-full bg-white text-surface-900 shadow-xl hover:scale-110 transition-transform"
                                                >
                                                    <Plus size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
