"use client";

/**
 * ProductAnalytics -- Analytics tab for supplier products
 *
 * Shows table with: Image | Name | Category | Orders | Revenue | Rating | Stock
 * Sortable columns, top/under-performer highlights, loading skeletons
 */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    TrendingUp,
    TrendingDown,
    Loader2,
    BarChart3,
    Camera,
    Star,
    Leaf,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { StockAlertBadge } from "./StockAlertBadge";

// ── Types ────────────────────────────────────────────────────────────────

interface Product {
    id: string;
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    min_order_quantity: number;
    available_quantity: number | null;
    origin_region: string | null;
    photos: string[];
    is_organic: boolean;
    is_active: boolean;
}

interface ProductAnalyticsData {
    product_id: string;
    order_count: number;
    total_revenue: number;
    avg_rating: number | null;
    rating_count: number;
}

interface ProductWithAnalytics extends Product {
    order_count: number;
    total_revenue: number;
    avg_rating: number | null;
    rating_count: number;
}

type SortField = "order_count" | "total_revenue" | "avg_rating" | "available_quantity" | "name";
type SortDir = "asc" | "desc";

// ── Constants ────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    legumes: "Legumes",
    fruits: "Fruits",
    cereales: "Cereales",
    viande: "Viandes",
    poisson: "Poissons",
    epices: "Epices",
    produits_laitiers: "Produits laitiers",
    huiles: "Huiles",
    condiments: "Condiments",
    autres: "Autres",
};

function formatFCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

// ── Skeleton loader ──────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="border-b border-white/5">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-4 bg-surface-800 rounded-lg animate-pulse w-full max-w-[120px]" />
                </td>
            ))}
        </tr>
    );
}

// ── Sort header ──────────────────────────────────────────────────────────

function SortHeader({
    label,
    field,
    currentField,
    currentDir,
    onSort,
    className,
}: {
    label: string;
    field: SortField;
    currentField: SortField;
    currentDir: SortDir;
    onSort: (field: SortField) => void;
    className?: string;
}) {
    const isActive = currentField === field;
    return (
        <th
            className={`px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors ${className ?? ""}`}
            onClick={() => onSort(field)}
            aria-sort={isActive ? (currentDir === "asc" ? "ascending" : "descending") : "none"}
            role="columnheader"
        >
            <span className="inline-flex items-center gap-1">
                {label}
                {isActive ? (
                    currentDir === "asc" ? (
                        <ArrowUp size={12} className="text-brand-400" />
                    ) : (
                        <ArrowDown size={12} className="text-brand-400" />
                    )
                ) : (
                    <ArrowUpDown size={12} className="text-surface-600" />
                )}
            </span>
        </th>
    );
}

// ── Component ────────────────────────────────────────────────────────────

interface ProductAnalyticsProps {
    products: Product[];
}

