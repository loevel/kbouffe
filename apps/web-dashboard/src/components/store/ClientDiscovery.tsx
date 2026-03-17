"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    Search, 
    Star, 
    ChevronLeft, 
    ChevronRight, 
    ChefHat, 
    ShoppingBag, 
    Ticket, 
    Heart,
    Filter,
    ArrowRight,
    SearchX
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "@/contexts/cart-context";
import { useSearchStore, usePreferencesStore } from "@/store/client-store";

// ── Types & Constants ────────────────────────────────────────────────────────
interface RestaurantItem {
    id: string;
    slug: string;
    name: string;
    cuisineType: string;
    city: string;
    rating?: number | null;
    reviewCount?: number | null;
    coverUrl?: string | null;
    isPremium?: boolean;
    isSponsored?: boolean;
    orderCount?: number | null;
}

const CUISINE_FILTERS = [
    { label: "Burgers", value: "fast-food", icon: "🍔" },
    { label: "Pizza", value: "pizza", icon: "🍕" },
    { label: "Africain", value: "african", icon: "🥘" },
    { label: "Poulet", value: "poulet", icon: "🍗" },
    { label: "Grillades", value: "grillades", icon: "🔥" },
    { label: "Desserts", value: "patisserie", icon: "🍰" },
];

const WEB_PROMOS = [
    {
        id: "p1",
        title: "VOS PLATS PRÉFÉRÉS",
        subtitle: "Livrés chez vous en un temps record.",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000",
        color: "from-brand-600 to-brand-900",
        cta: "Commander maintenant",
        target: "/stores/search"
    },
    {
        id: "p2",
        title: "-50% SUR TOUT LE MENU",
        subtitle: "Chez Grill Master ce weekend seulement.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000",
        color: "from-amber-600 to-amber-900",
        cta: "Voir l'offre",
        target: "/r/grill-master"
    }
];

const gradientFor = (id: string) => {
    const p = ["from-brand-400 to-brand-600", "from-amber-400 to-amber-600", "from-rose-400 to-rose-600", "from-emerald-400 to-emerald-600"];
    return p[id ? id.length % p.length : 0];
};

