"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Tag,
    Star,
    ChevronLeft,
    ChevronRight,
    Plus,
    Loader2,
    AlertCircle,
    Flame,
    ArrowLeft,
    ShoppingBag,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { toast } from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────
interface OfferProduct {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number;
    discountPct: number;
    imageUrl: string | null;
    description: string | null;
}

interface OfferGroup {
    restaurantId: string;
    restaurantName: string;
    restaurantSlug: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    city: string;
    rating: number | null;
    deliveryFee: number | null;
    products: OfferProduct[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
    return n.toLocaleString("fr-CM") + " FCFA";
}

// ── Discount Badge ────────────────────────────────────────────────────────────
function DiscountBadge({ pct }: { pct: number }) {
    return (
        <span className="absolute top-2 left-2 z-10 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow">
            -{pct}%
        </span>
    );
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
    product,
    restaurant,
}: {
    product: OfferProduct;
    restaurant: OfferGroup;
}) {
    const { addItem } = useCart();
    const [adding, setAdding] = useState(false);

    function handleAdd(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setAdding(true);
        addItem(
            { id: restaurant.restaurantId, name: restaurant.restaurantName, slug: restaurant.restaurantSlug },
            { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl }
        );
        toast.success(`${product.name} ajouté au panier`, { duration: 1500 });
        setTimeout(() => setAdding(false), 600);
    }

    return (
        <Link
            href={`/r/${restaurant.restaurantSlug}`}
            className="group shrink-0 w-[160px] sm:w-[180px] flex flex-col rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden hover:shadow-md transition-all duration-200"
        >
            {/* Image */}
            <div className="relative h-[110px] bg-surface-100 dark:bg-surface-800 overflow-hidden">
                <DiscountBadge pct={product.discountPct} />
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="180px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍽️
                    </div>
                )}
                {/* Add Button */}
                <button
                    onClick={handleAdd}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-surface-900 shadow-md flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white transition-all active:scale-90"
                >
                    {adding ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Plus size={16} strokeWidth={2.5} />
                    )}
                </button>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-1">
                <p className="text-sm font-semibold text-surface-900 dark:text-white line-clamp-2 leading-tight">
                    {product.name}
                </p>
                <div className="flex items-baseline gap-1.5 mt-auto pt-1">
                    <span className="text-sm font-black text-rose-500">
                        {formatPrice(product.price)}
                    </span>
                    <span className="text-[11px] text-surface-400 line-through">
                        {formatPrice(product.compareAtPrice)}
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ── Restaurant Row ────────────────────────────────────────────────────────────
function RestaurantRow({ group }: { group: OfferGroup }) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: number) => {
        rowRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
    };

    const maxDiscount = Math.max(...group.products.map((p) => p.discountPct));

    return (
        <section className="mb-8">
            {/* Restaurant Header */}
            <div className="flex items-center justify-between mb-3">
                <Link
                    href={`/r/${group.restaurantSlug}`}
                    className="flex items-center gap-3 group"
                >
                    {/* Logo */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 bg-surface-100 dark:bg-surface-800 shrink-0">
                        {group.logoUrl ? (
                            <Image
                                src={group.logoUrl}
                                alt={group.restaurantName}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍴</div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-surface-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {group.restaurantName}
                            </h2>
                            {maxDiscount >= 30 && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    <Flame size={9} />
                                    Jusqu&apos;à -{maxDiscount}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                            {group.rating && (
                                <span className="flex items-center gap-0.5">
                                    <Star size={11} className="text-amber-400 fill-amber-400" />
                                    {group.rating.toFixed(1)}
                                </span>
                            )}
                            <span>{group.city}</span>
                            {group.deliveryFee !== null && (
                                <span>
                                    {group.deliveryFee === 0
                                        ? "Livraison gratuite"
                                        : `${formatPrice(group.deliveryFee)} livraison`}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Scroll arrows – desktop only */}
                <div className="hidden sm:flex items-center gap-1">
                    <button
                        onClick={() => scroll(-1)}
                        className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white hover:border-surface-400 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white hover:border-surface-400 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Horizontal product scroll */}
            <div
                ref={rowRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6 snap-x snap-mandatory"
            >
                {group.products.map((product) => (
                    <ProductCard key={product.id} product={product} restaurant={group} />
                ))}
                {/* See all link */}
                <Link
                    href={`/r/${group.restaurantSlug}`}
                    className="shrink-0 w-[120px] flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700 text-surface-400 dark:text-surface-600 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-all text-sm font-medium snap-start"
                >
                    <ShoppingBag size={20} />
                    <span className="text-xs text-center leading-tight">Voir le menu</span>
                </Link>
            </div>
        </section>
    );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ count }: { count: number }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400 p-6 sm:p-8 mb-8">
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute right-12 top-4 text-6xl sm:text-7xl opacity-80 select-none">
                🎁
            </div>

            <div className="relative z-10 max-w-sm">
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
                        Économies garanties
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                    Les meilleures offres du moment
                </h1>
                <p className="text-rose-100 text-sm font-medium">
                    {count > 0
                        ? `${count} article${count > 1 ? "s" : ""} en promotion aujourd'hui`
                        : "Des réductions exclusives, livrées chez vous"}
                </p>
            </div>
        </div>
    );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyOffers() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                Aucune offre disponible
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-xs">
                Revenez bientôt, de nouvelles promotions sont ajoutées régulièrement par nos restaurants partenaires.
            </p>
            <button
                onClick={() => router.push("/stores")}
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
            >
                Explorer les restaurants
            </button>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OffersClient() {
    const [groups, setGroups] = useState<OfferGroup[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"articles" | "commerces">("articles");
    const router = useRouter();

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await fetch("/api/stores/offers");
                if (!res.ok) throw new Error("Erreur serveur");
                const data = await res.json();
                setGroups(data.groups ?? []);
                setTotalProducts(data.totalProducts ?? 0);
            } catch {
                setError("Impossible de charger les offres.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Tag size={18} className="text-rose-500" />
                        <h1 className="text-base font-bold text-surface-900 dark:text-white">Offres</h1>
                    </div>
                    {totalProducts > 0 && (
                        <span className="ml-auto text-xs text-surface-400 dark:text-surface-500">
                            {totalProducts} article{totalProducts > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                {/* Hero */}
                {!loading && !error && <HeroBanner count={totalProducts} />}

                {/* Tabs */}
                {!loading && !error && groups.length > 0 && (
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: "articles" as const, label: "Articles en promo" },
                            { id: "commerces" as const, label: `Commerces (${groups.length})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                                    activeTab === tab.id
                                        ? "bg-surface-900 dark:bg-white border-surface-900 dark:border-white text-white dark:text-surface-900"
                                        : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={36} className="text-rose-400 animate-spin" />
                        <p className="text-surface-500 dark:text-surface-400 text-sm">
                            Chargement des offres...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <AlertCircle size={40} className="text-rose-400" />
                        <p className="text-surface-600 dark:text-surface-400">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && groups.length === 0 && <EmptyOffers />}

                {/* Articles tab — restaurant rows with horizontal product scrolls */}
                {!loading && !error && groups.length > 0 && activeTab === "articles" && (
                    <div>
                        {groups.map((group) => (
                            <RestaurantRow key={group.restaurantId} group={group} />
                        ))}
                    </div>
                )}

                {/* Commerces tab — restaurant grid cards */}
                {!loading && !error && groups.length > 0 && activeTab === "commerces" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {groups.map((group) => {
                            const maxDiscount = Math.max(...group.products.map((p) => p.discountPct));
                            return (
                                <Link
                                    key={group.restaurantId}
                                    href={`/r/${group.restaurantSlug}`}
                                    className="group flex items-center gap-4 p-4 rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 hover:shadow-md transition-all"
                                >
                                    {/* Banner/logo */}
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-800">
                                        {group.logoUrl ? (
                                            <Image
                                                src={group.logoUrl}
                                                alt={group.restaurantName}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">🍴</div>
                                        )}
                                        {/* Discount overlay */}
                                        <div className="absolute inset-x-0 bottom-0 bg-rose-500 text-white text-[10px] font-black text-center py-0.5">
                                            -{maxDiscount}%
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-surface-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                                            {group.restaurantName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                            {group.rating && (
                                                <span className="flex items-center gap-0.5">
                                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                                    {group.rating.toFixed(1)}
                                                </span>
                                            )}
                                            <span>{group.city}</span>
                                        </div>
                                        <p className="text-xs text-rose-500 font-semibold mt-1">
                                            {group.products.length} article{group.products.length > 1 ? "s" : ""} en promo
                                        </p>
                                    </div>

                                    <ChevronRight
                                        size={18}
                                        className="text-surface-300 dark:text-surface-600 group-hover:text-surface-500 dark:group-hover:text-surface-400 shrink-0 transition-colors"
                                    />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
