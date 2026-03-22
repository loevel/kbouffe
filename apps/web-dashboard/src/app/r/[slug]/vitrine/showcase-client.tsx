"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, Loader2, Share2, Copy, Check } from "lucide-react";
import {
    ShowcaseSectionRenderer,
    type ShowcaseSection,
    type ShowcaseRestaurant,
    type ShowcaseProduct,
    type ShowcaseCategory,
    type ShowcaseReview,
    type ShowcaseTeamMember,
} from "@/components/showcase/ShowcaseSections";

interface StoreData {
    restaurant: ShowcaseRestaurant;
    categories: ShowcaseCategory[];
    products: ShowcaseProduct[];
    reviews: ShowcaseReview[];
    showcaseSections: ShowcaseSection[];
    teamMembers?: ShowcaseTeamMember[];
}

function normalizeStoreData(payload: StoreData): StoreData {
    const restaurant = payload.restaurant ?? ({} as ShowcaseRestaurant);

    return {
        ...payload,
        restaurant: {
            ...restaurant,
            description: restaurant.description ?? null,
            logoUrl: restaurant.logoUrl ?? null,
            coverUrl: restaurant.coverUrl ?? null,
            address: restaurant.address ?? "",
            city: restaurant.city ?? "",
            phone: restaurant.phone ?? null,
            email: restaurant.email ?? null,
            cuisineType: restaurant.cuisineType ?? "african",
            primaryColor: restaurant.primaryColor ?? null,
            openingHours: restaurant.openingHours ?? null,
            rating: Number(restaurant.rating ?? 0),
            reviewCount: Number(restaurant.reviewCount ?? 0),
            orderCount: Number(restaurant.orderCount ?? 0),
            isVerified: Boolean(restaurant.isVerified),
            isPremium: Boolean(restaurant.isPremium),
            hasDineIn: Boolean(restaurant.hasDineIn),
            hasReservations: Boolean(restaurant.hasReservations),
            totalTables: Number(restaurant.totalTables ?? 0),
            deliveryFee: Number(restaurant.deliveryFee ?? 0),
            minOrderAmount: Number(restaurant.minOrderAmount ?? 0),
        },
        categories: Array.isArray(payload.categories) ? payload.categories : [],
        products: Array.isArray(payload.products) ? payload.products : [],
        reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
        showcaseSections: Array.isArray(payload.showcaseSections) ? payload.showcaseSections : [],
        teamMembers: Array.isArray(payload.teamMembers) ? payload.teamMembers : [],
    };
}

export function ShowcasePageClient({ slug }: { slug: string }) {
    const router = useRouter();
    const [data, setData] = useState<StoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
        fetch(`${API_URL}/api/store/${slug}`)
            .then(r => {
                if (!r.ok) throw new Error("Restaurant non trouvé");
                return r.json();
            })
            .then((d: StoreData) => setData(normalizeStoreData(d)))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [slug]);

    const handleOrder = useCallback(() => {
        router.push(`/r/${slug}`);
    }, [router, slug]);

    const handleShare = useCallback(async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: data?.restaurant.name, url });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
                <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-surface-950 gap-4">
                <ChefHat size={48} className="text-surface-300" />
                <p className="text-surface-500 text-lg font-medium">{error || "Restaurant non trouvé"}</p>
                <Link href="/stores" className="text-brand-500 hover:underline text-sm font-medium">
                    Voir tous les restaurants
                </Link>
            </div>
        );
    }

    const { restaurant, products, categories, reviews, showcaseSections, teamMembers } = data;
    const sections = showcaseSections?.length > 0 ? showcaseSections : [];

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* Share FAB */}
            <button
                onClick={handleShare}
                className="fixed bottom-6 right-6 z-40 p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-lg rounded-full hover:shadow-xl transition-all group"
                title="Partager"
            >
                {copied ? (
                    <Check size={20} className="text-green-500" />
                ) : (
                    <Share2 size={20} className="text-surface-600 dark:text-surface-400 group-hover:text-brand-500 transition-colors" />
                )}
            </button>

            {/* Dynamic sections */}
            {sections.map(section => (
                <ShowcaseSectionRenderer
                    key={section.id}
                    section={section}
                    restaurant={restaurant}
                    products={products}
                    categories={categories}
                    reviews={reviews}
                    teamMembers={teamMembers ?? []}
                    onOrder={handleOrder}
                />
            ))}

            {/* If no showcase sections configured yet, show basic info */}
            {sections.length === 0 && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
                    <div className="w-24 h-24 rounded-3xl mx-auto mb-6 bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ChefHat size={40} className="text-surface-300" />
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2">{restaurant.name}</h1>
                    {restaurant.description && (
                        <p className="text-surface-500 dark:text-surface-400 max-w-md mx-auto mb-6">{restaurant.description}</p>
                    )}
                    <Link
                        href={`/r/${slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm"
                        style={{ backgroundColor: restaurant.primaryColor || "#f97316" }}
                    >
                        Voir le menu & Commander
                    </Link>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-brand-500 text-white p-1.5 rounded-lg"><ChefHat size={16} /></div>
                        <span className="font-bold text-sm text-surface-900 dark:text-white">Kbouffe</span>
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-surface-400">
                        <Link href={`/r/${slug}`} className="hover:text-brand-500 transition-colors">Commander</Link>
                        <span>·</span>
                        <span>© {new Date().getFullYear()} {restaurant.name}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
