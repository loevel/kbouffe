"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Star,
    ChevronLeft,
    ChevronRight,
    Heart,
    Clock,
    ShoppingBag,
    ChevronDown,
    Ticket,
    SlidersHorizontal,
    ChefHat,
    SearchX,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useSearchStore, usePreferencesStore } from "@/store/client-store";

// ── Types ────────────────────────────────────────────────────────────────────
interface HomepageSection {
    id: string;
    title: string;
    subtitle: string | null;
    type: "auto" | "manual" | "seasonal";
    display_style: "cards" | "circles";
    sort_order: number;
    restaurants: RestaurantItem[];
}

interface RestaurantItem {
    id: string;
    slug: string;
    name: string;
    cuisineType: string;
    city: string;
    rating?: number | null;
    reviewCount?: number | null;
    coverUrl?: string | null;
    logoUrl?: string | null;
    isPremium?: boolean;
    isSponsored?: boolean;
    orderCount?: number | null;
}

interface CuisineCategory {
    id: string;
    label: string;
    value: string;
    icon: string;
    sort_order: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const PROMO_CARDS = [
    {
        id: "p1",
        title: "Commandez des ingrédients pour un délicieux brunch",
        sub: "Des fruits frais et plus",
        cta: "Faire l'épicerie",
        target: "/stores/search",
        bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
        textClass: "text-surface-900 dark:text-white",
        subClass: "text-surface-500 dark:text-surface-400",
        ctaClass: "bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700",
    },
    {
        id: "p2",
        title: "Économisez 20% avec l'abonnement KBouffe+",
        sub: "Profitez de vos avantages à petit prix !",
        cta: "Réclamer l'offre",
        target: "/stores/search",
        bgClass: "bg-amber-700",
        textClass: "text-white",
        subClass: "text-amber-100",
        ctaClass: "bg-white text-amber-700 border border-transparent",
    },
    {
        id: "p3",
        title: "Recevez 1000F de réduction en invitant vos amis",
        sub: null,
        cta: "Inviter pour gagner",
        target: "/stores/search",
        bgClass: "bg-amber-400",
        textClass: "text-surface-900",
        subClass: "text-amber-800",
        ctaClass: "bg-white text-amber-700 border border-transparent",
    },
];

const FILTER_CHIPS = [
    { id: "offers", label: "Offres" },
    { id: "free_delivery", label: "Livraison gratuite" },
    { id: "fast", label: "Moins de 30 min" },
    { id: "premium", label: "La crème de la crème" },
];

const gradientFor = (id: string) => {
    const p = ["from-brand-400 to-brand-600", "from-amber-400 to-amber-600", "from-rose-400 to-rose-600", "from-emerald-400 to-emerald-600"];
    return p[id ? id.length % p.length : 0];
};


// ── Category Strip ───────────────────────────────────────────────────────────
function CategoryStrip({
    categories,
    selectedCuisine,
    onSelect,
}: {
    categories: CuisineCategory[];
    selectedCuisine: string;
    onSelect: (value: string) => void;
}) {
    return (
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-4">
            <button
                onClick={() => onSelect("")}
                className={`shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border transition-all ${
                    selectedCuisine === ""
                        ? "bg-surface-900 dark:bg-white border-surface-900 dark:border-white text-white dark:text-surface-900"
                        : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                }`}
            >
                <span className="text-2xl leading-none">🍽️</span>
                <span className="text-[11px] font-medium whitespace-nowrap">Tout</span>
            </button>
            {categories.map((c) => (
                <button
                    key={c.value}
                    onClick={() => onSelect(selectedCuisine === c.value ? "" : c.value)}
                    className={`shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border transition-all ${
                        selectedCuisine === c.value
                            ? "bg-surface-900 dark:bg-white border-surface-900 dark:border-white text-white dark:text-surface-900"
                            : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                    }`}
                >
                    <span className="text-2xl leading-none">{c.icon}</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">{c.label}</span>
                </button>
            ))}
        </div>
    );
}

// ── Filter Chips ─────────────────────────────────────────────────────────────
function FilterChips({
    activeFilters,
    onToggle,
    sortBy,
    onSort,
}: {
    activeFilters: string[];
    onToggle: (id: string) => void;
    sortBy: string;
    onSort: (s: string) => void;
}) {
    const [sortOpen, setSortOpen] = useState(false);

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6">
            {FILTER_CHIPS.map((chip) => (
                <button
                    key={chip.id}
                    onClick={() => onToggle(chip.id)}
                    className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        activeFilters.includes(chip.id)
                            ? "bg-surface-900 dark:bg-white border-surface-900 dark:border-white text-white dark:text-surface-900"
                            : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-surface-400"
                    }`}
                >
                    {chip.label}
                </button>
            ))}

            <div className="relative shrink-0">
                <button
                    onClick={() => setSortOpen((o) => !o)}
                    className="flex items-center gap-1 px-4 py-2 rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-surface-400 transition-colors"
                >
                    Note{" "}
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {sortOpen && (
                    <div className="absolute top-full mt-1 left-0 w-44 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-20 overflow-hidden">
                        {[
                            { id: "rating", label: "Mieux notés" },
                            { id: "recommended", label: "Recommandés" },
                            { id: "orders", label: "Populaires" },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    onSort(opt.id);
                                    setSortOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                    sortBy === opt.id
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

            <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-surface-400 transition-colors">
                <SlidersHorizontal size={14} /> Trier
            </button>
        </div>
    );
}

// ── Promo Carousel ───────────────────────────────────────────────────────────
function PromoCarousel() {
    const [index, setIndex] = useState(0);
    const total = PROMO_CARDS.length;

    useEffect(() => {
        const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
        return () => clearInterval(t);
    }, [total]);

    const prev = () => setIndex((i) => (i - 1 + total) % total);
    const next = () => setIndex((i) => (i + 1) % total);

    return (
        <div className="relative mb-6 group">
            {/* Track */}
            <div className="overflow-hidden rounded-2xl">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {PROMO_CARDS.map((card) => (
                        <Link
                            key={card.id}
                            href={card.target}
                            className={`shrink-0 w-full flex flex-col justify-between p-6 min-h-[160px] ${card.bgClass}`}
                        >
                            <div>
                                <p className={`font-bold text-base leading-snug mb-1 ${card.textClass}`}>
                                    {card.title}
                                </p>
                                {card.sub && (
                                    <p className={`text-sm ${card.subClass}`}>{card.sub}</p>
                                )}
                            </div>
                            <div className="mt-4">
                                <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold ${card.ctaClass}`}>
                                    {card.cta}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Arrows */}
            <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-surface-900/90 border border-surface-200 dark:border-surface-700 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronLeft size={16} />
            </button>
            <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-surface-900/90 border border-surface-200 dark:border-surface-700 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronRight size={16} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {PROMO_CARDS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`rounded-full transition-all duration-300 h-1.5 ${
                            i === index ? "bg-white w-5" : "bg-white/50 w-1.5"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Compact Restaurant Card (for horizontal rows) ────────────────────────────
function RestaurantCard({ r }: { r: RestaurantItem }) {
    const { preferences, updatePreferences } = usePreferencesStore();
    const favorites = preferences.favoriteRestaurants || [];
    const isFavorite = favorites.includes(r.slug);
    const eta = (r.orderCount ?? 0) > 300 ? "15-20 min" : "25-35 min";
    const reviews = r.reviewCount ? `(${r.reviewCount > 999 ? `${Math.floor(r.reviewCount / 100) / 10}k` : r.reviewCount}+)` : "";

    const toggleFavorite = async (ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        try {
            if (isFavorite) {
                await fetch(`/api/auth/favorites/${r.id}`, { method: "DELETE" });
            } else {
                await fetch("/api/auth/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ restaurantId: r.id }),
                });
            }
            updatePreferences({
                favoriteRestaurants: isFavorite
                    ? favorites.filter((f) => f !== r.slug)
                    : [...favorites, r.slug],
            });
        } catch {
            // silent
        }
    };

    return (
        <Link href={`/r/${r.slug}`} className="group block w-52 shrink-0">
            <div className="relative h-36 rounded-2xl overflow-hidden mb-3 bg-surface-100 dark:bg-surface-800">
                {r.coverUrl ? (
                    <img
                        src={r.coverUrl}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradientFor(r.id)} flex items-center justify-center`}>
                        <span className="text-5xl font-black text-white/20 select-none">{r.name.charAt(0)}</span>
                    </div>
                )}

                {/* Promo badge */}
                {r.isSponsored && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full max-w-[70%] truncate">
                        <Ticket size={10} className="shrink-0" /> Meilleure offre · Achetez-en 1, rec...
                    </div>
                )}

                {/* Heart — always visible */}
                <button
                    onClick={toggleFavorite}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isFavorite
                            ? "bg-white text-rose-500"
                            : "bg-white/80 dark:bg-surface-900/80 text-surface-400 hover:text-rose-400"
                    }`}
                    aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                    <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
                </button>
            </div>

            <h3 className="font-bold text-sm text-surface-900 dark:text-white truncate mb-0.5">{r.name}</h3>

            {/* Rating · eta compact */}
            <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400 mb-0.5">
                <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-semibold text-surface-700 dark:text-surface-300">{r.rating?.toFixed(1) ?? "4.2"}</span>
                {reviews && <span>{reviews}</span>}
                <span>·</span>
                <span>{eta}</span>
            </div>

            {/* Delivery fee */}
            <p className="text-xs text-surface-500 dark:text-surface-400">
                Frais de livraison à 1 500 FCFA
            </p>
        </Link>
    );
}

// ── Nearby Circles (logo + name style) ──────────────────────────────────────
function NearbyCircles({ items, title = "À proximité" }: { items: RestaurantItem[]; title?: string }) {
    if (items.length === 0) return null;
    const rowRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: number) => rowRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-surface-900 dark:text-white">{title}</h2>
                <div className="flex items-center gap-2">
                    <Link href="/stores/search" className="text-sm font-semibold text-surface-600 dark:text-surface-400 hover:underline mr-1">
                        Afficher tout
                    </Link>
                    <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <div ref={rowRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
                {items.map((r) => (
                    <Link key={r.id} href={`/r/${r.slug}`} className="shrink-0 flex flex-col items-center gap-2 group w-20">
                        {/* Circle logo */}
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 group-hover:border-brand-400 transition-colors shadow-sm">
                            {r.logoUrl ? (
                                <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : r.coverUrl ? (
                                <img src={r.coverUrl} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${gradientFor(r.id)} flex items-center justify-center`}>
                                    <span className="text-2xl font-black text-white/80">{r.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 text-center leading-tight line-clamp-2 w-full">{r.name}</span>
                        <span className="text-[10px] text-surface-400">Planifier</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ── Horizontal Section ───────────────────────────────────────────────────────
function HorizontalSection({ title, subtitle, items }: { title: string; subtitle?: string | null; items: RestaurantItem[] }) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: number) => {
        rowRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
    };

    if (items.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-surface-900 dark:text-white">{title}</h2>
                    {subtitle && <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/stores/search"
                        className="text-sm font-semibold text-surface-600 dark:text-surface-400 hover:underline mr-1"
                    >
                        Afficher tout
                    </Link>
                    <button
                        onClick={() => scroll(-1)}
                        className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <div
                ref={rowRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6"
            >
                {items.map((r) => (
                    <RestaurantCard key={r.id} r={r} />
                ))}
            </div>
        </div>
    );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <div className="mb-10">
            <div className="w-48 h-6 bg-surface-100 dark:bg-surface-800 rounded-xl mb-4 animate-pulse" />
            <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-52 shrink-0 animate-pulse">
                        <div className="h-36 bg-surface-100 dark:bg-surface-800 rounded-2xl mb-3" />
                        <div className="w-3/4 h-4 bg-surface-100 dark:bg-surface-800 rounded mb-2" />
                        <div className="w-1/2 h-3 bg-surface-100 dark:bg-surface-800 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function ClientDiscovery() {
    const router = useRouter();
    const { filters, updateFilters } = useSearchStore();
    const { itemCount } = useCart();

    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [cuisineCategories, setCuisineCategories] = useState<CuisineCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const selectedCuisine = filters.cuisineTypes?.[0] ?? "";

    useEffect(() => {
        fetch("/api/cuisine-categories")
            .then((res) => res.json())
            .then((json) => setCuisineCategories(json.data ?? []))
            .catch(() => {});
    }, []);

    const fetchSections = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.cuisineTypes?.length) params.set("cuisine", filters.cuisineTypes[0]);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`/api/homepage-sections?${params}`, { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) throw new Error(`Erreur ${res.status}`);

            const data = await res.json();
            setSections(data.sections ?? []);
        } catch (e) {
            console.error("Discovery fetch failed", e);
            setError("Impossible de charger les restaurants. Vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    }, [filters.cuisineTypes]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const toggleFilter = (id: string) => {
        setActiveFilters((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    // Client-side filter chips applied on top of server-resolved data
    const filteredSections = useMemo(() => {
        if (activeFilters.length === 0) return sections;
        return sections.map((s) => ({
            ...s,
            restaurants: s.restaurants.filter((r) => {
                if (activeFilters.includes("premium") && !r.isPremium) return false;
                if (activeFilters.includes("offers") && !r.isSponsored) return false;
                if (activeFilters.includes("fast") && (r.orderCount ?? 0) <= 300) return false;
                return true;
            }),
        })).filter((s) => s.restaurants.length > 0);
    }, [sections, activeFilters]);

    const hasResults = filteredSections.some((s) => s.restaurants.length > 0);

    return (
        <div className="min-h-full bg-white dark:bg-surface-950 overflow-x-hidden">

            {/* ── Category Icons ─────────────────────────────────────────────── */}
            <CategoryStrip
                categories={cuisineCategories}
                selectedCuisine={selectedCuisine}
                onSelect={(v) => updateFilters({ cuisineTypes: v ? [v] : [] })}
            />

            {/* ── Filter Chips ───────────────────────────────────────────────── */}
            <div className="mb-8">
                <FilterChips
                    activeFilters={activeFilters}
                    onToggle={toggleFilter}
                    sortBy={filters.sortBy ?? "recommended"}
                    onSort={(s) => updateFilters({ sortBy: s as "recommended" | "rating" | "orders" | "newest" })}
                />
            </div>

            {/* ── Promo Carousel ────────────────────────────────────────────── */}
            <PromoCarousel />

            {/* Note légale */}
            <p className="text-xs text-surface-400 dark:text-surface-600 mb-8">
                Des frais de livraison et de service sont facturés pour les commandes en plus du prix des articles.{" "}
                <Link href="/legal" className="underline hover:text-surface-600">En savoir plus</Link>
            </p>

            {/* ── Restaurant Sections ────────────────────────────────────────── */}
            {loading ? (
                <>
                    <SkeletonRow />
                    <SkeletonRow />
                </>
            ) : error ? (
                <div className="text-center py-16 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-900/40">
                    <SearchX size={48} className="mx-auto text-rose-400 mb-3" />
                    <p className="text-rose-700 dark:text-rose-300 font-semibold mb-4">{error}</p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => fetchRestaurants()}
                            className="px-5 py-2.5 rounded-full bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-all"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => updateFilters({ cuisineTypes: [], sortBy: "recommended", city: "" })}
                            className="px-5 py-2.5 rounded-full border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-semibold text-sm hover:border-brand-400 transition-all"
                        >
                            Réinitialiser les filtres
                        </button>
                    </div>
                </div>
            ) : !hasResults ? (
                <div className="text-center py-24 bg-surface-50 dark:bg-surface-900/40 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-800">
                    <ChefHat size={52} className="mx-auto text-surface-300 dark:text-surface-700 mb-4" />
                    <p className="text-surface-600 dark:text-surface-400 text-lg font-bold mb-2">
                        Aucun restaurant trouvé
                    </p>
                    <p className="text-surface-400 text-sm mb-5">Essayez une autre catégorie ou retirez un filtre.</p>
                    <button
                        onClick={() => {
                            updateFilters({ cuisineTypes: [], sortBy: "recommended" });
                            setActiveFilters([]);
                        }}
                        className="px-6 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-full text-brand-600 dark:text-brand-400 font-bold text-sm hover:scale-105 transition-all"
                    >
                        Voir tous les restaurants
                    </button>
                </div>
            ) : (
                <>
                    {filteredSections.map((section) =>
                        section.display_style === "circles" ? (
                            <NearbyCircles key={section.id} items={section.restaurants} title={section.title} />
                        ) : (
                            <HorizontalSection
                                key={section.id}
                                title={section.title}
                                subtitle={section.subtitle}
                                items={section.restaurants}
                            />
                        )
                    )}
                </>
            )}

            {/* ── Cart FAB (mobile) ──────────────────────────────────────────── */}
            {itemCount > 0 && (
                <div className="fixed bottom-10 right-10 lg:hidden z-50">
                    <Link
                        href="/stores/cart"
                        className="relative w-16 h-16 rounded-full bg-brand-500 text-white inline-flex items-center justify-center shadow-xl hover:bg-brand-600 transition-all hover:scale-110 active:scale-95"
                    >
                        <ShoppingBag size={24} />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-brand-600 text-xs font-black rounded-full flex items-center justify-center border-2 border-brand-500">
                            {itemCount > 9 ? "9+" : itemCount}
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}
