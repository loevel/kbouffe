"use client";

/**
 * ProductFilters -- Advanced filtering for supplier products
 *
 * Filters: Search, Category, Region, Type (Bio/Conventionnel), Status, Stock level
 * Responsive: collapsed on mobile, URL params sync
 */

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    X,
    ChevronDown,
    RotateCcw,
} from "lucide-react";
import { CAMEROON_REGIONS } from "@kbouffe/module-marketplace/lib";

// ── Types ────────────────────────────────────────────────────────────────

export interface ProductFilterState {
    search: string;
    category: string;
    region: string;
    type: "all" | "bio" | "conventional";
    status: "all" | "active" | "inactive";
    stock: "all" | "low" | "good" | "excess";
}

interface ProductFiltersProps {
    filters: ProductFilterState;
    onChange: (filters: ProductFilterState) => void;
    resultCount: number;
    totalCount: number;
}

export const DEFAULT_FILTERS: ProductFilterState = {
    search: "",
    category: "",
    region: "",
    type: "all",
    status: "all",
    stock: "all",
};

const CATEGORIES = [
    { value: "", label: "Toutes les categories" },
    { value: "legumes", label: "Legumes" },
    { value: "fruits", label: "Fruits" },
    { value: "cereales", label: "Cereales" },
    { value: "viande", label: "Viandes" },
    { value: "poisson", label: "Poissons" },
    { value: "epices", label: "Epices" },
    { value: "produits_laitiers", label: "Produits laitiers" },
    { value: "huiles", label: "Huiles" },
    { value: "condiments", label: "Condiments" },
    { value: "autres", label: "Autres" },
];

const STOCK_OPTIONS = [
    { value: "all", label: "Tous" },
    { value: "low", label: "Bas" },
    { value: "good", label: "Bon" },
    { value: "excess", label: "Exces" },
];

// ── Helper: URL param sync ────────────────────────────────────────────────

export function useFilterParams(): [ProductFilterState, (f: ProductFilterState) => void] {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const filtersFromParams: ProductFilterState = {
        search: searchParams.get("q") ?? "",
        category: searchParams.get("cat") ?? "",
        region: searchParams.get("region") ?? "",
        type: (searchParams.get("type") as ProductFilterState["type"]) ?? "all",
        status: (searchParams.get("status") as ProductFilterState["status"]) ?? "all",
        stock: (searchParams.get("stock") as ProductFilterState["stock"]) ?? "all",
    };

    const setFilters = useCallback(
        (f: ProductFilterState) => {
            const params = new URLSearchParams();
            if (f.search) params.set("q", f.search);
            if (f.category) params.set("cat", f.category);
            if (f.region) params.set("region", f.region);
            if (f.type !== "all") params.set("type", f.type);
            if (f.status !== "all") params.set("status", f.status);
            if (f.stock !== "all") params.set("stock", f.stock);
            const qs = params.toString();
            router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
        },
        [router, pathname]
    );

    return [filtersFromParams, setFilters];
}

// ── Shared styles ────────────────────────────────────────────────────────

const selectClass =
    "w-full px-3 py-2 rounded-xl bg-surface-800 border border-white/8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all appearance-none cursor-pointer";

const inputClass =
    "w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all";

// ── Component ────────────────────────────────────────────────────────────

export function ProductFilters({
    filters,
    onChange,
    resultCount,
    totalCount,
}: ProductFiltersProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const hasActive =
        filters.category !== "" ||
        filters.region !== "" ||
        filters.type !== "all" ||
        filters.status !== "all" ||
        filters.stock !== "all";

    function update<K extends keyof ProductFilterState>(
        key: K,
        value: ProductFilterState[K]
    ) {
        onChange({ ...filters, [key]: value });
    }

    function resetFilters() {
        onChange(DEFAULT_FILTERS);
    }

    const activeFilterCount = [
        filters.category !== "",
        filters.region !== "",
        filters.type !== "all",
        filters.status !== "all",
        filters.stock !== "all",
    ].filter(Boolean).length;

    return (
        <div className="space-y-3">
            {/* Search bar + mobile toggle */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
                    />
                    <input
                        type="search"
                        placeholder="Rechercher un produit..."
                        value={filters.search}
                        onChange={(e) => update("search", e.target.value)}
                        className={inputClass}
                        aria-label="Rechercher un produit"
                    />
                    {filters.search && (
                        <button
                            onClick={() => update("search", "")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
                            aria-label="Effacer la recherche"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Mobile filter toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-900 border border-white/8 text-surface-400 hover:text-white text-sm transition-all"
                    aria-expanded={mobileOpen}
                    aria-label="Afficher les filtres"
                >
                    <Filter size={15} />
                    Filtres
                    {activeFilterCount > 0 && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-brand-500/30 text-brand-200 text-xs flex items-center justify-center px-1">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter row - always visible on desktop, collapsible on mobile */}
            <AnimatePresence>
                <motion.div
                    initial={false}
                    className={`grid grid-cols-2 md:grid-cols-5 gap-3 ${
                        mobileOpen ? "block" : "hidden md:grid"
                    }`}
                >
                    {/* Category */}
                    <div className="relative">
                        <select
                            value={filters.category}
                            onChange={(e) => update("category", e.target.value)}
                            className={selectClass}
                            aria-label="Filtrer par categorie"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                        />
                    </div>

                    {/* Region */}
                    <div className="relative">
                        <select
                            value={filters.region}
                            onChange={(e) => update("region", e.target.value)}
                            className={selectClass}
                            aria-label="Filtrer par region"
                        >
                            <option value="">Toutes les regions</option>
                            {CAMEROON_REGIONS.map((r: string) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                        />
                    </div>

                    {/* Type: Bio / Conventionnel */}
                    <div className="flex items-center gap-1 bg-surface-900 border border-white/8 rounded-xl p-1">
                        {(
                            [
                                { value: "all", label: "Tous" },
                                { value: "bio", label: "Bio" },
                                { value: "conventional", label: "Conv." },
                            ] as const
                        ).map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => update("type", opt.value)}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    filters.type === opt.value
                                        ? "bg-brand-500/20 text-brand-300"
                                        : "text-surface-500 hover:text-white"
                                }`}
                                aria-pressed={filters.type === opt.value}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Status: Active / Inactive */}
                    <div className="flex items-center gap-1 bg-surface-900 border border-white/8 rounded-xl p-1">
                        {(
                            [
                                { value: "all", label: "Tous" },
                                { value: "active", label: "Actifs" },
                                { value: "inactive", label: "Inactifs" },
                            ] as const
                        ).map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => update("status", opt.value)}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    filters.status === opt.value
                                        ? "bg-brand-500/20 text-brand-300"
                                        : "text-surface-500 hover:text-white"
                                }`}
                                aria-pressed={filters.status === opt.value}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Stock level */}
                    <div className="relative">
                        <select
                            value={filters.stock}
                            onChange={(e) =>
                                update("stock", e.target.value as ProductFilterState["stock"])
                            }
                            className={selectClass}
                            aria-label="Filtrer par niveau de stock"
                        >
                            {STOCK_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    Stock: {s.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Result count + reset */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-surface-500">
                    {resultCount === totalCount
                        ? `${totalCount} produit${totalCount !== 1 ? "s" : ""}`
                        : `${resultCount} resultat${resultCount !== 1 ? "s" : ""} sur ${totalCount}`}
                </p>
                {hasActive && (
                    <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <RotateCcw size={12} />
                        Reinitialiser filtres
                    </button>
                )}
            </div>
        </div>
    );
}
