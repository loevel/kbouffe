"use client";

import { useState, useMemo } from "react";
import { Search, X, AlertTriangle, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/use-data";
import { Card, CardHeader, CardTitle } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

interface ProductAnalyticsFiltersProps {
    onFilterChange: (filters: ProductFilters) => void;
}

export interface ProductFilters {
    search: string;
    categoryId: string;
    availability: "all" | "available" | "unavailable";
    stockAlert: boolean;
}

export function ProductAnalyticsFilters({ onFilterChange }: ProductAnalyticsFiltersProps) {
    const { categories } = useCategories();
    const [filters, setFilters] = useState<ProductFilters>({
        search: "",
        categoryId: "",
        availability: "all",
        stockAlert: false,
    });

    function update(patch: Partial<ProductFilters>) {
        const next = { ...filters, ...patch };
        setFilters(next);
        onFilterChange(next);
    }

    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => update({ search: e.target.value })}
                    placeholder="Rechercher un produit…"
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {filters.search && (
                    <button onClick={() => update({ search: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Category */}
            <select
                value={filters.categoryId}
                onChange={(e) => update({ categoryId: e.target.value })}
                className="py-2 pl-3 pr-8 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
                <option value="">Toutes catégories</option>
                {(categories ?? []).map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            {/* Availability */}
            <div className="flex rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                {(["all", "available", "unavailable"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => update({ availability: v })}
                        className={cn(
                            "px-3 py-2 text-xs font-medium transition-colors",
                            filters.availability === v
                                ? "bg-brand-500 text-white"
                                : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700"
                        )}
                    >
                        {v === "all" ? "Tous" : v === "available" ? "Dispos" : "Indispos"}
                    </button>
                ))}
            </div>

            {/* Stock alert toggle */}
            <button
                onClick={() => update({ stockAlert: !filters.stockAlert })}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors",
                    filters.stockAlert
                        ? "bg-rose-50 dark:bg-rose-900/10 border-rose-300 dark:border-rose-800 text-rose-600"
                        : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400"
                )}
            >
                <AlertTriangle size={14} />
                Alertes stock
            </button>
        </div>
    );
}

export function ProductStockBadge({ product }: { product: any }) {
    const isLowStock = product.available_qty != null && product.min_order_qty != null
        && product.available_qty < product.min_order_qty;
    const isOutOfStock = product.available_qty === 0;

    if (isOutOfStock) {
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-900/10 px-2 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Rupture
        </span>;
    }
    if (isLowStock) {
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Stock bas
        </span>;
    }
    return null;
}
