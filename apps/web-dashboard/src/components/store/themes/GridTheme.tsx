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
    primaryColor,
}: {
    product: { id: string; name: string; description: string | null; price: number; compare_at_price: number | null; image_url: string | null; images?: string[]; is_available: boolean; is_limited_edition?: boolean; stock_quantity?: number | null; available_until?: string | null };
    onAdd: () => void;
    onClick: () => void;
    primaryColor?: string;
}) {
    const brandColor = primaryColor ?? "var(--brand-primary, #f97316)";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={`group relative flex gap-5 p-5 border-b border-surface-100 dark:border-surface-800/40 last:border-0 hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-all duration-300 cursor-pointer ${
                !product.is_available ? "opacity-50 grayscale" : ""
            }`}
        >
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-surface-900 dark:text-white text-[15px] leading-tight group-hover:text-brand-500 transition-colors">
                        {product.name}
                    </h3>
                    {product.description && (
                        <p className="text-[13px] text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2 leading-relaxed font-medium opacity-80">
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
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-surface-900 dark:text-white text-[15px] tracking-tight">
                            {formatCFA(product.price)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-[12px] text-surface-400 line-through font-medium">
                                {formatCFA(product.compare_at_price)}
                            </span>
                        )}
                        {!product.is_available && (
                            <span className="text-[11px] px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-full font-bold uppercase tracking-wider">
                                Epuise
                            </span>
                        )}
                    </div>

                    {product.is_available && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAdd();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-[12px] font-bold transition-opacity hover:opacity-90 shadow-sm hover:shadow-md"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span>Ajouter</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-100 dark:border-surface-800 shadow-sm group-hover:shadow-md transition-shadow">
                    {product.image_url ? (
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ChefHat size={28} className="text-surface-300 dark:text-surface-600" />
                        </div>
                    )}
                </div>
                {(product.images?.length ?? 0) > 1 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-full">
                        <ImagePlus size={10} />
                        {product.images!.length}
                    </div>
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
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                        {items.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => onProductClick(product)}
                                onAdd={() => onAddToCart(product)}
                                primaryColor={primaryColor}
                            />
                        ))}
                    </div>
                </section>
            ))}
            {uncategorised.length > 0 && (
                <section className="scroll-mt-20">
                    <h2 className="text-lg font-extrabold text-surface-900 dark:text-white mb-1">Autres plats</h2>
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                        {uncategorised.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => onProductClick(product)}
                                onAdd={() => onAddToCart(product)}
                                primaryColor={primaryColor}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
