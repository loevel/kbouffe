"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    X,
    Minus,
    Send,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    ImagePlus,
    Maximize2,
    Utensils,
    Search,
    Heart,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useCart } from "@/contexts/cart-context";
import { CartDrawer } from "@/components/store/CartDrawer";
import { RestaurantGallery } from "@/components/store/RestaurantGallery";
import { createClient } from "@/lib/supabase/client";
import { TrackingPixels } from "@/components/store/TrackingPixels";
import { AnnouncementBanner } from "@/components/store/AnnouncementBanner";
import { GridTheme } from "@/components/store/themes/GridTheme";
import { LuxuryTheme } from "@/components/store/themes/LuxuryTheme";
import { StoryTheme } from "@/components/store/themes/StoryTheme";
import { trackEvent } from "@/lib/tracking";
import type { ThemeProps } from "@/components/store/themes/types";

// ── Types ──────────────────────────────────────────────────────────────
interface Announcement {
    id: string;
    message: string;
    type: "info" | "warning" | "urgent";
    color: string | null;
}

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
    corkageFeeAmount: number;
    dineInServiceFee: number;
    reservationCancelPolicy: "flexible" | "moderate" | "strict";
    reservationCancelNoticeMinutes: number;
    reservationCancellationFeeAmount: number;
    metaPixelId: string | null;
    googleAnalyticsId: string | null;
    themeLayout: "grid" | "luxury" | "story";
    primaryColor?: string;
}

interface Category {
    id: string;
    name: string;
    name_i18n?: Record<string, string>;
    description: string | null;
    description_i18n?: Record<string, string>;
    sort_order: number;
}

interface Product {
    id: string;
    name: string;
    name_i18n?: Record<string, string>;
    description: string | null;
    description_i18n?: Record<string, string>;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    images?: string[];
    is_available: boolean;
    is_featured?: boolean;
    category_id: string | null;
    sort_order: number;
    /** JSONB options stored in products.options column */
    options?: Array<{
        name: string;
        choices: Array<{ label: string; extra_price: number }>;
        required?: boolean;
    }> | null;
}

/** Retourne le texte traduit ou le fallback FR */
function t18n(i18n: Record<string, string> | undefined, fallback: string, lang: string): string {
    return i18n?.[lang] || fallback;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    created_at: string;
}

interface StoreData {
    restaurant: Restaurant;
    categories: Category[];
    products: Product[];
    featuredProducts?: Product[];
    reviews: Review[];
    announcements?: Announcement[];
}

