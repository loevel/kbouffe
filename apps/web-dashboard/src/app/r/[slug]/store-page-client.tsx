"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ChefHat,
    MapPin,
    Star,
    Clock,
    Bike,
    ArrowLeft,
    ShieldCheck,
    Crown,
    Loader2,
    ShoppingBag,
    Plus,
    Info,
    CalendarClock,
    Users,
    CheckCircle2,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useCart } from "@/contexts/cart-context";
import { CartDrawer } from "@/components/store/CartDrawer";

// ── Types ──────────────────────────────────────────────────────────────
interface Restaurant {
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
    rating: number;
    reviewCount: number;
    orderCount: number;
    isVerified: boolean;
    isPremium: boolean;
    hasDineIn: boolean;
    hasReservations: boolean;
    totalTables: number;
    reservationCancelPolicy: "flexible" | "moderate" | "strict";
    reservationCancelNoticeMinutes: number;
    reservationCancellationFeeAmount: number;
}

interface Category {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    is_available: boolean;
    category_id: string | null;
    sort_order: number;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

interface StoreData {
    restaurant: Restaurant;
    categories: Category[];
    products: Product[];
    reviews: Review[];
}

const cuisineLabels: Record<string, string> = {
    african: "Cuisine Africaine",
    camerounaise: "Cuisine Camerounaise",
    "fast-food": "Fast-food",
    pizza: "Pizza",
    grillades: "Grillades & Braisé",
    patisserie: "Pâtisserie",
};

const deliveryTime = (orderCount: number) =>
    orderCount > 500 ? "15–25 min" : orderCount > 100 ? "20–35 min" : "30–50 min";

const cancellationPolicyLabels: Record<Restaurant["reservationCancelPolicy"], string> = {
    flexible: "Flexible",
    moderate: "Modérée",
    strict: "Stricte",
};

import { motion, AnimatePresence } from "framer-motion";

// ── Product Card (horizontal: text left, image right) ──────────────────
function ProductCard({
    product,
    onAdd,
}: {
    product: Product;
    onAdd: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={`group relative flex gap-5 p-5 border-b border-surface-100 dark:border-surface-800/40 last:border-0 hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-all duration-300 ${
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
                                Épuisé
                            </span>
                        )}
                    </div>

                    {product.is_available && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-500 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 text-surface-700 dark:text-surface-300 text-[12px] font-bold transition-all shadow-sm hover:shadow-md"
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
            </div>
        </motion.div>
    );
}

// ── Main component ─────────────────────────────────────────────────────
export function StorePageClient({ slug }: { slug: string }) {
    const [data, setData] = useState<StoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [reservationOpen, setReservationOpen] = useState(false);
    const [resSubmitting, setResSubmitting] = useState(false);
    const [resError, setResError] = useState<string | null>(null);
    const [resSuccess, setResSuccess] = useState<string | null>(null);
    const [resName, setResName] = useState("");
    const [resPhone, setResPhone] = useState("");
    const [resEmail, setResEmail] = useState("");
    const [resDate, setResDate] = useState("");
    const [resTime, setResTime] = useState("");
    const [resPartySize, setResPartySize] = useState(2);
    const [resSpecial, setResSpecial] = useState("");
    const { addItem, itemCount } = useCart();
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const isScrollingRef = useRef(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/store/${slug}`);
                if (!res.ok) {
                    setError(res.status === 404 ? "Restaurant introuvable" : "Erreur de chargement");
                    return;
                }
                const json: StoreData = await res.json();
                setData(json);
                if (json.categories.length > 0) setActiveCategory(json.categories[0].id);
            } catch {
                setError("Impossible de charger le restaurant");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    useEffect(() => {
        if (!data?.categories.length) return;
        const observers: IntersectionObserver[] = [];
        data.categories.forEach((cat) => {
            const el = sectionRefs.current[cat.id];
            if (!el) return;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !isScrollingRef.current) {
                        setActiveCategory(cat.id);
                    }
                },
                { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
            );
            observer.observe(el);
            observers.push(observer);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, [data]);

    const scrollToCategory = useCallback((catId: string) => {
        const el = sectionRefs.current[catId];
        if (!el) return;
        isScrollingRef.current = true;
        setActiveCategory(catId);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { isScrollingRef.current = false; }, 800);
    }, []);

    const minReservationDate = new Date().toISOString().split("T")[0];

    const submitReservation = useCallback(async (restaurantSlug: string) => {
        setResError(null);
        setResSuccess(null);

        if (!resName.trim()) {
            setResError("Nom requis pour la réservation.");
            return;
        }
        if (!resDate) {
            setResError("Sélectionnez une date.");
            return;
        }
        if (!resTime) {
            setResError("Sélectionnez une heure.");
            return;
        }

        setResSubmitting(true);
        try {
            const response = await fetch(`/api/store/${restaurantSlug}/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: resName.trim(),
                    customerPhone: resPhone.trim() || undefined,
                    customerEmail: resEmail.trim() || undefined,
                    partySize: resPartySize,
                    date: resDate,
                    time: resTime,
                    specialRequests: resSpecial.trim() || undefined,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                setResError(payload.error ?? "Impossible de créer la réservation.");
                return;
            }

            setResSuccess(`Réservation confirmée (ref: ${payload.reservation?.id?.slice(-6) ?? "N/A"}).`);
            setResSpecial("");
        } catch {
            setResError("Erreur réseau pendant la réservation.");
        } finally {
            setResSubmitting(false);
        }
    }, [resName, resPhone, resEmail, resPartySize, resDate, resTime, resSpecial]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col items-center justify-center gap-4 px-4">
                <ChefHat size={48} className="text-surface-300" />
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {error ?? "Restaurant introuvable"}
                </h1>
                <p className="text-surface-500 text-center max-w-md">
                    Ce restaurant n&apos;existe pas ou n&apos;est pas encore en ligne.
                </p>
                <Link
                    href="/stores"
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
                >
                    <ArrowLeft size={16} /> Explorer les restaurants
                </Link>
            </div>
        );
    }

    const { restaurant, categories, products, reviews } = data;
    const avgRating = restaurant.rating?.toFixed(1) ?? "—";

    const categoriesWithProducts = categories
        .map((cat) => ({ cat, items: products.filter((p) => p.category_id === cat.id) }))
        .filter((g) => g.items.length > 0);

    const uncategorised = products.filter(
        (p) => !p.category_id || !categories.find((c) => c.id === p.category_id),
    );

    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 font-sans">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50 transition-all">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
                    <Link href="/stores" className="group flex items-center gap-2.5 text-[13px] text-surface-600 dark:text-surface-400 hover:text-brand-500 transition-all">
                        <div className="p-1.5 rounded-lg border border-surface-200 dark:border-surface-800 group-hover:border-brand-500/30 group-hover:bg-brand-500/5 transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="hidden sm:inline font-bold uppercase tracking-wider">Explorer</span>
                    </Link>
                    
                    <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group">
                        <motion.div 
                            whileHover={{ rotate: 10 }}
                            className="bg-brand-500 text-white p-2 rounded-xl shadow-lg shadow-brand-500/20"
                        >
                            <ChefHat size={18} />
                        </motion.div>
                        <span className="font-black text-lg tracking-tight text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors">Kbouffe</span>
                    </Link>

                    <button
                        onClick={() => setCartOpen(true)}
                        className="relative w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
                        aria-label={`Panier — ${itemCount} article${itemCount !== 1 ? "s" : ""}`}
                    >
                        <ShoppingBag size={20} className="text-surface-700 dark:text-surface-300" />
                        <AnimatePresence>
                            {itemCount > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/40 ring-2 ring-white dark:ring-surface-950"
                                >
                                    {itemCount > 9 ? "9+" : itemCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </nav>

            {/* Cover */}
            <div className="relative w-full h-56 sm:h-80 bg-surface-100 dark:bg-surface-900 overflow-hidden">
                {restaurant.coverUrl ? (
                    <img src={restaurant.coverUrl} alt="" className="w-full h-full object-cover scale-105 blur-[2px] opacity-40 absolute inset-0 transform -translate-y-12" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-surface-950" />
                {restaurant.coverUrl && (
                    <motion.img 
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1 }}
                        src={restaurant.coverUrl} 
                        alt="" 
                        className="w-full h-full object-cover relative z-0" 
                    />
                )}
                {!restaurant.coverUrl && (
                    <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-brand-600/10 flex items-center justify-center">
                        <ChefHat size={80} className="text-brand-200/50" />
                    </div>
                )}
            </div>

            {/* Restaurant info */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="relative flex flex-col md:flex-row items-start gap-6 md:gap-8">
                    {/* Logo */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl shrink-0 overflow-hidden -mt-20 sm:-mt-24 ring-8 ring-white dark:ring-surface-950"
                    >
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                                <ChefHat size={40} strokeWidth={1.5} />
                            </div>
                        )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-wrap items-center gap-3"
                        >
                            <h1 className="text-3xl sm:text-4xl font-black text-surface-900 dark:text-white tracking-tight">
                                {restaurant.name}
                            </h1>
                            <div className="flex gap-1.5">
                                {restaurant.isVerified && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-blue-500/20">
                                        <ShieldCheck size={12} />
                                    </span>
                                )}
                                {restaurant.isPremium && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-500/20">
                                        <Crown size={12} />
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        <p className="text-[15px] text-surface-500 dark:text-surface-400 mt-2 font-medium">
                            {cuisineLabels[restaurant.cuisineType] ?? restaurant.cuisineType} · {restaurant.city}
                        </p>

                        {/* Horizontal Info Bar */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 py-4 border-y border-surface-100 dark:border-surface-800/60">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <Star size={16} className="text-amber-500 fill-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-surface-900 dark:text-white leading-none">{avgRating}</p>
                                    <p className="text-[11px] text-surface-400 mt-1 font-medium">{restaurant.reviewCount} avis</p>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-surface-100 dark:bg-surface-800 hidden sm:block" />

                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-brand-500/10 rounded-xl">
                                    <Clock size={16} className="text-brand-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-surface-900 dark:text-white leading-none">{deliveryTime(restaurant.orderCount)}</p>
                                    <p className="text-[11px] text-surface-400 mt-1 font-medium">Livraison</p>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-surface-100 dark:bg-surface-800 hidden sm:block" />

                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-surface-500/10 rounded-xl">
                                    <Bike size={16} className="text-surface-600 dark:text-surface-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-surface-900 dark:text-white leading-none">Disponible</p>
                                    <p className="text-[11px] text-surface-400 mt-1 font-medium">Service Coursier</p>
                                </div>
                            </div>
                        </div>

                        {restaurant.description && (
                            <p className="mt-6 text-sm text-surface-600 dark:text-surface-400 leading-relaxed max-w-2xl font-medium opacity-90">
                                {restaurant.description}
                            </p>
                        )}

                        {restaurant.hasDineIn && (
                            <div className="mt-8 overflow-hidden rounded-3xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/40 backdrop-blur-sm">
                                <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
                                            <CalendarClock size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-surface-900 dark:text-white text-base">
                                                Manger sur place
                                            </p>
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 font-medium">
                                                {restaurant.hasReservations
                                                    ? `Réservations ouvertes${restaurant.totalTables > 0 ? ` · ${restaurant.totalTables} tables disponibles` : ""}`
                                                    : "Réservations indisponibles pour le moment"}
                                            </p>
                                        </div>
                                    </div>
                                    {restaurant.hasReservations && (
                                        <button
                                            onClick={() => setReservationOpen((open) => !open)}
                                            className="px-6 py-2.5 rounded-2xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 text-sm font-bold transition-all hover:shadow-xl hover:-translate-y-0.5"
                                        >
                                            {reservationOpen ? "Annuler" : "Réserver une table"}
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {reservationOpen && restaurant.hasReservations && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-surface-200 dark:border-surface-800 overflow-hidden"
                                        >
                                            <div className="p-5 sm:p-6 space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                                                    <Info size={14} className="text-brand-500" />
                                                    <p className="text-[11px] text-surface-600 dark:text-surface-400 leading-tight font-medium">
                                                        Politique : <span className="text-surface-900 dark:text-white font-bold">{cancellationPolicyLabels[restaurant.reservationCancelPolicy ?? "flexible"]}</span>
                                                        {restaurant.reservationCancelNoticeMinutes > 0 ? ` · Gratuit jusqu'à ${restaurant.reservationCancelNoticeMinutes} min avant` : " · Annulation gratuite"}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <input
                                                        value={resName}
                                                        onChange={(e) => setResName(e.target.value)}
                                                        placeholder="Votre nom"
                                                        className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                    />
                                                    <input
                                                        value={resPhone}
                                                        onChange={(e) => setResPhone(e.target.value)}
                                                        placeholder="Téléphone"
                                                        className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                    />
                                                    <label className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm flex items-center gap-3">
                                                        <Users size={16} className="text-surface-400" />
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={20}
                                                            value={resPartySize}
                                                            onChange={(e) => setResPartySize(Math.max(1, Number(e.target.value) || 1))}
                                                            className="flex-1 bg-transparent outline-none font-bold text-surface-900 dark:text-white"
                                                        />
                                                        <span className="text-surface-400 font-medium">pers.</span>
                                                    </label>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="date"
                                                        min={minReservationDate}
                                                        value={resDate}
                                                        onChange={(e) => setResDate(e.target.value)}
                                                        className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={resTime}
                                                        onChange={(e) => setResTime(e.target.value)}
                                                        className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                    />
                                                </div>

                                                <textarea
                                                    value={resSpecial}
                                                    onChange={(e) => setResSpecial(e.target.value)}
                                                    rows={2}
                                                    placeholder="Demandes spéciales (allergies, occasion...)"
                                                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm resize-none focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                />

                                                {resError && (
                                                    <p className="text-xs text-red-500 font-bold px-1">{resError}</p>
                                                )}
                                                {resSuccess && (
                                                    <p className="text-[13px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-bold px-1">
                                                        <CheckCircle2 size={16} />
                                                        {resSuccess}
                                                    </p>
                                                )}

                                                <button
                                                    onClick={() => submitReservation(restaurant.slug)}
                                                    disabled={resSubmitting}
                                                    className="w-full h-11 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-all shadow-lg shadow-brand-500/20 disabled:opacity-60"
                                                >
                                                    {resSubmitting ? "Traitement..." : "Confirmer ma venue"}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar + Menu */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0 sm:gap-12 pb-32">
                {categoriesWithProducts.length > 1 && (
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 pt-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-6 px-1">Menu</p>
                            <nav className="space-y-1.5">
                                {categoriesWithProducts.map(({ cat }) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => scrollToCategory(cat.id)}
                                        className={`w-full text-left px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative group ${
                                            activeCategory === cat.id
                                                ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-xl shadow-surface-900/10 dark:shadow-white/5 translate-x-1"
                                                : "text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:translate-x-1"
                                        }`}
                                    >
                                        <span className="relative z-10">{cat.name}</span>
                                        {activeCategory === cat.id && (
                                            <motion.div 
                                                layoutId="cat-active"
                                                className="absolute inset-0 rounded-2xl bg-surface-900 dark:bg-white"
                                            />
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                )}

                <div className="flex-1 min-w-0 pt-6">
                    {/* Horizontal scroll for mobile/tablet */}
                    {categoriesWithProducts.length > 1 && (
                        <div className="flex lg:hidden gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide -mx-4 px-4 sticky top-[64px] z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md pt-2">
                            {categoriesWithProducts.map(({ cat }) => (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={`shrink-0 px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
                                        activeCategory === cat.id
                                            ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 border-surface-900 dark:border-white shadow-lg"
                                            : "bg-surface-50 dark:bg-surface-900 text-surface-500 dark:text-surface-400 border-surface-200 dark:border-surface-800 hover:border-surface-300"
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {categoriesWithProducts.length === 0 && uncategorised.length === 0 ? (
                        <div className="text-center py-24">
                            <ChefHat size={48} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                            <p className="text-surface-500 dark:text-surface-400">Aucun plat disponible pour le moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {categoriesWithProducts.map(({ cat, items }) => (
                                <section
                                    key={cat.id}
                                    ref={(el) => { sectionRefs.current[cat.id] = el; }}
                                    className="scroll-mt-20"
                                >
                                    <h2 className="text-lg font-extrabold text-surface-900 dark:text-white mb-0.5">
                                        {cat.name}
                                    </h2>
                                    {cat.description && (
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 flex items-center gap-1.5">
                                            <Info size={12} />{cat.description}
                                        </p>
                                    )}
                                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                                        {items.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onAdd={() => {
                                                    addItem(
                                                        { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
                                                        { id: product.id, name: product.name, price: product.price, imageUrl: product.image_url },
                                                    );
                                                    setCartOpen(true);
                                                }}
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
                                                onAdd={() => {
                                                    addItem(
                                                        { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
                                                        { id: product.id, name: product.name, price: product.price, imageUrl: product.image_url },
                                                    );
                                                    setCartOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {reviews.length > 0 && (
                        <section className="mt-12 pt-8 border-t border-surface-100 dark:border-surface-800">
                            <h2 className="text-lg font-extrabold text-surface-900 dark:text-white mb-4">
                                Avis clients <span className="ml-1 text-sm font-normal text-surface-400">({restaurant.reviewCount})</span>
                            </h2>
                            <div className="flex items-center gap-3 mb-6 p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 w-fit">
                                <span className="text-4xl font-extrabold text-surface-900 dark:text-white">{avgRating}</span>
                                <div>
                                    <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} size={16} className={i < Math.round(restaurant.rating) ? "text-amber-500 fill-amber-500" : "text-surface-200 dark:text-surface-700"} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-surface-500 mt-0.5">{restaurant.reviewCount} avis</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 p-4">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={13} className={i < review.rating ? "text-amber-500 fill-amber-500" : "text-surface-200 dark:text-surface-700"} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-surface-400">
                                                {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {itemCount > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 sm:hidden">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="flex items-center gap-3 pl-4 pr-5 py-3.5 bg-surface-900 dark:bg-white hover:bg-surface-800 dark:hover:bg-surface-100 text-white dark:text-surface-900 font-bold rounded-2xl shadow-2xl transition-colors"
                        aria-label="Voir le panier"
                    >
                        <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {itemCount > 9 ? "9+" : itemCount}
                        </span>
                        <span>Voir mon panier</span>
                        <ShoppingBag size={18} />
                    </button>
                </div>
            )}

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

            <footer className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-brand-500 text-white p-1.5 rounded-lg"><ChefHat size={16} /></div>
                        <span className="font-bold text-sm text-surface-900 dark:text-white">Kbouffe</span>
                    </Link>
                    <p className="text-xs text-surface-400">© {new Date().getFullYear()} Kbouffe. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}
