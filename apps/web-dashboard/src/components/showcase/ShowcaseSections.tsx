"use client";

import { Star, MapPin, Clock, Phone, Mail, Bike, ShieldCheck, Crown, ChefHat, Calendar, Users, ExternalLink, ArrowRight } from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────

export interface ShowcaseSection {
    id: string;
    section_type: string;
    title: string | null;
    subtitle: string | null;
    content: Record<string, any>;
    display_order: number;
    is_visible: boolean;
    settings: Record<string, any>;
}

export interface ShowcaseRestaurant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    address: string;
    city: string;
    phone: string | null;
    email: string | null;
    cuisineType: string;
    primaryColor: string | null;
    openingHours: Record<string, any> | null;
    rating: number;
    reviewCount: number;
    orderCount: number;
    isVerified: boolean;
    isPremium: boolean;
    hasDineIn: boolean;
    hasReservations: boolean;
    totalTables: number;
    deliveryFee: number;
    minOrderAmount: number;
}

export interface ShowcaseProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    images?: string[];
    is_available: boolean;
    category_id: string | null;
}

export interface ShowcaseReview {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    created_at: string;
    customerName: string;
}

export interface ShowcaseCategory {
    id: string;
    name: string;
    description: string | null;
}

export interface ShowcaseTeamMember {
    id: string;
    userId: string;
    role: string;
    status: string;
    name: string;
    imageUrl: string | null;
}

const cuisineLabels: Record<string, string> = {
    african: "Cuisine Africaine",
    camerounaise: "Cuisine Camerounaise",
    "fast-food": "Fast-food",
    pizza: "Pizza",
    grillades: "Grillades & Braisé",
    patisserie: "Pâtisserie",
};

const dayLabels: Record<string, string> = {
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",
};

// ── Hero Section ───────────────────────────────────────────────────────

