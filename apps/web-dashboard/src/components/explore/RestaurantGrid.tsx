"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Search,
    Star,
    Clock,
    MapPin,
    Bike,
    ChefHat,
    ChevronDown,
    BadgeCheck,
    Sparkles,
    Utensils,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
interface MatchedProduct {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
}

interface RestaurantItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    address: string;
    city: string;
    cuisineType: string;
    priceRange: number;
    rating: number | null;
    reviewCount: number | null;
    orderCount: number | null;
    isVerified: boolean;
    isPremium: boolean;
    isSponsored: boolean;
    hasDineIn: boolean;
    matchedProducts?: MatchedProduct[];
}

// ── Config ─────────────────────────────────────────────────────────────
const CUISINE_FILTERS = [
    { id: "", label: "Tous", emoji: "🍽️" },
    { id: "camerounaise", label: "Camerounaise", emoji: "🫕" },
    { id: "african", label: "Africaine", emoji: "🌍" },
    { id: "grillades", label: "Grillades", emoji: "🔥" },
    { id: "fast-food", label: "Fast-food", emoji: "🍔" },
    { id: "pizza", label: "Pizza", emoji: "🍕" },
    { id: "patisserie", label: "Pâtisserie", emoji: "🥐" },
    { id: "poulet", label: "Poulet", emoji: "🍗" },
    { id: "poisson", label: "Poisson", emoji: "🐟" },
    { id: "chinois", label: "Chinois", emoji: "🥡" },
    { id: "libanais", label: "Libanais", emoji: "🧆" },
];

const SORT_OPTIONS = [
    { id: "recommended", label: "Recommandés" },
    { id: "rating", label: "Mieux notés" },
    { id: "orders", label: "Populaires" },
];

const DELIVERY_ESTIMATE = (orderCount: number | null) => {
    const n = orderCount ?? 0;
    return n > 500 ? "15–25 min" : n > 100 ? "20–35 min" : "30–50 min";
};

const PLACEHOLDER_GRADIENTS = [
    "from-orange-400 to-red-500",
    "from-green-400 to-emerald-500",
    "from-amber-400 to-orange-500",
    "from-purple-400 to-indigo-500",
    "from-rose-400 to-pink-500",
    "from-sky-400 to-blue-500",
    "from-teal-400 to-cyan-500",
    "from-yellow-400 to-amber-500",
];

const gradientFor = (id: string) =>
    PLACEHOLDER_GRADIENTS[id.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length];

