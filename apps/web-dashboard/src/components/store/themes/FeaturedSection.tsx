"use client";

import { ChefHat, Plus } from "lucide-react";
import type { ThemeProduct } from "./types";

interface FeaturedSectionProps {
    products: ThemeProduct[];
    onAdd: (product: ThemeProduct) => void;
    onClick: (product: ThemeProduct) => void;
    formatPrice: (price: number) => string;
    primaryColor?: string;
}

/**
 * FeaturedSection — "Nos incontournables"
 * Horizontal scrollable on mobile, up to 3 cols on desktop.
 * Uses CSS var(--brand-primary) for price text and add button.
 */
export function FeaturedSection({ products, onAdd, onClick, formatPrice, primaryColor }: FeaturedSectionProps) {
    if (products.length === 0) return null;

    const brandColor = primaryColor ?? "var(--brand-primary, #f97316)";

    return (
        <>
            <section className="mb-6">
                <h2 className="text-lg font-extrabold text-surface-900 dark:text-white mb-3">
                    ⭐ Nos incontournables
                </h2>

                {/* Horizontal scroll on mobile, grid on desktop */}
                <div className="overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex gap-3 sm:grid sm:grid-cols-3 sm:gap-4 w-max sm:w-full">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="w-40 flex-shrink-0 sm:w-auto cursor-pointer"
                                onClick={() => onClick(product)}
                            >
                                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {/* Product image */}
                                    <div className="w-full aspect-square bg-surface-100 dark:bg-surface-800 rounded-t-2xl overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ChefHat size={28} className="text-surface-300 dark:text-surface-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-2.5">
                                        <p className="text-xs font-semibold text-surface-900 dark:text-white line-clamp-2 leading-tight mb-1.5">
                                            {product.name}
                                        </p>

                                        <div className="flex items-center justify-between gap-1">
                                            <span
                                                className="text-sm font-extrabold"
                                                style={{ color: brandColor }}
                                            >
                                                {formatPrice(product.price)}
                                            </span>

                                            {product.is_available && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAdd(product);
                                                    }}
                                                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90"
                                                    style={{ backgroundColor: brandColor }}
                                                    aria-label={`Ajouter ${product.name}`}
                                                >
                                                    <Plus size={14} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Separator before category navigation */}
            <div className="border-t border-surface-100 dark:border-surface-800 mb-6" />
        </>
    );
}