// ── Feature: Hero Promos ───────────────────────────────────────────────────
function PromoCarousel() {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const reduceMotion = useReducedMotion();

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setIndex((prev) => (prev + newDirection + WEB_PROMOS.length) % WEB_PROMOS.length);
    };

    useEffect(() => {
        const timer = setInterval(() => paginate(1), 8000);
        return () => clearInterval(timer);
    }, [index]);

    const promo = WEB_PROMOS[index];

    return (
        <div className="relative h-[420px] sm:h-[480px] w-full rounded-[2.5rem] overflow-hidden group shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)]">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={index}
                    custom={direction}
                    variants={
                        reduceMotion
                            ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
                            : {
                                  enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
                                  center: { x: 0, opacity: 1 },
                                  exit: (direction: number) => ({ x: direction < 0 ? "100%" : "-100%", opacity: 0 })
                              }
                    }
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={
                        reduceMotion
                            ? { opacity: { duration: 0.25 } }
                            : { x: { type: "spring", stiffness: 200, damping: 25 }, opacity: { duration: 0.3 } }
                    }
                    className="absolute inset-0 flex"
                >
                    <div className="relative w-full h-full flex items-center">
                        <div className="absolute inset-0 z-0">
                            <img 
                                src={promo.image} 
                                alt="" 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-r ${promo.color} mix-blend-multiply opacity-50`} />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />
                        </div>

                        <div className="relative z-10 p-12 md:p-20 w-full md:w-3/4 lg:w-1/2">
                            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
                                <span className="inline-block px-5 py-2 rounded-full bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-2xl shadow-brand-500/40">
                                    Offre Exceptionnelle
                                </span>
                                <h3 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-2xl">
                                    {promo.title}
                                </h3>
                                <p className="text-brand-50 text-xl md:text-2xl font-medium mb-10 drop-shadow-lg max-w-sm opacity-90">
                                    {promo.subtitle}
                                </p>
                                <Link
                                    href={promo.target}
                                    className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl bg-white text-brand-700 font-black text-xl hover:bg-brand-50 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
                                >
                                    {promo.cta}
                                    <ArrowRight size={24} />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-10 left-12 z-20 flex gap-4">
                {WEB_PROMOS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                        className={`transition-all duration-700 rounded-full h-2.5 ${i === index ? "bg-white w-16" : "bg-white/20 w-2.5 hover:bg-white/40"}`}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Restaurant tile (Premium Glassmorphic Redesign) ───────────────────────────────────────────
function RestaurantTile({ r, promoLabel }: { r: RestaurantItem; promoLabel?: string }) {
    const rating = r.rating?.toFixed(1) ?? "4.2";
    const reviews = r.reviewCount ?? 0;
    const eta = (r.orderCount ?? 0) > 300 ? "15-20 min" : "25-35 min";

    const { preferences, updatePreferences } = usePreferencesStore();
    const favorites = preferences.favoriteRestaurants || [];
    const isFavorite = favorites.includes(r.slug);

    const toggleFavorite = (ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        updatePreferences({
            favoriteRestaurants: isFavorite
                ? favorites.filter((f) => f !== r.slug)
                : [...favorites, r.slug],
        });
    };

    return (
        <Link href={`/r/${r.slug}`} className="group block w-full">
            <div className="relative aspect-[16/11] sm:aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-6 border border-surface-100 dark:border-white/5 shadow-sm group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] dark:group-hover:shadow-[0_40px_80px_-20px_rgba(255,255,255,0.06)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                {r.coverUrl ? (
                    <div className="w-full h-full relative overflow-hidden">
                        <img 
                            src={r.coverUrl} 
                            alt={r.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
                    </div>
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradientFor(r.id)} flex items-center justify-center`}>
                        <span className="text-7xl font-black text-white/20 select-none">{r.name.charAt(0)}</span>
                    </div>
                )}

                <div className="absolute inset-x-5 bottom-5 flex items-center justify-between pointer-events-none">
                    <div className="backdrop-blur-2xl bg-white/90 dark:bg-black/60 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/50 dark:border-white/10">
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-black dark:text-white">{rating}</span>
                        <span className="text-[11px] text-surface-500 dark:text-surface-400 font-bold">({reviews})</span>
                    </div>
                    <div className="backdrop-blur-2xl bg-black/40 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10">
                        <span className="text-[11px] font-black uppercase tracking-widest">{eta}</span>
                    </div>
                </div>

                {promoLabel && (
                    <div className="absolute top-5 left-5 bg-brand-500 text-white text-[11px] font-black px-4 py-2.5 rounded-xl shadow-2xl shadow-brand-500/40 flex items-center gap-2">
                        <Ticket size={16} />
                        {promoLabel.toUpperCase()}
                    </div>
                )}
                
                <button
                    onClick={toggleFavorite}
                    className={`absolute top-5 right-5 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-2xl transition-all duration-500 ${
                        isFavorite
                            ? "bg-rose-500 text-white shadow-2xl shadow-rose-500/40 border-rose-400"
                            : "bg-white/20 text-white border border-white/30 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                    }`}
                >
                    <Heart size={22} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "animate-pulse" : ""} />
                </button>
            </div>
            
            <div className="px-3">
                <h3 className="text-2xl font-black text-surface-900 dark:text-white truncate leading-tight mb-2">{r.name}</h3>
                <div className="flex items-center gap-3 text-xs font-bold text-surface-500 dark:text-surface-400">
                    <span className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-xl uppercase tracking-wider">{r.cuisineType || 'Cuisine'}</span>
                    <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
                    <span className="text-brand-600 dark:text-brand-400 font-black">LIVRAISON OFFERTE</span>
                </div>
            </div>
        </Link>
    );
}

