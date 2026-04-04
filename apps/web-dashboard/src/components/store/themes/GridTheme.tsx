"use client";

import { ChefHat, Plus, Info, ImagePlus } from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";
import type { ThemeProps } from "./types";
import { ScarcityBadge } from "./ScarcityBadge";
import { FeaturedSection } from "./FeaturedSection";

/**
 * Grid / Fast-Food theme — the default layout.
 * Extracted from the original store-page-client.tsx rendering.
 * Horizontal product cards with text left, image right, category tabs.
 */

function ProductCard({
    product,
    onAdd,
    onClick,
}: {
    product: { id: string; name: string; description: string | null; price: number; compare_at_price: number | null; image_url: string | null; images?: string[]; is_available: boolean; is_limited_edition?: boolean; stock_quantity?: number | null; available_until?: string | null };
    onAdd: () => void;
    onClick: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClick}
            className={`group flex items-start gap-3 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors ${
                !product.is_available ? "opacity-50 grayscale" : ""
            }`}
        >
            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-bold text-surface-900 dark:text-white text-[15px] leading-snug">
                    {product.name}
                </h3>
                <p className="font-semibold text-surface-900 dark:text-white text-[14px] mt-1">
                    {formatCFA(product.price)}
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="ml-2 text-[12px] text-surface-400 line-through font-normal">
                            {formatCFA(product.compare_at_price)}
                        </span>
                    )}
                </p>
                {product.description && (
                    <p className="text-[13px] text-surface-500 dark:text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>
                )}
                {product.is_limited_edition && (
                    <div className="mt-2">
                        <ScarcityBadge
                            isLimitedEdition={product.is_limited_edition}
                            stockQuantity={product.stock_quantity}
                            availableUntil={product.available_until}
                        />
                    </div>
                )}
                {!product.is_available && (
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-full font-bold uppercase tracking-wider">
                        Épuisé
                    </span>
                )}
            </div>

            {/* Image + add button */}
            <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ChefHat size={26} className="text-surface-300 dark:text-surface-600" />
                        </div>
                    )}
                </div>
                {/* Multiple images badge */}
                {(product.images?.length ?? 0) > 1 && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-full">
                        <ImagePlus size={10} />
                        {product.images!.length}
                    </div>
                )}
                {/* Add button overlaid bottom-right */}
                {product.is_available && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                        className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                        aria-label="Ajouter"
                    >
                        <Plus size={18} strokeWidth={2.5} className="text-surface-900 dark:text-white" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

export function GridTheme({
    restaurant,
    categories,
    products,
    featuredProducts = [],
    activeCategory,
    onCategoryChange,
    onAddToCart,
    onProductClick,
    sectionRefs,
}: ThemeProps) {
    const primaryColor = restaurant.primaryColor ?? "var(--brand-primary, #f97316)";

    const categoriesWithProducts = categories
        .map((cat) => ({ cat, items: products.filter((p) => p.category_id === cat.id) }))
        .filter((g) => g.items.length > 0);

    const uncategorised = products.filter(
        (p) => !p.category_id || !categories.find((c) => c.id === p.category_id),
    );

    if (categoriesWithProducts.length === 0 && uncategorised.length === 0) {
        return (
            <div className="text-center py-24">
                <ChefHat size={48} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                <p className="text-surface-500 dark:text-surface-400">Aucun plat disponible pour le moment.</p>
            </div>
        );
    }

    /** Render items as a 2-column grid with row separators */
    const renderGrid = (items: typeof products, sectionId?: string) => {
        const pairs: (typeof products)[] = [];
        for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
        return (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-visible">
                {pairs.map((pair, rowIdx) => (
                    <div
                        key={`${sectionId ?? "row"}-${rowIdx}`}
                        className={`flex ${rowIdx < pairs.length - 1 ? "border-b border-surface-100 dark:border-surface-800" : ""}`}
                    >
                        {pair.map((product, colIdx) => (
                            <div
                                key={product.id}
                                className={`flex-1 min-w-0 ${colIdx === 0 && pair.length === 2 ? "border-r border-surface-100 dark:border-surface-800" : ""}`}
                            >
                                <ProductCard
                                    product={product}
                                    onClick={() => onProductClick(product)}
                                    onAdd={() => onAddToCart(product)}
                                />
                            </div>
                        ))}
                        {/* Fill empty cell if odd count in last row */}
                        {pair.length === 1 && <div className="flex-1" />}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-10">
            {/* Featured products section */}
            <FeaturedSection
                products={featuredProducts}
                onAdd={onAddToCart}
                onClick={onProductClick}
                formatPrice={formatCFA}
                primaryColor={primaryColor}
            />

            {categoriesWithProducts.map(({ cat, items }) => (
                <section
                    key={cat.id}
                    ref={(el) => {
                        if (sectionRefs.current) sectionRefs.current[cat.id] = el;
                    }}
                    className="scroll-mt-20"
                >
                    <h2 className="text-lg font-extrabold text-surface-900 dark:text-white mb-0.5">
                        {cat.name}
                    </h2>
                    {cat.description && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 flex items-center gap-1.5">
                            <Info size={12} />
                            {cat.description}
                        </p>
                    )}
                    {renderGrid(items, cat.id)}
                </section>
            ))}
            {uncategorised.length > 0 && (
                <section className="scroll-mt-20">
                    <h2 className="text-lg font-extrabold text-surface-900 dark:text-white mb-1">Autres plats</h2>
                    {renderGrid(uncategorised, "uncategorised")}
                </section>
            )}
        </div>
    );
}