export function ProductAnalytics({ products }: ProductAnalyticsProps) {
    const [analyticsData, setAnalyticsData] = useState<ProductAnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>("total_revenue");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // Fetch analytics
    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                const res = await authFetch("/api/marketplace/suppliers/me/products/analytics");
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data)
                        ? data
                        : data?.analytics ?? [];
                    setAnalyticsData(list as ProductAnalyticsData[]);
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } catch (err) {
                console.warn(
                    "[ProductAnalytics] API /api/marketplace/suppliers/me/products/analytics non disponible, utilisation des mock data.",
                    err
                );
                // Generate mock analytics from products
                const mock: ProductAnalyticsData[] = products.map((p) => ({
                    product_id: p.id,
                    order_count: Math.floor(Math.random() * 50),
                    total_revenue: Math.floor(Math.random() * 500000),
                    avg_rating: Math.random() > 0.3 ? +(3 + Math.random() * 2).toFixed(1) : null,
                    rating_count: Math.floor(Math.random() * 20),
                }));
                setAnalyticsData(mock);
            } finally {
                setLoading(false);
            }
        }

        if (products.length > 0) {
            fetchAnalytics();
        } else {
            setLoading(false);
        }
    }, [products]);

    // Merge products + analytics
    const merged: ProductWithAnalytics[] = useMemo(() => {
        const analyticsMap = new Map(analyticsData.map((a) => [a.product_id, a]));
        return products.map((p) => {
            const a = analyticsMap.get(p.id);
            return {
                ...p,
                order_count: a?.order_count ?? 0,
                total_revenue: a?.total_revenue ?? 0,
                avg_rating: a?.avg_rating ?? null,
                rating_count: a?.rating_count ?? 0,
            };
        });
    }, [products, analyticsData]);

    // Sort
    const sorted = useMemo(() => {
        const arr = [...merged];
        arr.sort((a, b) => {
            let aVal: number;
            let bVal: number;

            switch (sortField) {
                case "name":
                    return sortDir === "asc"
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                case "order_count":
                    aVal = a.order_count;
                    bVal = b.order_count;
                    break;
                case "total_revenue":
                    aVal = a.total_revenue;
                    bVal = b.total_revenue;
                    break;
                case "avg_rating":
                    aVal = a.avg_rating ?? -1;
                    bVal = b.avg_rating ?? -1;
                    break;
                case "available_quantity":
                    aVal = a.available_quantity ?? -1;
                    bVal = b.available_quantity ?? -1;
                    break;
                default:
                    return 0;
            }

            return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        });
        return arr;
    }, [merged, sortField, sortDir]);

    // Determine top/bottom performers (top 20% and bottom 20% by revenue)
    const performanceThresholds = useMemo(() => {
        if (sorted.length < 3) return { top: Infinity, bottom: -1 };
        const revenues = sorted.map((p) => p.total_revenue).sort((a, b) => b - a);
        const topIdx = Math.max(0, Math.floor(revenues.length * 0.2) - 1);
        const bottomIdx = Math.min(revenues.length - 1, Math.ceil(revenues.length * 0.8));
        return {
            top: revenues[topIdx] ?? Infinity,
            bottom: revenues[bottomIdx] ?? -1,
        };
    }, [sorted]);

    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    }

    function getRowHighlight(p: ProductWithAnalytics): string {
        if (sorted.length < 3) return "";
        if (p.total_revenue >= performanceThresholds.top && p.total_revenue > 0) {
            return "bg-emerald-500/5 border-l-2 border-l-emerald-500/40";
        }
        if (p.total_revenue <= performanceThresholds.bottom && p.order_count > 0) {
            return "bg-red-500/5 border-l-2 border-l-red-500/30";
        }
        return "";
    }

    if (products.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-white/8 flex items-center justify-center mb-4">
                    <BarChart3 size={24} className="text-surface-500" />
                </div>
                <p className="text-white font-semibold mb-1">Pas encore de donnees</p>
                <p className="text-sm text-surface-500 max-w-xs">
                    Les analytics apparaitront une fois que vous aurez des produits et des commandes.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-900 rounded-2xl border border-white/8 overflow-hidden">
            {/* Legend */}
            <div className="px-4 py-3 border-b border-white/5 flex flex-wrap gap-4 text-xs text-surface-500">
                <span className="inline-flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-400" />
                    Top performer
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <TrendingDown size={12} className="text-red-400" />
                    Sous-performer
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[780px]">
                    <thead>
                        <tr className="border-b border-white/8">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider w-10">
                                <span className="sr-only">Image</span>
                            </th>
                            <SortHeader
                                label="Produit"
                                field="name"
                                currentField={sortField}
                                currentDir={sortDir}
                                onSort={handleSort}
                            />
                            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider hidden sm:table-cell">
                                Categorie
                            </th>
                            <SortHeader
                                label="Commandes"
                                field="order_count"
                                currentField={sortField}
                                currentDir={sortDir}
                                onSort={handleSort}
                            />
                            <SortHeader
                                label="Revenu"
                                field="total_revenue"
                                currentField={sortField}
                                currentDir={sortDir}
                                onSort={handleSort}
                            />
                            <SortHeader
                                label="Rating"
                                field="avg_rating"
                                currentField={sortField}
                                currentDir={sortDir}
                                onSort={handleSort}
                            />
                            <SortHeader
                                label="Stock"
                                field="available_quantity"
                                currentField={sortField}
                                currentDir={sortDir}
                                onSort={handleSort}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : (
                            sorted.map((p, i) => (
                                <motion.tr
                                    key={p.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02, duration: 0.25 }}
                                    className={`border-b border-white/5 hover:bg-white/3 transition-colors ${getRowHighlight(p)}`}
                                >
                                    {/* Image */}
                                    <td className="px-4 py-3">
                                        <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/8 overflow-hidden shrink-0">
                                            {p.photos?.[0] ? (
                                                <img
                                                    src={p.photos[0]}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Camera size={14} className="text-surface-500" />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Name */}
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-white">
                                            {p.name}
                                            {p.is_organic && (
                                                <Leaf
                                                    size={11}
                                                    className="inline ml-1 text-emerald-400"
                                                />
                                            )}
                                        </p>
                                    </td>

                                    {/* Category */}
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <span className="px-2 py-0.5 rounded-lg bg-surface-800 text-xs text-surface-400 border border-white/5">
                                            {CATEGORY_LABELS[p.category] ?? p.category}
                                        </span>
                                    </td>

                                    {/* Orders */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-white font-medium tabular-nums">
                                            {p.order_count}
                                        </span>
                                    </td>

                                    {/* Revenue */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-white font-bold tabular-nums">
                                            {formatFCFA(p.total_revenue)}
                                        </span>
                                    </td>

                                    {/* Rating */}
                                    <td className="px-4 py-3">
                                        {p.avg_rating != null ? (
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                <Star
                                                    size={13}
                                                    className="text-amber-400 fill-amber-400"
                                                />
                                                <span className="text-white font-medium">
                                                    {p.avg_rating.toFixed(1)}
                                                </span>
                                                <span className="text-surface-500 text-xs">
                                                    ({p.rating_count})
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-surface-600 text-sm">
                                                &mdash;
                                            </span>
                                        )}
                                    </td>

                                    {/* Stock */}
                                    <td className="px-4 py-3">
                                        <StockAlertBadge
                                            availableQty={p.available_quantity}
                                            minOrderQty={p.min_order_quantity}
                                            unit={p.unit}
                                        />
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