// ── Restaurant Card ────────────────────────────────────────────────────
function RestaurantCard({ r }: { r: RestaurantItem }) {
    const time = DELIVERY_ESTIMATE(r.orderCount);
    const rating = r.rating?.toFixed(1) ?? "—";
    const reviews = r.reviewCount ?? 0;

    return (
        <Link
            href={`/r/${r.slug}`}
            className="group block bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-100 dark:border-surface-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
            {/* Cover */}
            <div className="relative h-44 overflow-hidden">
                {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={r.coverUrl}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradientFor(r.id)} flex items-center justify-center`}>
                        <span className="text-7xl font-black text-white/20 select-none">
                            {r.name.charAt(0)}
                        </span>
                    </div>
                )}
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Badges top-left */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {r.isSponsored && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow">
                            <Sparkles size={10} /> Sponsorisé
                        </span>
                    )}
                    {r.isPremium && !r.isSponsored && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full shadow">
                            ✦ Premium
                        </span>
                    )}
                    {r.hasDineIn && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/90 dark:bg-surface-900/90 text-surface-700 dark:text-surface-300 text-xs font-semibold rounded-full shadow">
                            <Utensils size={10} /> Sur place
                        </span>
                    )}
                </div>

                {/* Rating badge bottom-right */}
                <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-surface-900 rounded-full text-xs font-bold text-surface-900 dark:text-white shadow">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        {rating}
                    </span>
                </div>

                {/* Logo bottom-left */}
                {r.logoUrl && (
                    <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white dark:ring-surface-900 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.logoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-surface-900 dark:text-white text-base leading-snug">
                        {r.name}
                    </h3>
                    {r.isVerified && (
                        <BadgeCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    )}
                </div>

                <p className="text-sm text-surface-500 dark:text-surface-400 mb-2.5">
                    {r.cuisineType.charAt(0).toUpperCase() + r.cuisineType.slice(1).replace("-", " ")}
                    {" · "}{"€".repeat(Math.max(1, Math.min(r.priceRange ?? 2, 4)))}
                    {reviews > 0 && (
                        <> · <span className="text-surface-400">({reviews} avis)</span></>
                    )}
                </p>

                <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
                    <span className="flex items-center gap-1">
                        <Clock size={12} className="text-brand-500" />
                        {time}
                    </span>
                    <span className="flex items-center gap-1">
                        <Bike size={12} className="text-brand-500" />
                        Livraison
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                        <MapPin size={12} className="text-surface-400" />
                        {r.city}
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ── Matched Products Strip ─────────────────────────────────────────────
function MatchedProductsStrip({ products, restaurantSlug }: { products: MatchedProduct[]; restaurantSlug: string }) {
    return (
        <div className="mt-2 space-y-1.5">
            {products.map((p) => (
                <Link
                    key={p.id}
                    href={`/r/${restaurantSlug}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 hover:border-brand-400 hover:shadow-sm transition-all group"
                >
                    {/* Product image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-800">
                        {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-surface-300 dark:text-surface-600 text-xl">🍽️</div>
                        )}
                    </div>

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                            {p.price.toLocaleString("fr-FR")} FCFA
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ── RestaurantGrid ─────────────────────────────────────────────────────
export function RestaurantGrid() {
    const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deferredSearch, setDeferredSearch] = useState("");
    const [cuisine, setCuisine] = useState("");
    const [sort, setSort] = useState("recommended");
    const [sortOpen, setSortOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDeferredSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (deferredSearch) params.set("q", deferredSearch);
            if (cuisine) params.set("cuisine", cuisine);
            if (sort) params.set("sort", sort);
            const res = await fetch(`/api/stores?${params}`);
            if (res.ok) {
                const data = await res.json();
                setRestaurants(data.restaurants ?? []);
            }
        } catch {
            // keep previous state
        } finally {
            setLoading(false);
        }
    }, [deferredSearch, cuisine, sort]);

    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    const sortLabel = SORT_OPTIONS.find((s) => s.id === sort)?.label ?? "Recommandés";

    return (
        <div>
            {/* ── Hero search bar ──────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-white mb-2">
                    Commandez maintenant
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mb-6">
                    Les meilleurs restaurants du Cameroun, livrés chez vous.
                </p>
                <div className="relative max-w-xl">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Rechercher un restaurant, une cuisine…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* ── Cuisine type scrollable icons ────────────────────── */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
                {CUISINE_FILTERS.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setCuisine(c.id)}
                        className={`shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all border ${
                            cuisine === c.id
                                ? "bg-surface-900 dark:bg-white border-surface-900 dark:border-white text-white dark:text-surface-900"
                                : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400 dark:hover:border-surface-500"
                        }`}
                    >
                        <span className="text-2xl leading-none">{c.emoji}</span>
                        <span className="text-xs font-medium whitespace-nowrap">{c.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Toolbar: count + sort ────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                    {loading ? (
                        <span className="inline-block w-20 h-4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />
                    ) : (
                        <><span className="font-bold text-surface-900 dark:text-white">{restaurants.length}</span> restaurant{restaurants.length !== 1 ? "s" : ""}</>
                    )}
                </p>

                {/* Sort dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setSortOpen((o) => !o)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-surface-400 transition-colors"
                    >
                        {sortLabel}
                        <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                    </button>
                    {sortOpen && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl z-10 overflow-hidden">
                            {SORT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setSort(opt.id); setSortOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                        sort === opt.id
                                            ? "bg-surface-50 dark:bg-surface-800 font-semibold text-surface-900 dark:text-white"
                                            : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Grid ─────────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-100 dark:border-surface-800 animate-pulse">
                            <div className="h-44 bg-surface-100 dark:bg-surface-800" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded-full w-3/4" />
                                <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full w-1/2" />
                                <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : restaurants.length === 0 ? (
                <div className="text-center py-24">
                    <ChefHat size={52} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                    <p className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-1">
                        Aucun restaurant trouvé
                    </p>
                    <p className="text-surface-400 text-sm mb-6">
                        Essayez une autre recherche ou catégorie.
                    </p>
                    <button
                        onClick={() => { setSearch(""); setCuisine(""); }}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm transition-colors"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {restaurants.map((r) => (
                        <div key={r.id}>
                            <RestaurantCard r={r} />
                            {deferredSearch && r.matchedProducts && r.matchedProducts.length > 0 && (
                                <MatchedProductsStrip products={r.matchedProducts} restaurantSlug={r.slug} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
