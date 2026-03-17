"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Clock, ArrowRight, Bike } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";

const restaurants = [
    {
        name: "Chez Mama Ngono",
        cuisine: "Cuisine Camerounaise",
        location: "Douala, Bonapriso",
        rating: 4.8,
        reviews: 124,
        deliveryTime: "25-35",
        deliveryFee: "500",
        cover: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
        badge: "Populaire",
        badgeColor: "bg-brand-500",
    },
    {
        name: "Le Ndole Royal",
        cuisine: "Spécialités du Littoral",
        location: "Yaoundé, Bastos",
        rating: 4.9,
        reviews: 89,
        deliveryTime: "30-40",
        deliveryFee: "Gratuite",
        cover: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
        badge: "Top noté",
        badgeColor: "bg-green-500",
    },
    {
        name: "Grillades du Carrefour",
        cuisine: "Braise & Grillades",
        location: "Douala, Akwa",
        rating: 4.7,
        reviews: 203,
        deliveryTime: "20-30",
        deliveryFee: "300",
        cover: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&q=80",
        badge: "Rapide",
        badgeColor: "bg-amber-500",
    },
    {
        name: "La Terrasse Bamiléké",
        cuisine: "Cuisine de l'Ouest",
        location: "Bafoussam, Centre",
        rating: 4.6,
        reviews: 67,
        deliveryTime: "35-45",
        deliveryFee: "400",
        cover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
        badge: "Nouveau",
        badgeColor: "bg-violet-500",
    },
];

export function Restaurants() {
    const { t } = useLocale();
    return (
        <section id="restaurants" className="py-24 md:py-32 bg-white dark:bg-surface-950 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">
                            {t.landing.restaurantsTag}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-surface-900 dark:text-white">
                            {t.landing.restaurantsTitle}
                        </h2>
                        <p className="text-lg text-surface-600 dark:text-surface-400">
                            {t.landing.restaurantsDesc}
                        </p>
                    </div>
                    <Link
                        href="/stores"
                        className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 font-semibold transition-colors shrink-0"
                    >
                        {t.landing.restaurantsViewAll}
                        <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {restaurants.map((restaurant, index) => (
                        <div
                            key={index}
                            className="group rounded-2xl overflow-hidden border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                        >
                            {/* Cover image */}
                            <div className="relative h-44 overflow-hidden">
                                <Image
                                    src={restaurant.cover}
                                    alt={restaurant.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    unoptimized
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Badge */}
                                <div className={`absolute top-3 left-3 px-2.5 py-1 ${restaurant.badgeColor} rounded-lg text-white text-xs font-semibold shadow-lg`}>
                                    {restaurant.badge}
                                </div>

                                {/* Delivery time */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                                    <Clock size={11} />
                                    {restaurant.deliveryTime} min
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-1.5">
                                    <h3 className="text-base font-bold text-surface-900 dark:text-white leading-tight">
                                        {restaurant.name}
                                    </h3>
                                    <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                                        <Star size={12} className="text-green-600 dark:text-green-400" fill="currentColor" />
                                        <span className="text-sm font-bold text-green-700 dark:text-green-400">{restaurant.rating}</span>
                                    </div>
                                </div>

                                <p className="text-brand-500 font-medium text-sm mb-2">{restaurant.cuisine}</p>

                                <div className="flex items-center gap-1 text-surface-500 dark:text-surface-400 text-xs mb-3">
                                    <MapPin size={11} />
                                    {restaurant.location}
                                </div>

                                <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                                        <Bike size={12} />
                                        {restaurant.deliveryFee === "Gratuite" ? (
                                            <span className="text-green-600 dark:text-green-400 font-semibold">{t.landing.freeDelivery}</span>
                                        ) : (
                                            <span>{restaurant.deliveryFee} FCFA</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-surface-400 dark:text-surface-500">({restaurant.reviews} {t.landing.reviews})</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
