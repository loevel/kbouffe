"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Store, ChevronRight, Star, Clock, TrendingUp, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocale } from "@kbouffe/module-core/ui";

export function Hero() {
    const { t } = useLocale();
    const rotatingWords = t.landing.heroWords;
    const [currentWord, setCurrentWord] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [restaurantName, setRestaurantName] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
                setIsAnimating(false);
            }, 300);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-surface-950">
            {/* Background grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

            {/* Gradient orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-500/15 blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-400/10 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 pt-32 pb-20 md:pt-40 md:pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left — Text content */}
                    <div>
                        {/* Badge */}
                        <div className="flex justify-center md:justify-start mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium">
                                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                                {t.landing.heroNew}
                                <ChevronRight size={14} />
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 text-center md:text-left leading-[1.05]">
                            {t.landing.heroTitle}
                            <span className="relative inline-block">
                                <span
                                    className={`text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-300 ${
                                        isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                                    }`}
                                >
                                    {rotatingWords[currentWord]}
                                </span>
                                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-500 rounded-full" />
                            </span>
                        </h1>

                        <p className="text-xl text-surface-400 mb-10 max-w-xl text-center md:text-left leading-relaxed">
                            {t.landing.heroDesc}
                        </p>

                        {/* Signup form */}
                        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto md:mx-0 mb-5">
                            <div className="flex-1 relative">
                                <Store size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
                                <input
                                    type="text"
                                    placeholder={t.landing.heroPlaceholder}
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-surface-700 rounded-xl text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent backdrop-blur-sm transition-all text-lg"
                                />
                            </div>
                            <Link
                                href={`/register${restaurantName ? `?restaurant=${encodeURIComponent(restaurantName)}` : ""}`}
                                className="flex items-center justify-center gap-2 px-7 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 whitespace-nowrap"
                            >
                                {t.landing.heroCta}
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                        <p className="text-surface-500 text-sm text-center md:text-left mb-12">
                            {t.landing.heroCtaSub}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/5 border border-surface-800">
                            <div className="text-center md:text-left">
                                <div className="text-3xl font-bold text-white mb-1">0%</div>
                                <div className="text-surface-400 text-xs">{t.landing.statsCommission}</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="text-3xl font-bold text-white mb-1">2 min</div>
                                <div className="text-surface-400 text-xs">{t.landing.statsSetup}</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="text-3xl font-bold text-brand-400 mb-1">MoMo</div>
                                <div className="text-surface-400 text-xs">MTN & Orange</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                                <div className="text-surface-400 text-xs">{t.landing.statsOnline}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right — Visual mockup */}
                    <div className="hidden lg:flex flex-col items-center justify-center relative">
                        {/* Phone frame */}
                        <div className="relative w-72 bg-surface-900 rounded-[2.5rem] border-2 border-surface-700 shadow-2xl shadow-brand-500/10 overflow-hidden">
                            {/* Status bar */}
                            <div className="flex items-center justify-between px-6 pt-4 pb-2 bg-surface-900">
                                <span className="text-white text-xs font-semibold">9:41</span>
                                <div className="w-20 h-4 bg-black rounded-full" />
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-full bg-surface-600" />
                                    <div className="w-3 h-3 rounded-full bg-surface-600" />
                                </div>
                            </div>

                            {/* App header */}
                            <div className="px-4 py-3 bg-surface-900 flex items-center justify-between border-b border-surface-800">
                                <div>
                                    <p className="text-surface-400 text-xs">Bonjour 👋</p>
                                    <p className="text-white text-sm font-bold">Jean Kamga</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">JK</span>
                                </div>
                            </div>

                            {/* Promo banner */}
                            <div className="mx-3 mt-3 rounded-2xl overflow-hidden relative h-24">
                                <Image
                                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"
                                    alt="Promo"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-4">
                                    <div>
                                        <p className="text-white text-xs font-bold">-20% ce weekend</p>
                                        <p className="text-white/70 text-[10px]">Chez Le Tchop Gourmet</p>
                                    </div>
                                </div>
                            </div>

                            {/* Category chips */}
                            <div className="flex gap-2 px-3 mt-3 overflow-x-hidden">
                                {["🔥 Tout", "🍗 Local", "🍔 Burgers", "🍕 Pizza"].map((cat) => (
                                    <div key={cat} className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold ${cat.startsWith("🔥") ? "bg-brand-500 text-white" : "bg-surface-800 text-surface-300"}`}>
                                        {cat}
                                    </div>
                                ))}
                            </div>

                            {/* Restaurant cards */}
                            <div className="px-3 mt-3 space-y-2 pb-4">
                                {[
                                    { name: "Le Tchop Gourmet", time: "30 min", rating: "4.8", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80" },
                                    { name: "Burger Corner", time: "20 min", rating: "4.5", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80" },
                                ].map((r) => (
                                    <div key={r.name} className="flex items-center gap-3 bg-surface-800 rounded-xl p-2.5">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                            <Image src={r.img} alt={r.name} fill className="object-cover" unoptimized />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-semibold truncate">{r.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-0.5">
                                                    <Star size={9} className="text-yellow-400" fill="currentColor" />
                                                    <span className="text-surface-400 text-[10px]">{r.rating}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <Clock size={9} className="text-surface-400" />
                                                    <span className="text-surface-400 text-[10px]">{r.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                            <ArrowRight size={10} className="text-brand-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating order notification */}
                        <div className="absolute -bottom-4 -left-10 w-56 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-100 dark:border-surface-700 p-4 flex items-center gap-3 animate-bounce-slow">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                <ShoppingBag size={18} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-surface-900 dark:text-white text-xs font-semibold">{t.landing.previewNewOrder}</p>
                                <p className="text-surface-500 dark:text-surface-400 text-[10px]">Poisson Braise x1 · 6 500 FCFA</p>
                            </div>
                        </div>

                        {/* Floating revenue card */}
                        <div className="absolute -top-4 -right-6 w-48 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-100 dark:border-surface-700 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={14} className="text-green-500" />
                                <span className="text-surface-500 dark:text-surface-400 text-[10px] font-medium">{t.landing.previewDayRevenue}</span>
                            </div>
                            <p className="text-surface-900 dark:text-white text-lg font-bold">47 800 FCFA</p>
                            <p className="text-green-500 text-[10px] font-semibold mt-0.5">{t.landing.previewRevenueUp}</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