export function HeroSection({ restaurant, section }: { restaurant: ShowcaseRestaurant; section: ShowcaseSection }) {
    const layout = section.settings?.layout ?? "default";

    return (
        <section className="relative overflow-hidden">
            {/* Cover / Banner */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-surface-100 dark:bg-surface-900">
                {restaurant.coverUrl ? (
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1 }}
                        src={restaurant.coverUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${restaurant.primaryColor || "#f97316"}22, ${restaurant.primaryColor || "#f97316"}44)` }}
                    >
                        <ChefHat size={80} className="text-surface-200 dark:text-surface-700" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            {/* Restaurant Info Overlay */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 pb-8">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white dark:bg-surface-900 border-4 border-white dark:border-surface-900 shadow-2xl shrink-0 overflow-hidden"
                    >
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-50 dark:bg-surface-800">
                                <ChefHat size={40} className="text-surface-300" />
                            </div>
                        )}
                    </motion.div>

                    <div className="flex-1 min-w-0 pt-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">{restaurant.name}</h1>
                            {restaurant.isVerified && (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-lg border border-blue-500/30">
                                    <ShieldCheck size={12} className="mr-1" /> Vérifié
                                </span>
                            )}
                            {restaurant.isPremium && (
                                <span className="inline-flex items-center px-2 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30">
                                    <Crown size={12} className="mr-1" /> Premium
                                </span>
                            )}
                        </div>

                        <p className="text-white/70 text-sm mt-1.5 font-medium">
                            {cuisineLabels[restaurant.cuisineType] ?? restaurant.cuisineType} · {restaurant.city}
                        </p>

                        {/* Quick stats */}
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            {restaurant.rating > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                    <span className="text-white text-sm font-bold">{restaurant.rating.toFixed(1)}</span>
                                    <span className="text-white/70 text-xs">({restaurant.reviewCount})</span>
                                </div>
                            )}
                            {restaurant.hasDineIn && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 text-white text-xs font-semibold">
                                    <Users size={12} /> Sur place
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 text-white text-xs font-semibold">
                                <Bike size={12} /> Livraison
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── About Section ──────────────────────────────────────────────────────

export function AboutSection({ restaurant, section }: { restaurant: ShowcaseRestaurant; section: ShowcaseSection }) {
    const text = section.content?.text || restaurant.description || "";
    const imageUrl = section.content?.imageUrl;

    if (!text && !imageUrl && !section.title && !section.subtitle) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}
            <div className={`flex flex-col ${imageUrl ? "md:flex-row" : ""} gap-8`}>
                <div className="flex-1">
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-line">{text}</p>
                </div>
                {imageUrl && (
                    <div className="md:w-80 shrink-0">
                        <img src={imageUrl} alt="" className="w-full rounded-2xl shadow-lg object-cover max-h-72" />
                    </div>
                )}
            </div>
        </section>
    );
}

// ── Menu Highlights Section ────────────────────────────────────────────

export function MenuHighlightsSection({
    restaurant,
    section,
    products,
    onOrder,
}: {
    restaurant: ShowcaseRestaurant;
    section: ShowcaseSection;
    products: ShowcaseProduct[];
    onOrder: () => void;
}) {
    const maxItems = section.settings?.maxItems ?? 6;
    const pickedIds: string[] = section.content?.productIds ?? [];

    let featured = pickedIds.length > 0
        ? products.filter(p => pickedIds.includes(p.id))
        : products.filter(p => p.is_available).slice(0, maxItems);

    if (featured.length === 0) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map(product => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="group bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="relative h-44 bg-surface-100 dark:bg-surface-800 overflow-hidden">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ChefHat size={32} className="text-surface-300 dark:text-surface-600" />
                                </div>
                            )}
                            {product.compare_at_price && product.compare_at_price > product.price && (
                                <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">
                                    -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-surface-900 dark:text-white text-sm">{product.name}</h3>
                            {product.description && (
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">{product.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-surface-900 dark:text-white">{formatCFA(product.price)}</span>
                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                        <span className="text-xs text-surface-400 line-through">{formatCFA(product.compare_at_price)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="text-center mt-8">
                <button
                    onClick={onOrder}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ backgroundColor: restaurant.primaryColor || "#f97316" }}
                >
                    Voir le menu complet <ArrowRight size={16} />
                </button>
            </div>
        </section>
    );
}

// ── Full Menu Section ──────────────────────────────────────────────────

export function FullMenuSection({
    restaurant,
    section,
    products,
    categories,
    onOrder,
}: {
    restaurant: ShowcaseRestaurant;
    section: ShowcaseSection;
    products: ShowcaseProduct[];
    categories: ShowcaseCategory[];
    onOrder: () => void;
}) {
    const categorized = categories
        .map(cat => ({
            cat,
            items: products.filter(p => p.category_id === cat.id && p.is_available),
        }))
        .filter(c => c.items.length > 0);

    const uncategorized = products.filter(p => !p.category_id && p.is_available);

    if (categorized.length === 0 && uncategorized.length === 0) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}
            <div className="space-y-8">
                {categorized.map(({ cat, items }) => (
                    <div key={cat.id}>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">{cat.name}</h3>
                        {cat.description && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">{cat.description}</p>
                        )}
                        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800">
                            {items.map(product => (
                                <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                    {product.image_url && (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0">
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-surface-900 dark:text-white">{product.name}</p>
                                        {product.description && (
                                            <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">{product.description}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="font-extrabold text-sm text-surface-900 dark:text-white">{formatCFA(product.price)}</p>
                                        {product.compare_at_price && product.compare_at_price > product.price && (
                                            <p className="text-[11px] text-surface-400 line-through">{formatCFA(product.compare_at_price)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {uncategorized.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-3">Autres plats</h3>
                        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800">
                            {uncategorized.map(product => (
                                <div key={product.id} className="flex items-center gap-4 p-4">
                                    {product.image_url && (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0">
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-surface-900 dark:text-white">{product.name}</p>
                                    </div>
                                    <p className="font-extrabold text-sm text-surface-900 dark:text-white shrink-0">{formatCFA(product.price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="text-center mt-8">
                <button
                    onClick={onOrder}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ backgroundColor: restaurant.primaryColor || "#f97316" }}
                >
                    Commander maintenant <ArrowRight size={16} />
                </button>
            </div>
        </section>
    );
}

// ── Gallery Section ────────────────────────────────────────────────────

export function GallerySection({ restaurant, section }: { restaurant: ShowcaseRestaurant; section: ShowcaseSection }) {
    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}
            {/* Uses RestaurantGallery which handles its own data fetching */}
            <div id="showcase-gallery">
                <GalleryInner restaurantId={restaurant.id} />
            </div>
        </section>
    );
}

function GalleryInner({ restaurantId }: { restaurantId: string }) {
    // Lazy import to avoid circular deps — the RestaurantGallery component renders based on restaurantId
    const { RestaurantGallery } = require("@/components/store/RestaurantGallery");
    return <RestaurantGallery restaurantId={restaurantId} />;
}

// ── Reviews Section ────────────────────────────────────────────────────

export function ReviewsSection({
    restaurant,
    section,
    reviews,
}: {
    restaurant: ShowcaseRestaurant;
    section: ShowcaseSection;
    reviews: ShowcaseReview[];
}) {
    const maxItems = section.settings?.maxItems ?? 10;
    const displayed = reviews.slice(0, maxItems);

    if (displayed.length === 0) return null;

    const avgRating = restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "—";

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}

            {/* Rating summary */}
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
                {displayed.map((review) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 5 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 p-4"
                    >
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 text-[11px] font-bold">
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
                            <div className="mt-3 pl-3 border-l-2 border-brand-500">
                                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-0.5">Réponse du restaurant</p>
                                <p className="text-sm text-surface-600 dark:text-surface-400">{review.response}</p>
                            </div>
                        )}
                        <p className="text-[11px] text-surface-400 mt-2">
                            {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// ── Hours & Location Section ───────────────────────────────────────────

export function HoursLocationSection({ restaurant, section }: { restaurant: ShowcaseRestaurant; section: ShowcaseSection }) {
    const hours = restaurant.openingHours;
    const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

    const normalizedHours = (() => {
        if (!hours) return null;

        if (Array.isArray(hours)) {
            const mapByDay: Record<string, { isOpen: boolean; from: string | null; to: string | null }> = {};
            for (const row of hours as any[]) {
                const dayOfWeek = Number(row?.dayOfWeek ?? row?.day_of_week);
                const dayKey = Number.isFinite(dayOfWeek)
                    ? ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek]
                    : null;
                if (!dayKey) continue;

                const isClosed = Boolean(row?.isClosed ?? row?.is_closed);
                const openTime = row?.openTime ?? row?.open_time ?? null;
                const closeTime = row?.closeTime ?? row?.close_time ?? null;
                mapByDay[dayKey] = {
                    isOpen: !isClosed,
                    from: openTime,
                    to: closeTime,
                };
            }
            return mapByDay;
        }

        if (typeof hours === "object") {
            const result: Record<string, { isOpen: boolean; from: string | null; to: string | null }> = {};
            for (const day of dayOrder) {
                const raw = (hours as any)?.[day];
                if (!raw || typeof raw !== "object") {
                    result[day] = { isOpen: false, from: null, to: null };
                    continue;
                }

                const isOpen =
                    typeof raw.isOpen === "boolean"
                        ? raw.isOpen
                        : typeof raw.open === "boolean"
                            ? raw.open
                            : Boolean(raw.from ?? raw.open ?? raw.openTime);

                result[day] = {
                    isOpen,
                    from: raw.open ?? raw.from ?? raw.openTime ?? raw.open_time ?? null,
                    to: raw.close ?? raw.to ?? raw.closeTime ?? raw.close_time ?? null,
                };
            }
            return result;
        }

        return null;
    })();

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact info */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <h3 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin size={18} /> Nous trouver
                    </h3>
                    <div className="space-y-3">
                        {restaurant.address && (
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-surface-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm text-surface-700 dark:text-surface-300">{restaurant.address}</p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">{restaurant.city}</p>
                                </div>
                            </div>
                        )}
                        {restaurant.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-surface-400 shrink-0" />
                                <a href={`tel:${restaurant.phone}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
                                    {restaurant.phone}
                                </a>
                            </div>
                        )}
                        {restaurant.email && (
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-surface-400 shrink-0" />
                                <a href={`mailto:${restaurant.email}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
                                    {restaurant.email}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Delivery info */}
                    <div className="mt-5 pt-4 border-t border-surface-100 dark:border-surface-800 space-y-2">
                        {restaurant.deliveryFee > 0 && (
                            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                <Bike size={14} className="text-surface-400" />
                                <span>Frais de livraison : <strong className="text-surface-900 dark:text-white">{formatCFA(restaurant.deliveryFee)}</strong></span>
                            </div>
                        )}
                        {restaurant.minOrderAmount > 0 && (
                            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                <span className="text-surface-400 text-xs">Min.</span>
                                <span>Commande minimum : <strong className="text-surface-900 dark:text-white">{formatCFA(restaurant.minOrderAmount)}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Opening hours */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
                    <h3 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock size={18} /> Horaires d&apos;ouverture
                    </h3>
                    {normalizedHours ? (
                        <div className="space-y-2">
                            {dayOrder.map(day => {
                                const dayData = normalizedHours[day];
                                const isOpen = Boolean(dayData?.isOpen);
                                return (
                                    <div key={day} className="flex items-center justify-between py-1.5 border-b border-surface-50 dark:border-surface-800/50 last:border-0">
                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                            {dayLabels[day]}
                                        </span>
                                        <span className={`text-sm font-bold ${isOpen ? "text-surface-900 dark:text-white" : "text-surface-400"}`}>
                                            {isOpen ? `${dayData?.from || "—"} — ${dayData?.to || "—"}` : "Fermé"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-surface-500 dark:text-surface-400">Horaires non renseignés.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

// ── Team Section ───────────────────────────────────────────────────────

export function TeamSection({ section, teamMembers }: { section: ShowcaseSection; teamMembers: ShowcaseTeamMember[] }) {
    const legacyMembers: Array<{ name: string; role: string; imageUrl?: string; bio?: string }> = section.content?.members ?? [];
    const memberOverrides = section.content?.memberOverrides && typeof section.content.memberOverrides === "object"
        ? section.content.memberOverrides
        : {};

    const autoMembers = (teamMembers ?? []).map((member, index) => {
        const override = memberOverrides[member.userId] ?? {};
        return {
            id: member.userId,
            name: (override.displayName || member.name || "Membre").trim(),
            role: (override.displayRole || member.role || "").trim(),
            imageUrl: (override.imageUrl || member.imageUrl || "").trim(),
            bio: (override.bio || "").trim(),
            hidden: Boolean(override.hidden),
            sortOrder: typeof override.sortOrder === "number" ? override.sortOrder : index,
        };
    });

    const normalizedAutoMembers = autoMembers
        .filter(member => !member.hidden)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const members = normalizedAutoMembers.length > 0
        ? normalizedAutoMembers
        : legacyMembers.map((member, index) => ({
            id: `legacy-${index}`,
            name: (member.name || "Membre").trim(),
            role: (member.role || "").trim(),
            imageUrl: (member.imageUrl || "").trim(),
            bio: (member.bio || "").trim(),
        }));

    if (members.length === 0 && !section.content?.text && !section.title && !section.subtitle) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}

            {section.content?.text && (
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-8">{section.content.text}</p>
            )}

            {members.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {members.map((member) => (
                        <div key={member.id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 text-center">
                            <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-surface-100 dark:bg-surface-800 overflow-hidden">
                                {member.imageUrl ? (
                                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-surface-300 text-xl font-bold">
                                        {member.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h4 className="text-sm font-bold text-surface-900 dark:text-white">{member.name}</h4>
                            {member.role && (
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{member.role}</p>
                            )}
                            {member.bio && (
                                <p className="text-xs text-surface-600 dark:text-surface-400 mt-2 leading-relaxed">{member.bio}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

// ── Specials Section ───────────────────────────────────────────────────

export function SpecialsSection({ restaurant, section }: { restaurant: ShowcaseRestaurant; section: ShowcaseSection }) {
    const specials: Array<{ title: string; description?: string; imageUrl?: string; price?: number; badge?: string }> = section.content?.items ?? [];

    if (specials.length === 0 && !section.title && !section.subtitle) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {specials.map((item, i) => (
                    <div
                        key={i}
                        className="relative bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden"
                    >
                        {item.imageUrl && (
                            <div className="h-40 bg-surface-100 dark:bg-surface-800">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-5">
                            {item.badge && (
                                <span
                                    className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg mb-2 text-white"
                                    style={{ backgroundColor: restaurant.primaryColor || "#f97316" }}
                                >
                                    {item.badge}
                                </span>
                            )}
                            <h4 className="text-base font-bold text-surface-900 dark:text-white">{item.title}</h4>
                            {item.description && (
                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{item.description}</p>
                            )}
                            {item.price != null && (
                                <p className="text-sm font-extrabold mt-2" style={{ color: restaurant.primaryColor || "#f97316" }}>
                                    {formatCFA(item.price)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Custom Section ─────────────────────────────────────────────────────

export function CustomSection({ section }: { section: ShowcaseSection }) {
    const text = section.content?.text;
    const imageUrl = section.content?.imageUrl;
    const galleryImages: string[] = Array.isArray(section.content?.galleryImages) ? section.content.galleryImages : [];
    const buttons: Array<{ label: string; url: string }> = Array.isArray(section.content?.buttons) ? section.content.buttons : [];
    const tableHeaders: string[] = Array.isArray(section.content?.table?.headers) ? section.content.table.headers : [];
    const tableRows: string[][] = Array.isArray(section.content?.table?.rows) ? section.content.table.rows : [];

    const hasContent = Boolean(text) || Boolean(imageUrl) || galleryImages.length > 0 || buttons.length > 0 || tableRows.length > 0;
    if (!hasContent && !section.title && !section.subtitle) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            {section.title && (
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white mb-2">{section.title}</h2>
            )}
            {section.subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{section.subtitle}</p>
            )}
            {imageUrl && (
                <img src={imageUrl} alt="" className="w-full max-h-72 object-cover rounded-2xl mb-6" />
            )}
            {text && (
                <div className="text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-line">{text}</div>
            )}

            {galleryImages.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((url, index) => (
                        <div key={`${url}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}

            {buttons.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                    {buttons
                        .filter(button => button?.label && button?.url)
                        .map((button, index) => (
                            <a
                                key={`${button.url}-${index}`}
                                href={button.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm font-semibold text-surface-700 dark:text-surface-300 hover:border-brand-500 hover:text-brand-600 transition-colors"
                            >
                                {button.label} <ExternalLink size={14} />
                            </a>
                        ))}
                </div>
            )}

            {tableHeaders.length > 0 && tableRows.length > 0 && (
                <div className="mt-6 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                    <table className="min-w-full text-sm">
                        <thead className="bg-surface-50 dark:bg-surface-800/60">
                            <tr>
                                {tableHeaders.map((header, index) => (
                                    <th key={`${header}-${index}`} className="text-left px-4 py-2.5 text-xs font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t border-surface-100 dark:border-surface-800">
                                    {tableHeaders.map((_, colIndex) => (
                                        <td key={colIndex} className="px-4 py-2.5 text-surface-700 dark:text-surface-300">
                                            {row[colIndex] ?? "—"}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

// ── CTA (Call to Action) Section ───────────────────────────────────────

export function CtaSection({ restaurant, section, onOrder }: { restaurant: ShowcaseRestaurant; section: ShowcaseSection; onOrder: () => void }) {
    const text = section.content?.text || "Envie de goûter ? Passez votre commande en ligne !";
    const buttonLabel = section.content?.buttonLabel || "Commander maintenant";

    return (
        <section
            className="py-16 text-center"
            style={{ background: `linear-gradient(135deg, ${restaurant.primaryColor || "#f97316"}11, ${restaurant.primaryColor || "#f97316"}25)` }}
        >
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-white mb-4">{text}</h2>
                <button
                    onClick={onOrder}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1"
                    style={{ backgroundColor: restaurant.primaryColor || "#f97316" }}
                >
                    {buttonLabel} <ArrowRight size={18} />
                </button>
            </div>
        </section>
    );
}

// ── Section Renderer (dispatches to the right component) ───────────────

export function ShowcaseSectionRenderer({
    section,
    restaurant,
    products,
    categories,
    reviews,
    teamMembers,
    onOrder,
}: {
    section: ShowcaseSection;
    restaurant: ShowcaseRestaurant;
    products: ShowcaseProduct[];
    categories: ShowcaseCategory[];
    reviews: ShowcaseReview[];
    teamMembers: ShowcaseTeamMember[];
    onOrder: () => void;
}) {
    switch (section.section_type) {
        case "hero":
            return <HeroSection restaurant={restaurant} section={section} />;
        case "about":
            return <AboutSection restaurant={restaurant} section={section} />;
        case "menu_highlights":
            return <MenuHighlightsSection restaurant={restaurant} section={section} products={products} onOrder={onOrder} />;
        case "full_menu":
            return <FullMenuSection restaurant={restaurant} section={section} products={products} categories={categories} onOrder={onOrder} />;
        case "gallery":
            return <GallerySection restaurant={restaurant} section={section} />;
        case "reviews":
            return <ReviewsSection restaurant={restaurant} section={section} reviews={reviews} />;
        case "hours_location":
            return <HoursLocationSection restaurant={restaurant} section={section} />;
        case "team":
            return <TeamSection section={section} teamMembers={teamMembers} />;
        case "specials":
            return <SpecialsSection restaurant={restaurant} section={section} />;
        case "custom":
            return <CustomSection section={section} />;
        case "cta":
            return <CtaSection restaurant={restaurant} section={section} onOrder={onOrder} />;
        default:
            return null;
    }
}
