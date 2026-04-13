"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Store, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function Hero() {
    const { locale } = useLocale();
    const copy = locale === "fr"
        ? {
            tag: "Conçu pour les restaurants modernes",
            titlePrefix: "Transformez votre restaurant en ",
            words: ["boutique en ligne", "machine à commandes", "succès digital", "business moderne"],
            description:
                "Votre vitrine en ligne gratuite. Recevez des commandes, encaissez en Mobile Money et boostez votre visibilité avec nos packs. Seulement 5% par transaction — 6x moins que la concurrence.",
            placeholder: "Nom de votre établissement",
            cta: "Commencer gratuitement",
            ctaSub: "Gratuit pour toujours — Payez uniquement quand vous vendez",
            proofStrip: ["5% seulement", "En ligne en 2 min", "MoMo Intégré"],
            trustSignals: ["✓ Aucune carte bancaire requise", "✓ 1 000+ restaurants actifs", "✓ Support WhatsApp 24/7"],
            stats: [
                { value: "5%", label: "vs 30% ailleurs" },
                { value: "2 min", label: "pour démarrer" },
                { value: "24/7", label: "commandes" },
            ],
            floatingLabel: "Nouvelle commande ! 🎉",
            floatingDesc: "Poisson Braisé x1 • 6 500 FCFA",
            floatingTime: "À l'instant",
        }
        : {
            tag: "Built for modern restaurants",
            titlePrefix: "Transform your restaurant into a ",
            words: ["digital store", "smart kitchen", "digital success", "modern business"],
            description:
                "Your free online storefront. Receive orders, collect Mobile Money payments, and boost visibility with our packs. Only 5% per transaction — 6x less than the competition.",
            placeholder: "Your business name",
            cta: "Start free",
            ctaSub: "Free forever — Only pay when you sell",
            proofStrip: ["Only 5%", "Online in 2 mins", "MoMo Integrated"],
            trustSignals: ["✓ No credit card required", "✓ 1,000+ active restaurants", "✓ 24/7 WhatsApp support"],
            stats: [
                { value: "5%", label: "vs 30% elsewhere" },
                { value: "2 mins", label: "setup time" },
                { value: "24/7", label: "orders" },
            ],
            floatingLabel: "New order! 🎉",
            floatingDesc: "Grilled Fish x1 • 6,500 FCFA",
            floatingTime: "Just now",
        };
    
    const rotatingWords = copy.words;
    const [currentWord, setCurrentWord] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
                setIsAnimating(false);
            }, 300);
        }, 3000);
        return () => clearInterval(interval);
    }, [rotatingWords.length]);

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-surface-950">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_40%)]" />
            
            <div className="container mx-auto px-4 md:px-6 relative z-10 pt-32 pb-20 md:pt-40 md:pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    
                    {/* Left text column */}
                    <div className="lg:col-span-6 flex flex-col justify-center text-center md:text-left">
                        
                        <div className="flex justify-center md:justify-start mb-6">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium"
                            >
                                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                                {copy.tag}
                            </motion.div>
                        </div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]"
                        >
                            {copy.titlePrefix}
                            <br className="hidden md:block" />
                            <span className="relative inline-block mt-2">
                                <span
                                    className={`text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-300 block ${
                                        isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                                    }`}
                                >
                                    {rotatingWords[currentWord]}.
                                </span>
                            </span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-surface-300 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed font-light"
                        >
                            {copy.description}
                        </motion.p>

                        {/* Proof Strip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mb-10 flex flex-wrap justify-center gap-4 md:justify-start"
                        >
                            {copy.proofStrip.map((item) => (
                                <span key={item} className="flex items-center gap-2 text-sm font-medium text-surface-200">
                                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                                    {item}
                                </span>
                            ))}
                        </motion.div>

                        {/* Trust Signals */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="mb-10 flex flex-wrap justify-center gap-3 md:justify-start"
                        >
                            {copy.trustSignals.map((signal) => (
                                <span key={signal} className="text-xs font-medium text-surface-400">
                                    {signal}
                                </span>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center md:items-start gap-4 max-w-xl mx-auto md:mx-0 mb-6"
                        >
                            <Link
                                href="/register/restaurant"
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-2xl text-lg font-semibold transition-all shadow-lg shadow-brand-500/25 whitespace-nowrap"
                            >
                                {copy.cta}
                                <ArrowRight size={20} />
                            </Link>
                        </motion.div>
                        
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-surface-500 text-sm text-center md:text-left"
                        >
                            {copy.ctaSub}
                        </motion.p>
                    </div>

                    {/* Right visual column */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="lg:col-span-6 relative flex justify-center lg:justify-end"
                    >
                        {/* Main realistic image (from Unsplash) */}
                        <div className="relative w-full max-w-[500px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                            <Image 
                                src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=2000&auto=format&fit=crop"
                                alt="Delicious grilled food meal" 
                                fill 
                                className="object-cover"
                                priority
                            />
                            {/* Inner dark gradient overlay for text legibility if needed */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        {/* Floating Glassmorphic UI Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8, type: "spring" }}
                            className="absolute -bottom-6 -left-6 md:left-4 lg:-left-12 w-72 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-green-400">
                                        <Store size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{copy.floatingLabel}</p>
                                        <p className="text-xs text-surface-300">{copy.floatingTime}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl bg-black/40 p-3 border border-white/5">
                                <p className="text-sm font-medium text-white">{copy.floatingDesc}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-brand-400 font-medium bg-brand-500/20 px-2 py-1 rounded-md">Payé MoMo</span>
                                    <span className="text-xs text-surface-400">Table 4</span>
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>
            </div>
        </section>
    );
}
