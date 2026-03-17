"use client";

import Link from "next/link";
import { ShoppingBag, Store, Bike, Check, ArrowRight } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";

export function ForWho() {
    const { t } = useLocale();

    const cards = [
        {
            icon: ShoppingBag,
            badge: t.landing.forWhoClientBadge,
            badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
            title: t.landing.forWhoClientTitle,
            desc: t.landing.forWhoClientDesc,
            features: [
                t.landing.forWhoClientFeature1,
                t.landing.forWhoClientFeature2,
                t.landing.forWhoClientFeature3,
            ],
            cta: t.landing.forWhoClientCta,
            href: "/stores",
            gradient: "from-blue-500/20 to-transparent",
            ctaClass: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25",
            iconBg: "bg-blue-500/10 text-blue-400",
        },
        {
            icon: Store,
            badge: t.landing.forWhoRestaurantBadge,
            badgeColor: "text-brand-400 bg-brand-400/10 border-brand-400/20",
            title: t.landing.forWhoRestaurantTitle,
            desc: t.landing.forWhoRestaurantDesc,
            features: [
                t.landing.forWhoRestaurantFeature1,
                t.landing.forWhoRestaurantFeature2,
                t.landing.forWhoRestaurantFeature3,
            ],
            cta: t.landing.forWhoRestaurantCta,
            href: "/partenaires",
            gradient: "from-brand-500/20 to-transparent",
            ctaClass: "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25",
            iconBg: "bg-brand-500/10 text-brand-400",
            featured: true,
        },
    ];

    return (
        <section className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-brand-500/5 blur-[120px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-surface-800 text-surface-300 text-sm font-medium mb-6">
                        {t.landing.forWhoTag}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
                        {t.landing.forWhoTitle}
                    </h2>
                    <p className="text-lg md:text-xl text-surface-400 leading-relaxed">
                        {t.landing.forWhoDesc}
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {cards.map((card, i) => (
                        <div
                            key={i}
                            className={`relative group rounded-2xl border p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                                card.featured
                                    ? "bg-surface-900 border-brand-500/40 shadow-xl shadow-brand-500/10"
                                    : "bg-surface-900/60 border-surface-800 hover:border-surface-700"
                            }`}
                        >
                            {/* Glow on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                            {/* Popular badge */}
                            {card.featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-bold whitespace-nowrap shadow-lg shadow-brand-500/30">
                                        ⭐ Le plus populaire
                                    </span>
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col flex-1">
                                {/* Icon + badge */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                                        <card.icon size={22} />
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                                        {card.badge}
                                    </span>
                                </div>

                                {/* Title + desc */}
                                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                                <p className="text-surface-400 text-sm leading-relaxed mb-6">{card.desc}</p>

                                {/* Features */}
                                <ul className="space-y-2 mb-8">
                                    {card.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2.5 text-sm text-surface-300">
                                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-surface-700 flex items-center justify-center">
                                                <Check size={10} strokeWidth={3} className="text-surface-300" />
                                            </span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <div className="mt-auto">
                                    <Link
                                        href={card.href}
                                        className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${card.ctaClass}`}
                                    >
                                        {card.cta}
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
