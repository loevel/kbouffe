"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    ChefHat,
    Loader2,
    Search,
    ShoppingBag,
    SlidersHorizontal,
    Star,
    X,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCFA } from "@/lib/format";
import { useSearchStore } from "@/store/client-store";

// ── Types ────────────────────────────────────────────────────────────────────
interface RestaurantItem {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    coverUrl: string | null;
    cuisineType: string;
    priceRange: number | null;
    rating: number | null;
    reviewCount: number | null;
    orderCount: number | null;
    city: string;
    isVerified?: boolean;
    isPremium?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CUISINE_OPTIONS = [
    { label: "Toutes", value: "" },
    { label: "🍖 Camerounaise", value: "camerounaise" },
    { label: "🌍 Africaine",    value: "african" },
    { label: "🍔 Fast-food",    value: "fast-food" },
    { label: "🍕 Pizza",        value: "pizza" },
    { label: "🔥 Grillades",    value: "grillades" },
    { label: "🥐 Pâtisserie",   value: "patisserie" },
];

const SORT_OPTIONS = [
    { label: "Recommandés",  value: "recommended" },
    { label: "Mieux notés",  value: "rating" },
    { label: "Populaires",   value: "orders" },
];

const PRICE_LABELS: Record<number, string> = {
    1: "€",
    2: "€€",
    3: "€€€",
    4: "€€€€",
};

const PLACEHOLDER_GRADIENTS = [
    "from-brand-400 to-brand-600",
    "from-brand-500 to-brand-700",
    "from-brand-300 to-brand-500",
    "from-surface-600 to-surface-800",
    "from-brand-500 to-surface-700",
    "from-surface-500 to-brand-500",
];
const gradientFor = (id: string) =>
    PLACEHOLDER_GRADIENTS[id.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length];

// ── Restaurant card ───────────────────────────────────────────────────────────
function RestaurantCard({ r }: { r: RestaurantItem }) {
    const rating = r.rating?.toFixed(1) ?? "—";
    const eta = (r.orderCount ?? 0) > 300 ? "13 min" : "28 min";

    return (
        <Link href={`/r/${r.slug}`} className="group block">
            <div className="relative h-40 rounded-2xl overflow-hidden mb-3 border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800">
                {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={r.coverUrl}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradientFor(r.id)} flex items-center justify-center`}>
                        <span className="text-5xl font-black text-white/20">{r.name.charAt(0)}</span>
                    </div>
                )}
                {/* Logo overlay */}
                {r.logoUrl && (
                    <div className="absolute bottom-2 left-2 w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-surface-800 shadow-md bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.logoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
                {r.isPremium && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                        Premium
                    </span>
                )}
            </div>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                        {r.name}
                        {r.isVerified && (
                            <span className="ml-1 text-blue-500" title="Vérifié">✓</span>
                        )}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                        {r.cuisineType} • {r.city}
                        {r.priceRange ? ` • ${PRICE_LABELS[r.priceRange] ?? ""}` : ""}
                    </p>
                </div>
            </div>
            <p className="text-xs mt-1 flex items-center gap-1 text-surface-700 dark:text-surface-300">
                <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-semibold">{rating}</span>
                <span className="text-surface-400">({r.reviewCount ?? 0}+) • {eta}</span>
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Livraison dès {formatCFA(1500)}
            </p>
        </Link>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
    return (
        <div className="text-center py-24 col-span-full">
            <ChefHat size={56} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                {query ? `Aucun résultat pour « ${query} »` : "Aucun restaurant trouvé"}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 text-sm max-w-sm mx-auto">
                {query
                    ? "Essayez un autre terme ou supprimez les filtres actifs."
                    : "Il n'y a pas encore de restaurants dans cette catégorie."}
            </p>
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function SearchPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { itemCount } = useCart();

    // ── State ──────────────────────────────────────────────────────────────
    const [inputValue, setInputValue]     = useState(searchParams.get("q") ?? "");
    const [cuisine, setCuisine]           = useState(searchParams.get("cuisine") ?? "");
    const [sort, setSort]                 = useState(searchParams.get("sort") ?? "recommended");
    const [showFilters, setShowFilters]   = useState(false);
    const [results, setResults]           = useState<RestaurantItem[]>([]);
    const [loading, setLoading]           = useState(false);
    const [hasSearched, setHasSearched]   = useState(false);
    const { filters } = useSearchStore();

    const inputRef    = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Sync URL → state on mount ─────────────────────────────────────────
    useEffect(() => {
        const q = searchParams.get("q") ?? "";
        setInputValue(q);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchResults = useCallback(async (q: string, c: string, s: string) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const params = new URLSearchParams({ 
                sort: s, 
                limit: "40",
                mode: filters.deliveryMode,
                city: filters.city
            });
            if (q) params.set("q", q);
            if (c) params.set("cuisine", c);
            const res = await fetch(`/api/stores?${params}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.restaurants ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [filters.deliveryMode, filters.city]);

    // ── Debounced input ───────────────────────────────────────────────────
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchResults(inputValue, cuisine, sort);
            // Update URL
            const p = new URLSearchParams();
            if (inputValue) p.set("q", inputValue);
            if (cuisine)    p.set("cuisine", cuisine);
            if (sort && sort !== "recommended") p.set("sort", sort);
            const qs = p.toString();
            router.replace(`/stores/search${qs ? `?${qs}` : ""}`, { scroll: false });
        }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [inputValue, cuisine, sort, fetchResults, router]);

    // ── Auto-focus on mount ───────────────────────────────────────────────
    useEffect(() => { inputRef.current?.focus(); }, []);

    const clearSearch = () => {
        setInputValue("");
        setCuisine("");
        setSort("recommended");
        inputRef.current?.focus();
    };

    const activeFiltersCount = (cuisine ? 1 : 0) + (sort !== "recommended" ? 1 : 0);

    return (
        <div className="min-h-screen bg-white dark:bg-surface-950">
            {/* ── Sticky header ──────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
                    {/* Back */}
                    <Link
                        href="/stores"
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                        aria-label="Retour"
                    >
                        <ArrowLeft size={18} />
                    </Link>

                    {/* Search input */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            type="search"
                            placeholder="Restaurant, cuisine, plat…"
                            className="w-full h-10 pl-9 pr-10 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                        />
                        {inputValue && (
                            <button
                                onClick={() => setInputValue("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                aria-label="Effacer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className={`relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            showFilters || activeFiltersCount > 0
                                ? "bg-brand-500 text-white"
                                : "hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400"
                        }`}
                        aria-label="Filtres"
                    >
                        <SlidersHorizontal size={18} />
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-brand-600 text-[10px] font-bold rounded-full flex items-center justify-center border border-brand-200">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Cart link */}
                    <Link
                        href="/stores/cart"
                        className="relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                        aria-label="Panier"
                    >
                        <ShoppingBag size={18} />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {itemCount > 9 ? "9+" : itemCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* ── Filters panel ──────────────────────────────────────── */}
                {showFilters && (
                    <div className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 px-4 sm:px-6 py-4 space-y-4">
                        {/* Cuisine */}
                        <div>
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">Cuisine</p>
                            <div className="flex gap-2 flex-wrap">
                                {CUISINE_OPTIONS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setCuisine(c.value)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                            cuisine === c.value
                                                ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 border-surface-900 dark:border-white"
                                                : "bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700 hover:border-surface-400"
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Sort */}
                        <div>
                            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">Trier par</p>
                            <div className="flex gap-2">
                                {SORT_OPTIONS.map((s) => (
                                    <button
                                        key={s.value}
                                        onClick={() => setSort(s.value)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                            sort === s.value
                                                ? "bg-brand-500 text-white border-brand-500"
                                                : "bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700 hover:border-surface-400"
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Reset */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearSearch}
                                className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* ── Results ──────────────────────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Summary */}
                {hasSearched && !loading && (
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                        {results.length > 0
                            ? `${results.length} restaurant${results.length !== 1 ? "s" : ""}${inputValue ? ` pour « ${inputValue} »` : ""}`
                            : ""}
                    </p>
                )}

                {/* Active filters badges */}
                {(cuisine || sort !== "recommended") && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {cuisine && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-sm text-surface-700 dark:text-surface-300">
                                {CUISINE_OPTIONS.find((c) => c.value === cuisine)?.label ?? cuisine}
                                <button onClick={() => setCuisine("")} className="ml-1 hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {sort !== "recommended" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-sm text-surface-700 dark:text-surface-300">
                                {SORT_OPTIONS.find((s) => s.value === sort)?.label ?? sort}
                                <button onClick={() => setSort("recommended")} className="ml-1 hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-40 rounded-2xl bg-surface-100 dark:bg-surface-800 mb-3" />
                                <div className="h-4 w-3/4 rounded bg-surface-100 dark:bg-surface-800 mb-2" />
                                <div className="h-3 w-1/2 rounded bg-surface-100 dark:bg-surface-800" />
                            </div>
                        ))}
                    </div>
                ) : !hasSearched ? (
                    <div className="text-center py-20">
                        <Search size={40} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                        <p className="text-surface-500 dark:text-surface-400 font-medium">
                            Tapez pour rechercher un restaurant…
                        </p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="grid">
                        <EmptyState query={inputValue} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {results.map((r) => (
                            <RestaurantCard key={r.id} r={r} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
