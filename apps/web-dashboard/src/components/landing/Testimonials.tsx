"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

const testimonials = [
    {
        name: "Marie-Claire N.",
        role: "Propriétaire",
        restaurant: "Chez Mama Ngono",
        location: "Douala",
        quote: "Avant Kbouffe, je gérais mes commandes par WhatsApp et je perdais des clients. Maintenant j'ai un vrai menu en ligne et mes ventes ont doublé en 2 mois.",
        avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
        rating: 5,
        dishImg: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    },
    {
        name: "Paul-Emile T.",
        role: "Chef & Gérant",
        restaurant: "Grillades du Carrefour",
        location: "Douala",
        quote: "Le tableau de bord est incroyable. Je vois mes ventes en temps réel, je sais quels plats marchent le mieux. Et surtout, zéro commission sur mes ventes!",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
        rating: 5,
        dishImg: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    },
    {
        name: "Sandrine M.",
        role: "Gérante",
        restaurant: "Le Ndole Royal",
        location: "Yaoundé",
        quote: "Mes clients paient directement en Mobile Money. Plus besoin de gérer la monnaie ou de courir après les paiements. C'est un vrai game changer.",
        avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&q=80",
        rating: 5,
        dishImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    },
];

export function Testimonials() {
    const { t } = useLocale();
    return (
        <section className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-surface-800 text-surface-300 text-sm font-medium mb-6">
                        {t.landing.testimonialsTag}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
                        {t.landing.testimonialsTitle}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="relative bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-surface-700 hover:shadow-xl group"
                        >
                            {/* Dish image strip */}
                            <div className="relative h-28 overflow-hidden">
                                <Image
                                    src={testimonial.dishImg}
                                    alt={testimonial.restaurant}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-900" />
                                <div className="absolute bottom-3 left-4 text-xs text-white/70 font-medium">
                                    {testimonial.restaurant} · {testimonial.location}
                                </div>
                            </div>

                            <div className="p-6">
                                <Quote className="h-7 w-7 text-brand-500/40 mb-4" />

                                {/* Stars */}
                                <div className="flex gap-0.5 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
                                    ))}
                                </div>

                                <p className="text-surface-300 leading-relaxed mb-6 text-base">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>

                                <div className="flex items-center gap-3">
                                    <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-surface-700 shrink-0">
                                        <Image
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                                        <div className="text-surface-400 text-xs">{testimonial.role} — {testimonial.restaurant}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
