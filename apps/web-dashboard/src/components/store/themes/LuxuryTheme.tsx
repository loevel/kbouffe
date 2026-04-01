"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { ThemeProps } from "./types";
import { ScarcityBadge } from "./ScarcityBadge";
import { FeaturedSection } from "./FeaturedSection";

/**
 * Luxury / Gastronomic theme.
 * Full-width images, serif typography, elegant pricing, 1-column layout.
 */
export function LuxuryTheme({
    restaurant,
    categories,
    products,
    featuredProducts = [],
    activeCategory,
    onCategoryChange,
    onAddToCart,
    onProductClick,
    formatPrice,
    sectionRefs,
}: ThemeProps) {
    const primaryColor = restaurant.primaryColor ?? "var(--brand-primary, #f97316)";

    return (
        <div className="space-y-8">
            {/* Featured products section */}
            <FeaturedSection
                products={featuredProducts}
                onAdd={onAddToCart}
                onClick={onProductClick}
                formatPrice={formatPrice}
                primaryColor={primaryColor}
            />

            {/* Category navigation — elegant minimal */}
            <nav className="flex gap-6 overflow-x-auto pb-2 border-b border-surface-200 dark:border-surface-700">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`text-sm font-serif tracking-wide whitespace-nowrap pb-2 transition-colors border-b-2 ${
                            activeCategory === cat.id
                                ? "border-current"
                                : "border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                        }`}
                        style={
                            activeCategory === cat.id
                                ? { borderBottomColor: primaryColor, color: primaryColor }
                                : {}
                        }
                    >
                        {cat.name}
                    </button>
                ))}
            </nav>

            {/* Products by category */}
            {categories.map((cat) => {
                const catProducts = products.filter((p) => p.category_id === cat.id);
                if (catProducts.length === 0) return null;

                return (
                    <section
                        key={cat.id}
                        ref={(el) => {
                            if (sectionRefs.current) sectionRefs.current[cat.id] = el;
                        }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-serif text-surface-900 dark:text-white tracking-wide">
                                {cat.name}
                            </h2>
                            {cat.description && (
                                <p className="text-sm text-surface-400 mt-1 italic">{cat.description}</p>
                            )}
                        </div>

                        <div className="space-y-6">
                            {catProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group cursor-pointer"
                                    onClick={() => onProductClick(product)}
                                >
                                    {/* Full-width image */}
                                    {product.image_url && (
                                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4">
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex items-start justify-between gap-4 px-1">
                                        <div className="flex-1">
                                            <h3 className="font-serif text-lg text-surface-900 dark:text-white tracking-wide">
                                                {product.name}
                                            </h3>
                                            {product.description && (
                                                <p className="text-sm text-surface-400 mt-1 italic line-clamp-2">
                                                    {product.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className="text-lg font-light text-surface-900 dark:text-white">
                                                    {formatPrice(product.price)}
                                                </span>
                                                {product.compare_at_price && product.compare_at_price > product.price && (
                                                    <span className="block text-xs text-surface-400 line-through">
                                                        {formatPrice(product.compare_at_price)}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(product);
                                                }}
                                                className="p-2.5 rounded-full text-white transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scarcity */}
                                    {product.is_limited_edition && (
                                        <div className="mt-3 px-1">
                                            <ScarcityBadge
                                                isLimitedEdition={product.is_limited_edition}
                                                stockQuantity={(product as any).stock_quantity}
                                                availableUntil={(product as any).available_until}
                                            />
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="mt-6 border-b border-surface-100 dark:border-surface-800" />
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