const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_REVIEWS: Review[] = [];

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

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ── Product Card (horizontal: text left, image right) ──────────────────
function ProductCard({
    product,
    onAdd,
    onClick,
    lang = "fr",
}: {
    product: Product;
    onAdd: () => void;
    onClick: () => void;
    lang?: string;
}) {
    const displayName = t18n(product.name_i18n, product.name, lang);
    const displayDesc = product.description_i18n || product.description
        ? t18n(product.description_i18n, product.description ?? "", lang)
        : null;
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
                        {displayName}
                    </h3>
                    {displayDesc && (
                        <p className="text-[13px] text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2 leading-relaxed font-medium opacity-80">
                            {displayDesc}
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
                            className="flex items-center justify-center gap-2 px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-500 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 text-surface-700 dark:text-surface-300 text-[12px] font-bold transition-all shadow-sm hover:shadow-md"
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span>Ajouter</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-100 dark:border-surface-800 shadow-sm group-hover:shadow-md transition-shadow">
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

// ── Product Review type ──────────────────────────────────────────────
interface ProductReview {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    created_at: string;
    customerName: string;
}

interface ProductReviewStats {
    count: number;
    average: number;
}

// Module-level cache — persiste entre les ouvertures/fermetures du modal
const _reviewsCache = new Map<string, { reviews: ProductReview[]; stats: ProductReviewStats }>();

// ── Product Detail Modal ───────────────────────────────────────────────
function ProductDetailModal({
    product,
    restaurant,
    onClose,
    onAdd,
    relatedProducts = [],
    reduceMotion = false,
}: {
    product: Product;
    restaurant: { id: string; name: string; slug: string };
    onClose: () => void;
    onAdd: (selectedOptions: Record<string, string>, notes: string, finalPrice: number) => void;
    relatedProducts?: Product[];
    reduceMotion?: boolean;
}) {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [stats, setStats] = useState<ProductReviewStats>({ count: 0, average: 0 });
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    /** Selected option choices: { [optionName]: choiceLabel } */
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        // Pre-select first choice for required options
        const defaults: Record<string, string> = {};
        if (product.options) {
            for (const opt of product.options) {
                if (opt.choices.length > 0) defaults[opt.name] = opt.choices[0].label;
            }
        }
        return defaults;
    });

    // Image carousel
    const allImages = product.images && product.images.length > 0
        ? product.images
        : product.image_url ? [product.image_url] : [];
    const [activeImg, setActiveImg] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        const cached = _reviewsCache.get(product.id);
        if (cached) {
            setReviews(cached.reviews);
            setStats(cached.stats);
            setLoadingReviews(false);
            return;
        }
        const ctrl = new AbortController();
        fetch(`/api/store/products/${product.id}/reviews`, { signal: ctrl.signal })
            .then((r) => r.json())
            .then((data: { reviews?: ProductReview[]; stats?: ProductReviewStats }) => {
                const rv: ProductReview[] = data.reviews ?? [];
                const st: ProductReviewStats = data.stats ?? { count: 0, average: 0 };
                _reviewsCache.set(product.id, { reviews: rv, stats: st });
                setReviews(rv);
                setStats(st);
            })
            .catch((e) => { if ((e as Error).name !== "AbortError") console.error(e); })
            .finally(() => setLoadingReviews(false));
        return () => ctrl.abort();
    }, [product.id]);

    // Close on Escape + arrow key navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { if (fullscreen) setFullscreen(false); else onClose(); }
            if (allImages.length > 1) {
                if (e.key === "ArrowLeft") setActiveImg((prev) => (prev - 1 + allImages.length) % allImages.length);
                if (e.key === "ArrowRight") setActiveImg((prev) => (prev + 1) % allImages.length);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, fullscreen, allImages.length]);

    const handleSubmitReview = async () => {
        if (rating < 1) return;
        setSubmitError(null);
        setSubmitting(true);
        try {
            // Get auth token from Supabase session
            const supabase = createClient();
            const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
            if (!token) {
                setSubmitError("Connectez-vous pour laisser un avis.");
                return;
            }
            const res = await fetch("/api/reviews/product", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: product.id,
                    restaurantId: restaurant.id,
                    rating,
                    comment: comment.trim() || undefined,
                }),
            });
            if (res.ok) {
                setSubmitted(true);
                // Mise à jour directe du state — évite le re-fetch réseau
                const newReview: ProductReview = {
                    id: crypto.randomUUID(),
                    rating,
                    comment: comment.trim() || null,
                    response: null,
                    created_at: new Date().toISOString(),
                    customerName: "Vous",
                };
                const updatedReviews = [newReview, ...reviews];
                const updatedStats: ProductReviewStats = {
                    count: stats.count + 1,
                    average: parseFloat(
                        ((stats.average * stats.count + rating) / (stats.count + 1)).toFixed(1)
                    ),
                };
                setReviews(updatedReviews);
                setStats(updatedStats);
                _reviewsCache.set(product.id, { reviews: updatedReviews, stats: updatedStats });
            } else {
                const json = await res.json().catch((): { error?: string } => ({}));
                setSubmitError(json.error ?? "Erreur lors de l'envoi de l'avis.");
            }
        } catch {
            setSubmitError("Erreur lors de l'envoi de l'avis.");
        } finally {
            setSubmitting(false);
        }
    };

    // Compute extra price from selected options
    const optionsExtraPrice = product.options
        ? product.options.reduce((sum, opt) => {
              const choiceLabel = selectedOptions[opt.name];
              const choice = opt.choices.find((c) => c.label === choiceLabel);
              return sum + (choice?.extra_price ?? 0);
          }, 0)
        : 0;
    const finalUnitPrice = product.price + optionsExtraPrice;

    // Check if all required options are selected
    const requiredMissing = product.options
        ? product.options.filter((opt) => opt.required && !selectedOptions[opt.name])
        : [];

    return (
        <AnimatePresence>
            <motion.div
                key="modal"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
                >
                    {/* Drag handle pill — mobile bottom sheet only */}
                    <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden" aria-hidden="true">
                        <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full" />
                    </div>

                    {/* Header image carousel */}
                    <div className="relative h-56 sm:h-72 bg-surface-100 dark:bg-surface-800 shrink-0 overflow-hidden flex items-center justify-center">
                        {allImages.length > 0 ? (
                            <>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImg}
                                        initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                        src={allImages[activeImg]}
                                        alt={`${product.name} — photo ${activeImg + 1}`}
                                        className="max-w-full max-h-full object-contain cursor-zoom-in"
                                        onClick={() => setFullscreen(true)}
                                    />
                                </AnimatePresence>
                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + allImages.length) % allImages.length); }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % allImages.length); }}
                                            className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                                            {activeImg + 1} / {allImages.length}
                                        </div>
                                    </>
                                )}
                                {/* Fullscreen button */}
                                <button
                                    onClick={() => setFullscreen(true)}
                                    className="absolute bottom-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
                                    title="Plein écran"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ChefHat size={48} className="text-surface-300 dark:text-surface-600" />
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-surface-900/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-surface-800 transition-colors"
                        >
                            <X size={18} className="text-surface-700 dark:text-surface-300" />
                        </button>
                        {/* Rating badge */}
                        {stats.count > 0 && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-surface-900/90 rounded-full shadow-lg">
                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                <span className="text-sm font-bold text-surface-900 dark:text-white">{stats.average.toFixed(1)}</span>
                                <span className="text-xs text-surface-400">({stats.count})</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail strip */}
                    {allImages.length > 1 && (
                        <div className="flex gap-1.5 px-4 py-2.5 bg-surface-50 dark:bg-surface-800/60 border-b border-surface-100 dark:border-surface-800 overflow-x-auto shrink-0">
                            {allImages.map((src, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                        i === activeImg
                                            ? "border-brand-500 shadow-md ring-1 ring-brand-500/30"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-5 sm:p-6">
                            {/* Name + Price */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <h2 className="text-xl font-extrabold text-surface-900 dark:text-white">{product.name}</h2>
                                    {!product.is_available && (
                                        <span className="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-full font-bold uppercase mt-1 inline-block">
                                            Épuisé
                                        </span>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                                        {formatCFA(finalUnitPrice)}
                                        {optionsExtraPrice > 0 && (
                                            <span className="text-xs font-normal text-surface-400 block">
                                                base {formatCFA(product.price)} + options
                                            </span>
                                        )}
                                    </p>
                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                        <p className="text-xs text-surface-400 line-through">{formatCFA(product.compare_at_price)}</p>
                                    )}
                                </div>
                            </div>

                            {product.description && (
                                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-4">{product.description}</p>
                            )}

                            {/* ── Options / Variantes ───────────────────────────────── */}
                            {product.options && product.options.length > 0 && (
                                <div className="space-y-4 mb-5">
                                    {product.options.map((opt) => (
                                        <div key={opt.name}>
                                            <p className="text-sm font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-1.5">
                                                {opt.name}
                                                {opt.required && (
                                                    <span className="text-[10px] font-bold text-white bg-brand-500 rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                                                        Requis
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {opt.choices.map((choice) => {
                                                    const isSelected = selectedOptions[opt.name] === choice.label;
                                                    return (
                                                        <button
                                                            key={choice.label}
                                                            onClick={() =>
                                                                setSelectedOptions((prev) => ({
                                                                    ...prev,
                                                                    [opt.name]: choice.label,
                                                                }))
                                                            }
                                                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                                                                isSelected
                                                                    ? "bg-brand-500 border-brand-500 text-white shadow-sm"
                                                                    : "border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-brand-400 hover:text-brand-500"
                                                            }`}
                                                        >
                                                            {choice.label}
                                                            {choice.extra_price > 0 && (
                                                                <span className={`ml-1.5 text-xs ${isSelected ? "text-white/80" : "text-surface-400"}`}>
                                                                    +{formatCFA(choice.extra_price)}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {requiredMissing.length > 0 && (
                                        <p className="text-xs text-amber-500 font-medium">
                                            Veuillez sélectionner : {requiredMissing.map((o) => o.name).join(", ")}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Quantity + Add to cart */}
                            {product.is_available && (
                                <div className="flex items-center gap-3 mb-6 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-surface-900 dark:text-white">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-8 h-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        disabled={requiredMissing.length > 0}
                                        onClick={() => {
                                            if (requiredMissing.length > 0) return;
                                            for (let i = 0; i < quantity; i++) {
                                                onAdd(selectedOptions, note, finalUnitPrice);
                                            }
                                            onClose();
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors"
                                    >
                                        <ShoppingBag size={16} />
                                        <span>Ajouter — {formatCFA(finalUnitPrice * quantity)}</span>
                                    </button>
                                </div>
                            )}

                            {/* Special instructions */}
                            <div className="mb-5 border-t border-surface-100 dark:border-surface-800 pt-5">
                                <h3 className="text-base font-bold text-surface-900 dark:text-white mb-2">
                                    Instructions particulières
                                </h3>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ajouter une remarque"
                                    rows={3}
                                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none transition"
                                />
                                <p className="text-xs text-surface-400 mt-1.5">Des frais pourraient vous être facturés pour les ajouts.</p>
                            </div>

                            {/* Souvent achetés ensemble */}
                            {relatedProducts.length > 0 && (
                                <div className="mb-5 border-t border-surface-100 dark:border-surface-800 pt-5">
                                    <h3 className="text-base font-bold text-surface-900 dark:text-white mb-3">
                                        Souvent achetés ensemble
                                    </h3>
                                    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 overflow-visible">
                                        {(() => {
                                            const pairs: Product[][] = [];
                                            for (let i = 0; i < relatedProducts.length; i += 2) pairs.push(relatedProducts.slice(i, i + 2));
                                            return pairs.map((pair, rowIdx) => (
                                                <div
                                                    key={rowIdx}
                                                    className={`flex ${rowIdx < pairs.length - 1 ? "border-b border-surface-100 dark:border-surface-800" : ""}`}
                                                >
                                                    {pair.map((p, colIdx) => (
                                                        <div
                                                            key={p.id}
                                                            className={`flex-1 min-w-0 flex items-start gap-2.5 p-3 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors ${colIdx === 0 && pair.length === 2 ? "border-r border-surface-100 dark:border-surface-800" : ""}`}
                                                            onClick={() => { onClose(); }}
                                                        >
                                                            <div className="flex-1 min-w-0 pt-0.5">
                                                                <p className="text-[13px] font-semibold text-surface-900 dark:text-white leading-snug line-clamp-2">{p.name}</p>
                                                                <p className="text-[12px] text-surface-500 dark:text-surface-400 mt-0.5">{formatCFA(p.price)}</p>
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800">
                                                                    {p.image_url
                                                                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                                        : <div className="w-full h-full flex items-center justify-center"><ChefHat size={20} className="text-surface-300 dark:text-surface-600" /></div>
                                                                    }
                                                                </div>
                                                                {p.is_available && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onAdd({}, "", p.price); }}
                                                                        className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                                                    >
                                                                        <Plus size={14} strokeWidth={2.5} className="text-surface-900 dark:text-white" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {pair.length === 1 && <div className="flex-1" />}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Reviews section */}
                            <div className="border-t border-surface-100 dark:border-surface-800 pt-5">
                                <h3 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MessageSquare size={18} />
                                    Avis ({stats.count})
                                </h3>

                                {/* Submit a review */}
                                {!submitted ? (
                                    <div className="mb-5 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                                        <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Donner votre avis</p>
                                        <div className="flex gap-1 mb-3">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button key={s} onClick={() => setRating(s)} className="p-0.5 transition-transform hover:scale-110">
                                                    <Star
                                                        size={22}
                                                        className={s <= rating ? "text-amber-500 fill-amber-500" : "text-surface-300 dark:text-surface-600"}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Partagez votre expérience (optionnel)..."
                                            className="w-full min-h-[80px] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-2"
                                        />
                                        {submitError && (
                                            <p className="text-xs text-red-500 mb-2">{submitError}</p>
                                        )}
                                        <button
                                            onClick={handleSubmitReview}
                                            disabled={submitting}
                                            className="flex items-center gap-2 px-4 py-2 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                                        >
                                            <Send size={14} />
                                            {submitting ? "Envoi..." : "Envoyer"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Merci pour votre avis !</p>
                                    </div>
                                )}

                                {/* Reviews list */}
                                {loadingReviews ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={20} className="animate-spin text-surface-400" />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <p className="text-sm text-surface-400 text-center py-6">Aucun avis pour ce produit. Soyez le premier !</p>
                                ) : (
                                    <div className="space-y-3">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="p-3 bg-white dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-800">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-[10px] font-bold">
                                                            {review.customerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">{review.customerName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} size={12} className={i < review.rating ? "text-amber-500 fill-amber-500" : "text-surface-200 dark:text-surface-700"} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{review.comment}</p>
                                                )}
                                                {review.response && (
                                                    <div className="mt-2 pl-3 border-l-2 border-brand-500">
                                                        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-0.5">Réponse du restaurant</p>
                                                        <p className="text-sm text-surface-600 dark:text-surface-400">{review.response}</p>
                                                    </div>
                                                )}
                                                <p className="text-[11px] text-surface-400 mt-1.5">
                                                    {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Fullscreen lightbox ── */}
            {fullscreen && allImages.length > 0 && (
                <motion.div
                    key="lightbox"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
                    onClick={() => setFullscreen(false)}
                >
                    {/* Close */}
                    <button
                        onClick={() => setFullscreen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    {/* Counter */}
                    {allImages.length > 1 && (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-full">
                            {activeImg + 1} / {allImages.length}
                        </div>
                    )}

                    {/* Main image */}
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={activeImg}
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            src={allImages[activeImg]}
                            alt={`${product.name} — photo ${activeImg + 1}`}
                            className="max-w-[90vw] max-h-[80vh] object-contain select-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </AnimatePresence>

                    {/* Prev / Next */}
                    {allImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + allImages.length) % allImages.length); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % allImages.length); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </>
                    )}

                    {/* Thumbnail strip */}
                    {allImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl" onClick={(e) => e.stopPropagation()}>
                            {allImages.map((src, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        i === activeImg
                                            ? "border-white shadow-lg scale-105"
                                            : "border-transparent opacity-50 hover:opacity-80"
                                    }`}
                                >
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── Explore More Section ────────────────────────────────────────────────
interface ExploreItem {
    id: string; name: string; slug: string;
    coverUrl: string | null; logoUrl: string | null;
    cuisineType: string; rating: number | null;
    reviewCount: number | null; orderCount: number | null;
    isPremium: boolean; isSponsored: boolean;
}

const EXPLORE_GRADIENTS = [
    "from-orange-400 to-red-500", "from-green-400 to-emerald-500",
    "from-amber-400 to-orange-500", "from-purple-400 to-indigo-500",
    "from-rose-400 to-pink-500", "from-sky-400 to-blue-500",
];
const exploreGradient = (id: string) =>
    EXPLORE_GRADIENTS[id.charCodeAt(0) % EXPLORE_GRADIENTS.length];

function ExploreMoreSection({ currentId, cuisineType }: { currentId: string; cuisineType: string }) {
    const [items, setItems] = useState<ExploreItem[]>([]);
    const [liked, setLiked] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const params = new URLSearchParams({ sort: "recommended", limit: "12" });
        if (cuisineType) params.set("cuisine", cuisineType);
        fetch(`/api/stores?${params}`)
            .then((r) => r.json())
            .then((data) => {
                const others: ExploreItem[] = (data.restaurants ?? [])
                    .filter((r: ExploreItem) => r.id !== currentId)
                    .slice(0, 10);
                setItems(others);
            })
            .catch(() => {});
    }, [currentId, cuisineType]);

    if (items.length === 0) return null;

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
    };

    const toggleLike = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        setLiked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <section className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Plus à explorer</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => scroll("left")}
                            className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            <ChevronLeft size={16} className="text-surface-600 dark:text-surface-400" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            <ChevronRight size={16} className="text-surface-600 dark:text-surface-400" />
                        </button>
                    </div>
                </div>

                {/* Scrollable row */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6"
                >
                    {items.map((r) => {
                        const rating = r.rating?.toFixed(1) ?? null;
                        const eta = (r.orderCount ?? 0) > 300 ? "13 min" : (r.orderCount ?? 0) > 100 ? "28 min" : "45 min";
                        const isLiked = liked.has(r.id);

                        return (
                            <Link
                                key={r.id}
                                href={`/r/${r.slug}`}
                                className="shrink-0 w-56 group block"
                            >
                                {/* Cover */}
                                <div className="relative h-36 rounded-2xl overflow-hidden mb-2.5 bg-surface-100 dark:bg-surface-800 border border-surface-100 dark:border-surface-800">
                                    {r.coverUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={r.coverUrl}
                                            alt={r.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${exploreGradient(r.id)} flex items-center justify-center`}>
                                            <span className="text-5xl font-black text-white/20">{r.name.charAt(0)}</span>
                                        </div>
                                    )}

                                    {/* Promo badge top-left */}
                                    {r.isSponsored && (
                                        <div className="absolute top-2 left-2 max-w-[70%] bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg truncate">
                                            Meilleure offre
                                        </div>
                                    )}

                                    {/* Heart top-right */}
                                    <button
                                        onClick={(e) => toggleLike(r.id, e)}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-surface-900/90 flex items-center justify-center shadow hover:scale-110 transition-transform"
                                        aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
                                    >
                                        <Heart
                                            size={13}
                                            className={isLiked ? "text-red-500 fill-red-500" : "text-surface-500"}
                                        />
                                    </button>

                                    {/* Rating badge bottom-right */}
                                    {rating && (
                                        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-surface-900 shadow flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black text-surface-900 dark:text-white leading-none">{rating}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <p className="text-sm font-semibold text-surface-900 dark:text-white truncate leading-snug">{r.name}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                                    Livraison dès 1 500 FCFA · {eta}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ── Main component ─────────────────────────────────────────────────────
export function StorePageClient({ slug }: { slug: string }) {
    const [data, setData] = useState<StoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    // i18n : langue d'affichage de la vitrine (FR par défaut, EN si dispo)
    const [storeLang, setStoreLang] = useState<"fr" | "en">(() => {
        if (typeof window !== "undefined") {
            const browserLang = navigator.language.toLowerCase().startsWith("en") ? "en" : "fr";
            return browserLang;
        }
        return "fr";
    });
    const [cartOpen, setCartOpen] = useState(false);
    const searchParams = useSearchParams();
    const tableParam = searchParams.get("table");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
    const [resOccasion, setResOccasion] = useState<string>("");
    const [resSelectedZone, setResSelectedZone] = useState<string | null>(null);
    const [resStep, setResStep] = useState<1 | 2 | 3>(1);
    const [resAutoFilled, setResAutoFilled] = useState(false);
    // BYOB / droit de bouchon
    const [resByob, setResByob] = useState(false);
    const [resCorkageAcknowledged, setResCorkageAcknowledged] = useState(false);
    // Zone image lightbox
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
    const [availability, setAvailability] = useState<{
        date: string;
        slot_duration: number;
        zones: Array<{
            zone: { id: string; name: string; type: string; description: string | null; image_url: string | null; image_urls: string[]; color: string; capacity: number; min_party_size: number; amenities: string[]; pricing_note: string | null };
            tables_count: number;
            total_capacity: number;
            slots: Array<{ time: string; available: boolean; available_count: number; reserved_until: string | null }>;
        }>;
        unzoned_slots: Array<{ time: string; available: boolean; available_count: number; reserved_until: string | null }> | null;
    } | null>(null);
    const [availLoading, setAvailLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { addItem, itemCount, subtotal } = useCart();
    const shouldReduceMotion = useReducedMotion();
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
        if (!data?.categories?.length) return;
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

    // Pre-fill reservation form with user's profile when the panel first opens
    useEffect(() => {
        if (!reservationOpen || resAutoFilled) return;
        (async () => {
            const supabase = createClient();
            if (!supabase) return;
            // getSession() lit depuis le cache local — pas de roundtrip réseau
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const user = session.user;
            // Utiliser les métadonnées de session en priorité, DB en fallback
            const metaName = (user.user_metadata?.full_name as string | undefined) ?? "";
            if (metaName || user.phone || user.email) {
                setResName((prev) => prev || metaName);
                setResPhone((prev) => prev || (user.phone ?? ""));
                setResEmail((prev) => prev || (user.email ?? ""));
                // Seulement si full_name absent des métadonnées, on hit la DB
                if (!metaName) {
                    const { data: profile } = await supabase
                        .from("users")
                        .select("full_name, phone")
                        .eq("id", user.id)
                        .maybeSingle();
                    if (profile?.full_name) setResName((prev) => prev || profile.full_name!);
                    if (profile?.phone) setResPhone((prev) => prev || profile.phone!);
                }
            }
            setResAutoFilled(true);
        })();
    }, [reservationOpen, resAutoFilled]);

    // Fetch availability avec debounce 400ms — évite les spikes sur changement rapide
    useEffect(() => {
        if (!resDate || !reservationOpen) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            setAvailLoading(true);
            try {
                const res = await fetch(`/api/store/${slug}/availability?date=${resDate}&partySize=${resPartySize}`);
                if (!res.ok || cancelled) return;
                const json = await res.json();
                if (!cancelled) {
                    setAvailability(json);
                    setResSelectedZone(null);
                    setResTime("");
                }
            } catch { /* ignore */ } finally {
                if (!cancelled) setAvailLoading(false);
            }
        }, 400);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [resDate, resPartySize, reservationOpen, slug]);

    // ── PWA White-Label: dynamic theme-color meta + CSS custom properties ──
    useEffect(() => {
        const color = data?.restaurant?.primaryColor ?? "#f97316";

        // PWA theme-color meta tag
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", "theme-color");
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", color);

        // CSS custom properties on :root for theme components
        document.documentElement.style.setProperty("--brand-primary", color);
        document.documentElement.style.setProperty("--brand-primary-light", color + "20");

        // ── Override Tailwind brand classes with restaurant's primary color ──
        // Tailwind compiles bg-brand-500 etc. at build time with a fixed color.
        // We inject a <style> tag at runtime to override these with the restaurant color.
        let styleTag = document.getElementById("kbouffe-brand-override") as HTMLStyleElement | null;
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "kbouffe-brand-override";
            document.head.appendChild(styleTag);
        }
        // Build a slightly darker shade for hover states (multiply each channel by 0.85)
        const hex = color.replace("#", "");
        const r = Math.round(parseInt(hex.substring(0, 2), 16) * 0.85).toString(16).padStart(2, "0");
        const g = Math.round(parseInt(hex.substring(2, 4), 16) * 0.85).toString(16).padStart(2, "0");
        const b = Math.round(parseInt(hex.substring(4, 6), 16) * 0.85).toString(16).padStart(2, "0");
        const darker = `#${r}${g}${b}`;

        styleTag.textContent = `
            .bg-brand-500  { background-color: ${color}  !important; }
            .bg-brand-600  { background-color: ${darker} !important; }
            .text-brand-500, .text-brand-600 { color: ${color} !important; }
            .text-brand-400 { color: ${color}cc !important; }
            .border-brand-500 { border-color: ${color} !important; }
            .hover\\:bg-brand-500:hover  { background-color: ${color}  !important; }
            .hover\\:bg-brand-600:hover  { background-color: ${darker} !important; }
            .hover\\:text-brand-500:hover { color: ${color} !important; }
            .hover\\:border-brand-500:hover { border-color: ${color} !important; }
            .ring-brand-500\\/20 { --tw-ring-color: ${color}33 !important; }
            .ring-brand-500\\/40 { --tw-ring-color: ${color}66 !important; }
            .shadow-brand-500\\/20 { --tw-shadow-color: ${color}33 !important; }
            .bg-brand-100 { background-color: ${color}1a !important; }
            .bg-brand-50  { background-color: ${color}0d !important; }
        `;
    }, [data?.restaurant?.primaryColor]);

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
            // Get authenticated user ID if logged in
            const supabase = createClient();
            const currentUser = supabase
                ? (await supabase.auth.getUser()).data.user
                : null;

            const response = await fetch(`/api/store/${restaurantSlug}/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: resName.trim(),
                    customerPhone: resPhone.trim() || undefined,
                    customerEmail: resEmail.trim() || undefined,
                    customerId: currentUser?.id ?? undefined,
                    partySize: resPartySize,
                    date: resDate,
                    time: resTime,
                    zoneId: resSelectedZone || undefined,
                    occasion: resOccasion || undefined,
                    specialRequests: resSpecial.trim() || undefined,
                    byobRequested: resByob,
                    corkageFeeAcknowledged: resByob ? resCorkageAcknowledged : false,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                setResError(payload.error ?? "Impossible de créer la réservation.");
                return;
            }

            setResSuccess(`Réservation confirmée (ref: ${payload.reservation?.id?.slice(-6) ?? "N/A"}).`);
            setResSpecial("");
            setResOccasion("");
            setResSelectedZone(null);
            setResByob(false);
            setResCorkageAcknowledged(false);
            setResStep(1);
        } catch {
            setResError("Erreur réseau pendant la réservation.");
        } finally {
            setResSubmitting(false);
        }
    }, [resName, resPhone, resEmail, resPartySize, resDate, resTime, resSpecial, resSelectedZone, resOccasion, resByob, resCorkageAcknowledged]);

    const restaurant = data?.restaurant ?? null;
    const categories = data?.categories ?? EMPTY_CATEGORIES;
    const products = data?.products ?? EMPTY_PRODUCTS;
    const reviews = data?.reviews ?? EMPTY_REVIEWS;
    const announcements = data?.announcements;
    const featuredProducts = data?.featuredProducts ?? EMPTY_PRODUCTS;
    const avgRating = restaurant?.rating?.toFixed(1) ?? "—";

    const categoriesWithProducts = useMemo(
        () =>
            categories
                .map((cat) => ({ cat, items: products.filter((p) => p.category_id === cat.id) }))
                .filter((g) => g.items.length > 0),
        [categories, products],
    );

    // ── i18n : check if English translations are available ──
    const hasEnglish = useMemo(
        () => products.some((p) => p.name_i18n?.en) || categories.some((c) => c.name_i18n?.en),
        [products, categories],
    );

    // Localized data — map translated text before passing to theme components
    const localizedProducts = useMemo(
        () =>
            products.map((p) => ({
                ...p,
                name: t18n(p.name_i18n, p.name, storeLang),
                description: t18n(p.description_i18n, p.description ?? "", storeLang) || null,
            })),
        [products, storeLang],
    );

    const localizedCategories = useMemo(
        () =>
            categories.map((c) => ({
                ...c,
                name: t18n(c.name_i18n, c.name, storeLang),
                description: t18n(c.description_i18n, c.description ?? "", storeLang) || null,
            })),
        [categories, storeLang],
    );

    const localizedFeaturedProducts = useMemo(
        () =>
            featuredProducts.map((p) => ({
                ...p,
                name: t18n(p.name_i18n, p.name, storeLang),
                description: t18n(p.description_i18n, p.description ?? "", storeLang) || null,
            })),
        [featuredProducts, storeLang],
    );

    const themeLayout = restaurant?.themeLayout ?? "grid";

    // ── Theme engine ──
    const ThemeComponent = useMemo(
        () =>
            ({
                grid: GridTheme,
                luxury: LuxuryTheme,
                story: StoryTheme,
            }[themeLayout] ?? GridTheme),
        [themeLayout],
    );

    // ── Search filter ──
    const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
    const filteredProducts = useMemo(
        () =>
            normalizedQuery
                ? localizedProducts.filter(
                      (p) =>
                          p.name.toLowerCase().includes(normalizedQuery) ||
                          p.description?.toLowerCase().includes(normalizedQuery),
                  )
                : localizedProducts,
        [normalizedQuery, localizedProducts],
    );

    const filteredFeaturedProducts = useMemo(
        () =>
            normalizedQuery
                ? localizedFeaturedProducts.filter(
                      (p) =>
                          p.name.toLowerCase().includes(normalizedQuery) ||
                          (p.description?.toLowerCase().includes(normalizedQuery) ?? false),
                  )
                : localizedFeaturedProducts,
        [normalizedQuery, localizedFeaturedProducts],
    );

    const themeTransition = shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

    const springTransition = shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 520, damping: 30 };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    if (error || !data || !restaurant) {
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

    const handleAddToCart = (
        product: { id: string; name: string; price: number; image_url: string | null; options?: Array<{ name: string; choices: Array<{ label: string; extra_price: number }>; required?: boolean }> | null },
        selectedOptions: Record<string, string> = {},
        notes: string = "",
        finalPrice?: number,
    ) => {
        // Compute cartKey: unique per product+options combo
        const hasSelections = Object.keys(selectedOptions).length > 0;
        const cartKey = hasSelections
            ? `${product.id}|${JSON.stringify(selectedOptions)}`
            : product.id;
        const unitPrice = finalPrice ?? product.price;

        // Build SelectedOption array for cart display
        const selectedOptionsList = product.options
            ? product.options
                  .filter((opt) => selectedOptions[opt.name])
                  .map((opt) => {
                      const choiceLabel = selectedOptions[opt.name];
                      const choice = opt.choices.find((c) => c.label === choiceLabel);
                      return {
                          name: opt.name,
                          choice: choiceLabel,
                          extra_price: choice?.extra_price ?? 0,
                      };
                  })
            : undefined;

        addItem(
            { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
            {
                id: product.id,
                cartKey,
                name: product.name,
                price: unitPrice,
                imageUrl: product.image_url,
                selectedOptions: selectedOptionsList?.length ? selectedOptionsList : undefined,
                notes: notes.trim() || undefined,
            },
        );
        setCartOpen(true);
        trackEvent("AddToCart", {
            content_name: product.name,
            content_ids: [product.id],
            content_type: "product",
            value: unitPrice,
            currency: "XAF",
        });
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        trackEvent("ViewContent", {
            content_name: product.name,
            content_ids: [product.id],
            content_type: "product",
            value: product.price,
            currency: "XAF",
        });
    };

    /**
     * Called from ThemeComponent product cards.
     * If the product has options, open the detail modal so the user can
     * pick a variant. Otherwise add directly.
     */
    const handleThemeAddToCart = (product: Product) => {
        const hasOptions = product.options && product.options.length > 0;
        if (hasOptions) {
            handleProductClick(product);
        } else {
            handleAddToCart(product);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 font-sans pb-20 lg:pb-0">
            {/* Tracking Pixels */}
            <TrackingPixels
                metaPixelId={restaurant.metaPixelId}
                googleAnalyticsId={restaurant.googleAnalyticsId}
            />

            {/* Announcement Banners */}
            {announcements && announcements.length > 0 && (
                <AnnouncementBanner
                    announcements={announcements}
                    restaurantId={restaurant.id}
                />
            )}

            {/* Dine-In Table Banner — affiché quand le client arrive via QR code */}
            {tableParam && (
                <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 shadow-lg">
                    <Utensils size={16} className="shrink-0" />
                    <span>Table {tableParam} — Commandez depuis votre place, c&apos;est plus rapide 🚀</span>
                </div>
            )}
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
                            whileHover={shouldReduceMotion ? undefined : { rotate: 8 }}
                            transition={themeTransition}
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
                                    initial={shouldReduceMotion ? false : { scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
                                    transition={springTransition}
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
                        initial={shouldReduceMotion ? false : { scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={themeTransition}
                        className="relative z-10 w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl shrink-0 overflow-hidden -mt-10 sm:-mt-16 md:-mt-20 ring-4 sm:ring-8 ring-white dark:ring-surface-950"
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
                            initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={themeTransition}
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
                        <div className="grid grid-cols-3 items-center gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3 mt-6 py-4 border-y border-surface-100 dark:border-surface-800/60">
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
                                            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={shouldReduceMotion ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                            transition={themeTransition}
                                            className="border-t border-surface-200 dark:border-surface-800 overflow-hidden"
                                        >
                                            <div className="p-5 sm:p-6 space-y-4">
                                                {/* Cancellation policy */}
                                                <div className="flex items-center gap-3 p-3 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                                                    <Info size={14} className="text-brand-500" />
                                                    <p className="text-[11px] text-surface-600 dark:text-surface-400 leading-tight font-medium">
                                                        Politique : <span className="text-surface-900 dark:text-white font-bold">{cancellationPolicyLabels[restaurant.reservationCancelPolicy ?? "flexible"]}</span>
                                                        {restaurant.reservationCancelNoticeMinutes > 0 ? ` · Gratuit jusqu'à ${restaurant.reservationCancelNoticeMinutes} min avant` : " · Annulation gratuite"}
                                                    </p>
                                                </div>

                                                {/* Step indicator */}
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3].map((s) => (
                                                        <div key={s} className="flex items-center gap-2 flex-1">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                                                resStep >= s
                                                                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                                                                    : "bg-surface-100 dark:bg-surface-800 text-surface-400"
                                                            }`}>
                                                                {resStep > s ? <CheckCircle2 size={14} /> : s}
                                                            </div>
                                                            {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all ${resStep > s ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"}`} />}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* ── Step 1: Date, Party Size, Name, Phone ── */}
                                                {resStep === 1 && (
                                                    <div className="space-y-3">
                                                        <p className="text-sm font-bold text-surface-900 dark:text-white">Quand et combien ?</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="date"
                                                                min={minReservationDate}
                                                                value={resDate}
                                                                onChange={(e) => setResDate(e.target.value)}
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
                                                        <div className="space-y-3">
                                                            {resAutoFilled && (
                                                                <p className="text-[11px] text-brand-500 font-medium flex items-center gap-1.5">
                                                                    <CheckCircle2 size={12} />
                                                                    Pré-rempli depuis votre compte · modifiable
                                                                </p>
                                                            )}
                                                            <input
                                                                value={resName}
                                                                onChange={(e) => setResName(e.target.value)}
                                                                placeholder="Nom du réservant *"
                                                                className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                            />
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <input
                                                                    value={resPhone}
                                                                    onChange={(e) => setResPhone(e.target.value)}
                                                                    placeholder="Téléphone"
                                                                    type="tel"
                                                                    className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                                />
                                                                <input
                                                                    value={resEmail}
                                                                    onChange={(e) => setResEmail(e.target.value)}
                                                                    placeholder="Email"
                                                                    type="email"
                                                                    className="h-11 px-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (!resName.trim()) { setResError("Nom requis pour la réservation."); return; }
                                                                if (!resDate) { setResError("Sélectionnez une date."); return; }
                                                                setResError(null);
                                                                setResStep(2);
                                                            }}
                                                            className="w-full h-11 rounded-2xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 text-sm font-bold transition-all hover:shadow-xl hover:-translate-y-0.5"
                                                        >
                                                            Choisir un créneau →
                                                        </button>
                                                    </div>
                                                )}

                                                {/* ── Step 2: Zone picker + Time slots ── */}
                                                {resStep === 2 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold text-surface-900 dark:text-white">Choisir un espace & créneau</p>
                                                            <button onClick={() => setResStep(1)} className="text-xs text-brand-500 font-bold hover:underline">← Retour</button>
                                                        </div>

                                                        {availLoading ? (
                                                            <div className="flex items-center justify-center py-8">
                                                                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                                                                <span className="ml-2 text-sm text-surface-500">Chargement des disponibilités...</span>
                                                            </div>
                                                        ) : availability && availability.zones.length > 0 ? (
                                                            <>
                                                                {/* Zone cards */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    {availability.zones.map(({ zone, tables_count, slots: zoneSlots }) => {
                                                                        const anyAvailable = zoneSlots.some((s) => s.available);
                                                                        const tooSmall = zone.min_party_size > 0 && resPartySize < zone.min_party_size;
                                                                        const selected = resSelectedZone === zone.id;
                                                                        const zoneTypeLabels: Record<string, string> = {
                                                                            indoor: "Intérieur", outdoor: "Extérieur", terrace: "Terrasse",
                                                                            vip: "VIP", air_conditioned: "Climatisé",
                                                                        };
                                                                        const amenityIcons: Record<string, string> = {
                                                                            wifi: "📶", ac: "❄️", view: "🌅", private: "🔒",
                                                                            music: "🎵", tv: "📺", outdoor: "🌿", parking: "🅿️",
                                                                        };

                                                                        return (
                                                                            <button
                                                                                key={zone.id}
                                                                                onClick={() => {
                                                                                    if (tooSmall || !anyAvailable) return;
                                                                                    setResSelectedZone(selected ? null : zone.id);
                                                                                    setResTime("");
                                                                                }}
                                                                                disabled={tooSmall || !anyAvailable}
                                                                                className={`text-left rounded-2xl border-2 transition-all overflow-hidden ${
                                                                                    selected
                                                                                        ? "border-brand-500 bg-brand-500/5 shadow-md shadow-brand-500/10"
                                                                                        : tooSmall || !anyAvailable
                                                                                        ? "border-surface-200 dark:border-surface-700 opacity-50 cursor-not-allowed"
                                                                                        : "border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-600"
                                                                                }`}
                                                                            >
                                                                                {/* Image strip — click individual thumbnails to zoom */}
                                                                                {(() => {
                                                                                    const imgs = zone.image_urls?.filter(Boolean).length
                                                                                        ? zone.image_urls.filter(Boolean)
                                                                                        : zone.image_url ? [zone.image_url] : [];
                                                                                    if (imgs.length === 0) return (
                                                                                        <div className="w-full h-28 flex items-center justify-center shrink-0" style={{ backgroundColor: zone.color ?? "#6366f1" }}>
                                                                                            <span className="text-white text-3xl">{zone.type === "vip" ? "👑" : zone.type === "terrace" ? "🌿" : "🍽️"}</span>
                                                                                        </div>
                                                                                    );
                                                                                    if (imgs.length === 1) return (
                                                                                        <div className="relative group w-full h-28">
                                                                                            <img src={imgs[0]} alt={zone.name} className="w-full h-full object-cover" />
                                                                                            <div
                                                                                                role="button"
                                                                                                tabIndex={0}
                                                                                                onClick={(e) => { e.stopPropagation(); setLightbox({ images: imgs, index: 0 }); }}
                                                                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setLightbox({ images: imgs, index: 0 }); } }}
                                                                                                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all cursor-pointer"
                                                                                            >
                                                                                                <Maximize2 size={22} className="text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                    return (
                                                                                        <div className="flex gap-0.5 w-full h-28">
                                                                                            {imgs.slice(0, 5).map((src, i) => (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    role="button"
                                                                                                    tabIndex={0}
                                                                                                    onClick={(e) => { e.stopPropagation(); setLightbox({ images: imgs, index: i }); }}
                                                                                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setLightbox({ images: imgs, index: i }); } }}
                                                                                                    className={`relative group flex-1 min-w-0 overflow-hidden cursor-pointer ${i === 0 ? "rounded-l-none" : ""} ${i === imgs.slice(0, 5).length - 1 ? "rounded-r-none" : ""}`}
                                                                                                >
                                                                                                    <img src={src} alt={`${zone.name} ${i + 1}`} className="w-full h-full object-cover" />
                                                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                                                                                                        <Maximize2 size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                                                                                    </div>
                                                                                                    {i === 4 && imgs.length > 5 && (
                                                                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                                                            <span className="text-white font-bold text-sm">+{imgs.length - 5}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {/* Card body */}
                                                                                <div className="p-3">
                                                                                    <div className="flex items-start gap-2">
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="font-bold text-sm text-surface-900 dark:text-white truncate">{zone.name}</p>
                                                                                            <p className="text-[11px] text-surface-500 font-medium">
                                                                                                {zoneTypeLabels[zone.type] ?? zone.type}
                                                                                                {tables_count > 0 && ` · ${tables_count} tables`}
                                                                                            </p>
                                                                                            {zone.description && (
                                                                                                <p className="text-[11px] text-surface-400 mt-0.5 line-clamp-1">{zone.description}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Amenities */}
                                                                                    {zone.amenities && zone.amenities.length > 0 && (
                                                                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                                                                            {zone.amenities.map((a) => (
                                                                                                <span key={a} className="text-xs" title={a}>{amenityIcons[a] ?? "✨"}</span>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Status */}
                                                                                    {tooSmall && (
                                                                                        <p className="text-[10px] text-amber-600 font-bold mt-2">Min. {zone.min_party_size} personnes</p>
                                                                                    )}
                                                                                    {!anyAvailable && !tooSmall && (
                                                                                        <p className="text-[10px] text-red-500 font-bold mt-2">Complet pour cette date</p>
                                                                                    )}
                                                                                    {zone.pricing_note && (
                                                                                        <p className="text-[10px] text-surface-400 mt-1 italic">{zone.pricing_note}</p>
                                                                                    )}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Time slots for selected zone */}
                                                                {resSelectedZone && (() => {
                                                                    const zoneData = availability.zones.find((z) => z.zone.id === resSelectedZone);
                                                                    if (!zoneData) return null;
                                                                    const { slots: zoneSlots } = zoneData;
                                                                    return (
                                                                        <div className="space-y-2">
                                                                            <p className="text-xs font-bold text-surface-700 dark:text-surface-300">Créneaux disponibles — {zoneData.zone.name}</p>
                                                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                                                                                {zoneSlots.map((slot) => (
                                                                                    <button
                                                                                        key={slot.time}
                                                                                        onClick={() => slot.available && setResTime(slot.time)}
                                                                                        disabled={!slot.available}
                                                                                        className={`relative py-2 px-1 rounded-xl text-xs font-bold text-center transition-all ${
                                                                                            resTime === slot.time
                                                                                                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-105"
                                                                                                : slot.available
                                                                                                ? "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                                                                                                : "bg-surface-100 dark:bg-surface-800/50 text-surface-300 dark:text-surface-600 cursor-not-allowed line-through"
                                                                                        }`}
                                                                                    >
                                                                                        {slot.time}
                                                                                        {!slot.available && slot.reserved_until && (
                                                                                            <span className="block text-[9px] font-medium text-surface-400 no-underline" style={{ textDecoration: "none" }}>
                                                                                                → {slot.reserved_until}
                                                                                            </span>
                                                                                        )}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {/* Also show unzoned slots if available */}
                                                                {availability.unzoned_slots && !resSelectedZone && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-bold text-surface-700 dark:text-surface-300">Créneaux — Sans zone spécifique</p>
                                                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                                                                            {availability.unzoned_slots.map((slot) => (
                                                                                <button
                                                                                    key={slot.time}
                                                                                    onClick={() => slot.available && setResTime(slot.time)}
                                                                                    disabled={!slot.available}
                                                                                    className={`relative py-2 px-1 rounded-xl text-xs font-bold text-center transition-all ${
                                                                                        resTime === slot.time
                                                                                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-105"
                                                                                            : slot.available
                                                                                            ? "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white hover:border-brand-400"
                                                                                            : "bg-surface-100 dark:bg-surface-800/50 text-surface-300 dark:text-surface-600 cursor-not-allowed line-through"
                                                                                    }`}
                                                                                >
                                                                                    {slot.time}
                                                                                    {!slot.available && slot.reserved_until && (
                                                                                        <span className="block text-[9px] font-medium text-surface-400 no-underline" style={{ textDecoration: "none" }}>
                                                                                            → {slot.reserved_until}
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : availability && availability.zones.length === 0 && availability.unzoned_slots ? (
                                                            /* No zones, show unzoned time slots directly */
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold text-surface-700 dark:text-surface-300">Créneaux disponibles</p>
                                                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                                                                    {availability.unzoned_slots.map((slot) => (
                                                                        <button
                                                                            key={slot.time}
                                                                            onClick={() => slot.available && setResTime(slot.time)}
                                                                            disabled={!slot.available}
                                                                            className={`relative py-2 px-1 rounded-xl text-xs font-bold text-center transition-all ${
                                                                                resTime === slot.time
                                                                                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-105"
                                                                                    : slot.available
                                                                                    ? "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white hover:border-brand-400"
                                                                                    : "bg-surface-100 dark:bg-surface-800/50 text-surface-300 dark:text-surface-600 cursor-not-allowed line-through"
                                                                            }`}
                                                                        >
                                                                            {slot.time}
                                                                            {!slot.available && slot.reserved_until && (
                                                                                <span className="block text-[9px] font-medium text-surface-400 no-underline" style={{ textDecoration: "none" }}>
                                                                                    → {slot.reserved_until}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : !availLoading && resDate ? (
                                                            <div className="text-center py-6">
                                                                <p className="text-sm text-surface-500">Aucune disponibilité trouvée pour cette date.</p>
                                                            </div>
                                                        ) : !resDate ? (
                                                            <p className="text-xs text-surface-400 text-center py-4">Sélectionnez d&apos;abord une date à l&apos;étape précédente.</p>
                                                        ) : null}

                                                        {/* Next button */}
                                                        {resTime && (
                                                            <button
                                                                onClick={() => { setResError(null); setResStep(3); }}
                                                                className="w-full h-11 rounded-2xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 text-sm font-bold transition-all hover:shadow-xl hover:-translate-y-0.5"
                                                            >
                                                                Finaliser ma réservation →
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── Step 3: Occasion + Special requests + Confirm ── */}
                                                {resStep === 3 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold text-surface-900 dark:text-white">Détails de votre réservation</p>
                                                            <button onClick={() => setResStep(2)} className="text-xs text-brand-500 font-bold hover:underline">← Retour</button>
                                                        </div>

                                                        {/* Summary */}
                                                        <div className="p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 text-sm space-y-1">
                                                            <p className="font-bold text-surface-900 dark:text-white">{resName} · {resPartySize} pers.</p>
                                                            <p className="text-surface-500">{resDate} à {resTime}</p>
                                                            {resSelectedZone && availability && (() => {
                                                                const z = availability.zones.find((z) => z.zone.id === resSelectedZone);
                                                                return z ? <p className="text-xs text-brand-500 font-medium">📍 {z.zone.name}</p> : null;
                                                            })()}
                                                            {resByob && (
                                                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                                                    🍷 BYOB
                                                                    {restaurant.corkageFeeAmount > 0 && (
                                                                        <span>· Droit de bouchon : {(restaurant.corkageFeeAmount * resPartySize).toLocaleString("fr-FR")} FCFA</span>
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Occasion picker */}
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-bold text-surface-700 dark:text-surface-300">Occasion (optionnel)</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {([
                                                                    { key: "birthday", icon: "🎂", label: "Anniversaire" },
                                                                    { key: "dinner", icon: "🍽️", label: "Dîner" },
                                                                    { key: "surprise", icon: "🎁", label: "Surprise" },
                                                                    { key: "business", icon: "💼", label: "Business" },
                                                                    { key: "anniversary", icon: "💍", label: "Célébration" },
                                                                    { key: "date", icon: "❤️", label: "Rendez-vous" },
                                                                    { key: "family", icon: "👨‍👩‍👧‍👦", label: "Famille" },
                                                                    { key: "other", icon: "📌", label: "Autre" },
                                                                ] as const).map((occ) => (
                                                                    <button
                                                                        key={occ.key}
                                                                        onClick={() => setResOccasion(resOccasion === occ.key ? "" : occ.key)}
                                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                                            resOccasion === occ.key
                                                                                ? "bg-brand-500 text-white shadow-md"
                                                                                : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                                                                        }`}
                                                                    >
                                                                        <span>{occ.icon}</span>
                                                                        {occ.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Special requests */}
                                                        <textarea
                                                            value={resSpecial}
                                                            onChange={(e) => setResSpecial(e.target.value)}
                                                            rows={2}
                                                            placeholder="Demandes spéciales (allergies, chaise haute, etc.)"
                                                            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm resize-none focus:ring-2 ring-brand-500/20 outline-none transition-all"
                                                        />

                                                        {/* ── BYOB / Droit de bouchon ── */}
                                                        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                                                            {/* Toggle BYOB */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setResByob(!resByob);
                                                                    if (resByob) setResCorkageAcknowledged(false);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                                                                    resByob
                                                                        ? "bg-amber-50 dark:bg-amber-500/10"
                                                                        : "bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700/50"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xl">🍷</span>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-surface-900 dark:text-white">
                                                                            J&apos;apporte ma propre boisson
                                                                        </p>
                                                                        <p className="text-xs text-surface-500">
                                                                            BYOB — Bring Your Own Bottle
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Toggle visuel */}
                                                                <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${resByob ? "bg-amber-500" : "bg-surface-200 dark:bg-surface-600"}`}>
                                                                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${resByob ? "translate-x-5" : "translate-x-0"}`} />
                                                                </div>
                                                            </button>

                                                            {/* Droit de bouchon — affiché seulement si BYOB activé ET montant > 0 */}
                                                            {resByob && restaurant.corkageFeeAmount > 0 && (
                                                                <div className="border-t border-amber-200 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/5 px-4 py-4 space-y-3">
                                                                    {/* Montant */}
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                                                                Droit de bouchon
                                                                            </p>
                                                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                                                                Frais appliqués pour apporter vos propres boissons
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                                                                                {restaurant.corkageFeeAmount.toLocaleString("fr-FR")} FCFA
                                                                            </p>
                                                                            <p className="text-[10px] text-amber-500 uppercase tracking-wider">par personne</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Total estimé */}
                                                                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-100 dark:bg-amber-500/10">
                                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                                            Total estimé ({resPartySize} pers.)
                                                                        </span>
                                                                        <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                                                                            {(restaurant.corkageFeeAmount * resPartySize).toLocaleString("fr-FR")} FCFA
                                                                        </span>
                                                                    </div>

                                                                    {/* Confirmation paiement sur place */}
                                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                                        <div className="relative mt-0.5 flex-shrink-0">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={resCorkageAcknowledged}
                                                                                onChange={(e) => setResCorkageAcknowledged(e.target.checked)}
                                                                                className="sr-only"
                                                                            />
                                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                                                                resCorkageAcknowledged
                                                                                    ? "bg-amber-500 border-amber-500"
                                                                                    : "border-amber-300 dark:border-amber-600 bg-white dark:bg-surface-800 group-hover:border-amber-400"
                                                                            }`}>
                                                                                {resCorkageAcknowledged && (
                                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                                                            Je comprends et j&apos;accepte de payer le droit de bouchon de{" "}
                                                                            <strong>{(restaurant.corkageFeeAmount * resPartySize).toLocaleString("fr-FR")} FCFA</strong>{" "}
                                                                            directement au restaurant lors de ma visite.
                                                                        </p>
                                                                    </label>

                                                                    {!resCorkageAcknowledged && (
                                                                        <p className="text-[11px] text-amber-500 dark:text-amber-400 font-medium">
                                                                            ☝️ Cochez la case pour confirmer votre accord
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* BYOB sans frais */}
                                                            {resByob && restaurant.corkageFeeAmount === 0 && (
                                                                <div className="border-t border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-4 py-3">
                                                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                                        <CheckCircle2 size={14} />
                                                                        Ce restaurant n&apos;applique pas de droit de bouchon. Vous pouvez apporter vos boissons gratuitement.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

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
                                                            disabled={resSubmitting || (resByob && restaurant.corkageFeeAmount > 0 && !resCorkageAcknowledged)}
                                                            className="w-full h-11 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-all shadow-lg shadow-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {resSubmitting ? "Traitement..." : "Confirmer ma réservation ✓"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gallery */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <RestaurantGallery restaurantId={restaurant.id} />
            </div>

            {/* Sidebar + Menu */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0 sm:gap-12 pb-32">
                {categoriesWithProducts.length > 1 && (
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-20 pt-4 max-h-[calc(100vh-6rem)] flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-6 px-1 shrink-0">Menu</p>
                            <nav className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1">
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
                    {/* Horizontal scroll for mobile/tablet (kept for all themes) */}
                    {categoriesWithProducts.length > 1 && (
                        <div className="flex lg:hidden gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sticky top-[64px] z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md pt-2">
                            {categoriesWithProducts.map(({ cat }) => (
                                <button
                                    key={cat.id}
                                    onClick={() => scrollToCategory(cat.id)}
                                    className={`shrink-0 whitespace-nowrap snap-start px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
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

                    {/* i18n langue toggle — visible seulement si traductions EN existent */}
                    {hasEnglish && (
                        <div className="flex justify-end mb-4">
                            <div className="flex p-0.5 bg-surface-100 dark:bg-surface-800 rounded-full text-xs font-bold shadow-sm">
                                <button
                                    onClick={() => setStoreLang("fr")}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${storeLang === "fr" ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" : "text-surface-400 hover:text-surface-700 dark:hover:text-surface-300"}`}
                                >
                                    🇫🇷 FR
                                </button>
                                <button
                                    onClick={() => setStoreLang("en")}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${storeLang === "en" ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" : "text-surface-400 hover:text-surface-700 dark:hover:text-surface-300"}`}
                                >
                                    🇬🇧 EN
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Barre de recherche de produits */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl focus-within:border-brand-400 dark:focus-within:border-brand-500 transition-colors">
                            <Search size={16} className="text-surface-400 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher un plat…"
                                className="flex-1 bg-transparent text-sm text-surface-900 dark:text-white placeholder-surface-400 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                    aria-label="Effacer la recherche"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {normalizedQuery && (
                            <p className="mt-1.5 text-xs text-surface-400 px-1">
                                {filteredProducts.length} résultat{filteredProducts.length !== 1 ? "s" : ""} pour «&nbsp;{searchQuery}&nbsp;»
                            </p>
                        )}
                    </div>

                    {/* Theme-driven menu rendering */}
                    {normalizedQuery && filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-surface-400">
                            <ChefHat size={40} className="opacity-40" />
                            <p className="text-sm font-medium">Aucun plat trouvé pour «&nbsp;{searchQuery}&nbsp;»</p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-sm text-brand-500 hover:underline"
                            >
                                Effacer la recherche
                            </button>
                        </div>
                    ) : (
                    <ThemeComponent
                        restaurant={restaurant}
                        categories={localizedCategories}
                        products={filteredProducts}
                        featuredProducts={filteredFeaturedProducts}
                        activeCategory={activeCategory ?? ""}
                        onCategoryChange={scrollToCategory}
                        onAddToCart={handleThemeAddToCart}
                        onProductClick={handleProductClick}
                        formatPrice={formatCFA}
                        sectionRefs={sectionRefs}
                    />
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
                                        {review.response && (
                                            <div className="mt-3 pl-3 border-l-2 border-brand-500">
                                                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-0.5">Réponse du restaurant</p>
                                                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{review.response}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* ── Sticky Mobile Cart Bar ─────────────────────────────────────────────
                 Full-width fixed bottom bar, only on < lg, only when cart has items.
                 Animates in/out with framer-motion. pb respects iPhone notch. ── */}
            <AnimatePresence>
                {itemCount > 0 && !cartOpen && (
                    <motion.div
                        initial={shouldReduceMotion ? false : { y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
                        transition={themeTransition}
                        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
                        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
                    >
                        <button
                            onClick={() => setCartOpen(true)}
                            className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white px-4 py-3.5 flex items-center justify-between transition-colors shadow-[0_-4px_24px_rgba(249,115,22,0.30)]"
                            aria-label={`Panier — ${itemCount} article${itemCount !== 1 ? "s" : ""}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <ShoppingBag size={20} className="text-white/90" />
                                <span className="font-bold text-[15px]">
                                    {itemCount} article{itemCount !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-extrabold text-[15px]">{formatCFA(subtotal)}</span>
                                <span className="text-sm font-semibold text-white/80">Voir le panier →</span>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                initialDeliveryType={tableParam ? "dine_in" : undefined}
                initialTableNumber={tableParam ?? undefined}
            />

            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    restaurant={{ id: restaurant.id, name: restaurant.name, slug: restaurant.slug }}
                    reduceMotion={shouldReduceMotion}
                    onClose={() => setSelectedProduct(null)}
                    onAdd={(selectedOpts, notes, finalPrice) => {
                        handleAddToCart(selectedProduct, selectedOpts, notes, finalPrice);
                        setSelectedProduct(null);
                    }}
                    relatedProducts={products.filter((p) => p.id !== selectedProduct.id && p.is_available).slice(0, 6)}
                />
            )}

            <ExploreMoreSection currentId={restaurant.id} cuisineType={restaurant.cuisineType} />

            <footer className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-brand-500 text-white p-1.5 rounded-lg"><ChefHat size={16} /></div>
                        <span className="font-bold text-sm text-surface-900 dark:text-white">Kbouffe</span>
                    </Link>
                    <p className="text-xs text-surface-400">© {new Date().getFullYear()} Kbouffe. Tous droits réservés.</p>
                </div>
            </footer>

            {/* Zone image lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
                    onClick={() => setLightbox(null)}
                >
                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setLightbox(null)}
                    >
                        <X size={22} />
                    </button>

                    {/* Prev */}
                    {lightbox.images.length > 1 && (
                        <button
                            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : null); }}
                        >
                            <ChevronLeft size={26} />
                        </button>
                    )}

                    {/* Image */}
                    <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightbox.images[lightbox.index]}
                            alt={`Photo ${lightbox.index + 1}`}
                            className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl"
                        />
                        {lightbox.images.length > 1 && (
                            <>
                                <p className="text-white/60 text-sm">{lightbox.index + 1} / {lightbox.images.length}</p>
                                {/* Thumbnail strip */}
                                <div className="flex gap-2">
                                    {lightbox.images.map((src, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setLightbox((lb) => lb ? { ...lb, index: i } : null)}
                                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightbox.index ? "border-white scale-110" : "border-white/20 hover:border-white/60"}`}
                                        >
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Next */}
                    {lightbox.images.length > 1 && (
                        <button
                            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : null); }}
                        >
                            <ChevronRight size={26} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