// ── Row skeleton ──────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <div className="mb-20">
            <div className="w-64 h-10 bg-surface-100 dark:bg-surface-800 rounded-2xl mb-10 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-[4/3] bg-surface-100 dark:bg-surface-800 rounded-[2.5rem] mb-6" />
                        <div className="w-2/3 h-6 bg-surface-100 dark:bg-surface-800 rounded-xl mb-3" />
                        <div className="w-1/2 h-5 bg-surface-100 dark:bg-surface-800 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function RestaurantsRow({ title, items, withPromo }: { title: string; items: RestaurantItem[]; withPromo?: boolean }) {
    if (items.length === 0) return null;
    return (
        <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-4xl font-black tracking-tight text-surface-900 dark:text-white uppercase italic">{title}</h2>
                <Link href="/stores/search" className="group text-sm font-black text-brand-600 dark:text-brand-400 flex items-center gap-3 hover:translate-x-1 transition-all">
                    DÉCOUVRIR TOUT <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all"><ArrowRight size={18} /></div>
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {items.map((r, i) => (
                    <motion.div 
                        key={r.id} 
                        initial={{ opacity: 0, y: 40 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                    >
                        <RestaurantTile r={r} promoLabel={withPromo && i === 0 ? "Offre spéciale" : undefined} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export function ClientDiscovery() {
    const router = useRouter();
    const { filters, updateFilters } = useSearchStore();
    const { itemCount } = useCart();
    const reduceMotion = useReducedMotion();
    
    const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");

    const selectedCuisine = filters.cuisineTypes?.[0] ?? "";

    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.city) params.set("city", filters.city);
            if (filters.cuisineTypes?.length) params.set("cuisine", filters.cuisineTypes[0]);
            if (filters.sortBy) params.set("sort", filters.sortBy);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`/api/stores?${params}`, { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) {
                throw new Error(`Erreur ${res.status}`);
            }

            const data = await res.json();
            setRestaurants(data.restaurants ?? []);
        } catch (e) {
            console.error("Discovery fetch failed", e);
            setError("Impossible de charger les restaurants. Vérifiez votre connexion et réessayez.");
        } finally {
            setLoading(false);
        }
    }, [filters.city, filters.cuisineTypes, filters.sortBy]);

    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchInput.trim();
        router.push(`/stores/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    };

    const featured   = useMemo(() => restaurants.filter((r) => r.isSponsored || r.isPremium).slice(0, 4), [restaurants]);
    const topRated   = useMemo(() => [...restaurants].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4), [restaurants]);
    const allOthers  = useMemo(() => restaurants.filter(r => !featured.find(f => f.id === r.id)).slice(0, 8), [restaurants, featured]);

    const displayFeatured = featured.length >= 2 ? featured : restaurants.slice(0, 4);
    const displayTop      = topRated;
    const displayOthers   = allOthers.length ? allOthers : restaurants.slice(4, 12);

    return (
        <div className="min-h-full bg-white dark:bg-surface-950 overflow-x-hidden pt-4 sm:pt-0" aria-live="polite">
            {/* ── Impact Hero Section ────────────────────────────────────────── */}
            <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 py-14 sm:py-20 mb-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 -left-1/4 w-[60%] h-[60%] bg-brand-500/[0.07] blur-[160px] rounded-full animate-pulse" />
                    <div className="absolute bottom-0 -right-1/4 w-[60%] h-[60%] bg-amber-500/[0.07] blur-[160px] rounded-full animate-pulse transition-all duration-3000" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    <motion.div initial={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold leading-[0.92] tracking-tight text-surface-900 dark:text-white mb-10 uppercase">
                            GOÛTEZ À<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-500 via-brand-600 to-amber-600">L'EXCELLENCE</span><br />
                            LOCALE.
                        </h1>
                    </motion.div>
                    
                    <div className="relative max-w-4xl mx-auto mb-16">
                        <motion.form 
                            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            onSubmit={handleSearchSubmit} 
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-amber-600 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition-all duration-500 -z-10" />
                            <Search size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none group-focus-within:text-brand-500 transition-colors" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                type="search"
                                placeholder="Quel délice recherchez-vous ?..."
                                className="w-full h-20 pl-16 pr-44 rounded-[2.5rem] bg-white dark:bg-surface-900 border border-surface-200/60 dark:border-surface-800/60 focus:border-brand-500/40 text-lg font-bold text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-base font-bold rounded-[2rem] shadow-xl shadow-brand-500/20 transition-all flex items-center gap-2.5"
                            >
                                <ShoppingBag size={18} /> Explorer
                            </button>
                        </motion.form>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-10 text-[13px] text-surface-400 dark:text-surface-500 font-bold uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-3 group cursor-default">
                             <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-white/5 text-brand-500 flex items-center justify-center shadow-sm border border-surface-100 dark:border-white/5 transition-all group-hover:scale-110">
                                <Star size={20} fill="currentColor" />
                             </div>
                             <span className="group-hover:text-surface-600 dark:group-hover:text-surface-300 transition-colors">Premium Only</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-default">
                             <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-white/5 text-amber-500 flex items-center justify-center shadow-sm border border-surface-100 dark:border-white/5 transition-all group-hover:scale-110">
                                <ShoppingBag size={20} fill="currentColor" />
                             </div>
                             <span className="group-hover:text-surface-600 dark:group-hover:text-surface-300 transition-colors">+100 Saveurs</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-20">
                <div className="flex items-center justify-between mb-12 px-3">
                    <h2 className="text-4xl font-black tracking-tight text-surface-900 dark:text-white uppercase italic">OFFRES EXCLUSIVES</h2>
                </div>
                <PromoCarousel />
            </div>

            <div className="mb-20">
                <div className="flex items-center justify-between mb-12 px-3">
                    <h2 className="text-4xl font-black tracking-tight text-surface-900 dark:text-white uppercase italic">EXPLORER PAR CUISINE</h2>
                </div>
                <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pb-8 -mx-1 px-1">
                    <div className="hidden sm:block text-xs uppercase tracking-widest text-surface-400 font-bold mr-2">Glisser →</div>
                    <button
                        onClick={() => updateFilters({ cuisineTypes: [] })}
                        className={`shrink-0 flex flex-col items-center justify-center gap-5 w-40 h-40 rounded-[3rem] border-3 transition-all duration-500 font-black text-xs uppercase tracking-widest ${
                            selectedCuisine === ""
                                ? "bg-brand-500 border-brand-500 text-white shadow-2xl shadow-brand-500/40 scale-110"
                                : "bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800 text-surface-500 hover:border-brand-500/30 hover:shadow-2xl"
                        }`}
                    >
                        <div className="text-5xl">🥙</div>
                        TOUTE LA CARTE
                    </button>
                    {CUISINE_FILTERS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => updateFilters({ cuisineTypes: selectedCuisine === c.value ? [] : [c.value] })}
                            className={`shrink-0 flex flex-col items-center justify-center gap-3 w-28 h-28 rounded-[2rem] border-2 transition-all duration-300 font-black text-xs uppercase tracking-widest ${
                                selectedCuisine === c.value
                                    ? "bg-brand-500 border-brand-500 text-white shadow-xl shadow-brand-500/30 scale-105"
                                    : "bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800 text-surface-500 hover:border-brand-500/30"
                            }`}
                        >
                            <div className="text-3xl">{c.icon}</div>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Dynamic Layout Sections ────────────────────────────────────── */}
            <div className="space-y-16">
                {loading ? (
                    <>
                        <SkeletonRow />
                        <SkeletonRow />
                    </>
                ) : error ? (
                    <div className="text-center py-24 bg-rose-50 dark:bg-rose-500/5 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/40">
                        <SearchX size={56} className="mx-auto text-rose-500 dark:text-rose-300 mb-4" />
                        <p className="text-rose-700 dark:text-rose-200 font-bold text-lg mb-4">{error}</p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => fetchRestaurants()}
                                className="px-6 py-3 rounded-full bg-brand-500 text-white font-bold hover:bg-brand-600 transition-all"
                            >
                                Réessayer
                            </button>
                            <button
                                onClick={() => updateFilters({ cuisineTypes: [], sortBy: "recommended", city: "" })}
                                className="px-6 py-3 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-bold hover:border-brand-400 transition-all"
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center py-32 bg-surface-50 dark:bg-surface-900/40 rounded-[3rem] border-2 border-dashed border-surface-200 dark:border-surface-800">
                        <ChefHat size={64} className="mx-auto text-surface-200 dark:text-surface-700 mb-6" />
                        <p className="text-surface-600 dark:text-surface-400 text-xl font-black">Aucun restaurant trouvé dans cette zone</p>
                        <button
                            onClick={() => updateFilters({ cuisineTypes: [], sortBy: "recommended" })}
                            className="mt-6 px-8 py-3 bg-white dark:bg-surface-800 border-2 border-surface-100 dark:border-surface-700 rounded-full text-brand-600 dark:text-brand-400 font-black hover:scale-105 transition-all shadow-sm"
                        >
                            Voir tous les restaurants
                        </button>
                    </div>
                ) : (
                    <>
                        <RestaurantsRow title="👑 LES INCONTOURNABLES" items={displayFeatured} withPromo />
                        <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 py-24 bg-brand-500/[0.03] dark:bg-brand-500/[0.01]">
                             <RestaurantsRow title="⭐ LES MIEUX NOTÉS" items={displayTop} />
                        </div>
                        <RestaurantsRow title="💎 À DÉCOUVRIR" items={displayOthers} />
                    </>
                )}
            </div>

            {itemCount > 0 && (
                <div className="fixed bottom-10 right-10 lg:hidden z-50">
                    <Link
                        href="/stores/cart"
                        className="relative w-20 h-20 rounded-[2.5rem] bg-brand-500 text-white inline-flex items-center justify-center shadow-[0_24px_48px_-8px_rgba(249,115,22,0.5)] hover:bg-brand-600 transition-all hover:scale-110 active:scale-95 group"
                    >
                        <ShoppingBag size={32} className="group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-3 -right-3 w-10 h-10 bg-white text-brand-600 text-lg font-black rounded-full flex items-center justify-center shadow-2xl border-4 border-brand-500">
                            {itemCount > 9 ? "9+" : itemCount}
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}
