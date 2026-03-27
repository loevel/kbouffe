"use client";

import Link from "next/link";
import { Eye, Megaphone, MessageSquare, ChefHat, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function MarketplacePacks() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Marketplace",
            title: "Boostez vos ventes quand vous le souhaitez",
            description:
                "Des packs a la carte pour augmenter votre visibilite et vos commandes. Pas d'abonnement — achetez uniquement ce qui vous rapporte.",
            cta: "Creer ma vitrine gratuite",
            packs: [
                {
                    icon: Eye,
                    title: "Visibilite",
                    description: "Apparaissez en tete des resultats et attirez plus de clients vers votre vitrine.",
                    price: "A partir de 5 000 FCFA",
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                    glow: "group-hover:bg-blue-500/10",
                },
                {
                    icon: Megaphone,
                    title: "Banniere pub",
                    description: "Affichez votre restaurant en banniere sur la page d'accueil de Kbouffe.",
                    price: "A partir de 10 000 FCFA",
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    glow: "group-hover:bg-amber-500/10",
                },
                {
                    icon: MessageSquare,
                    title: "SMS Promo",
                    description: "Envoyez des promotions directement sur le telephone de vos clients fideles.",
                    price: "A partir de 5 000 FCFA",
                    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                    glow: "group-hover:bg-purple-500/10",
                },
                {
                    icon: ChefHat,
                    title: "Boost Menu",
                    description: "Mettez en avant vos plats stars pour augmenter leur taux de commande.",
                    price: "A partir de 3 000 FCFA",
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    glow: "group-hover:bg-emerald-500/10",
                },
                {
                    icon: BarChart3,
                    title: "Analytics Pro",
                    description: "Comprenez ce qui se vend, quand et pourquoi. Prenez des decisions eclairees.",
                    price: "A partir de 5 000 FCFA",
                    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
                    glow: "group-hover:bg-pink-500/10",
                },
                {
                    icon: Sparkles,
                    title: "Pack Premium",
                    description: "Badge verifie, priorite support et toutes les fonctionnalites avancees reunies.",
                    price: "A partir de 15 000 FCFA",
                    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                    glow: "group-hover:bg-orange-500/10",
                },
            ],
        }
        : {
            tag: "Marketplace",
            title: "Boost your sales whenever you want",
            description:
                "A la carte packs to increase your visibility and orders. No subscription — only buy what brings you results.",
            cta: "Create my free storefront",
            packs: [
                {
                    icon: Eye,
                    title: "Visibility",
                    description: "Appear at the top of search results and attract more customers to your storefront.",
                    price: "From 5,000 FCFA",
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                    glow: "group-hover:bg-blue-500/10",
                },
                {
                    icon: Megaphone,
                    title: "Banner Ad",
                    description: "Display your restaurant as a banner on the Kbouffe homepage.",
                    price: "From 10,000 FCFA",
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    glow: "group-hover:bg-amber-500/10",
                },
                {
                    icon: MessageSquare,
                    title: "SMS Promo",
                    description: "Send promotions directly to your loyal customers' phones.",
                    price: "From 5,000 FCFA",
                    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                    glow: "group-hover:bg-purple-500/10",
                },
                {
                    icon: ChefHat,
                    title: "Menu Boost",
                    description: "Highlight your star dishes to increase their order rate.",
                    price: "From 3,000 FCFA",
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    glow: "group-hover:bg-emerald-500/10",
                },
                {
                    icon: BarChart3,
                    title: "Analytics Pro",
                    description: "Understand what sells, when and why. Make informed decisions.",
                    price: "From 5,000 FCFA",
                    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
                    glow: "group-hover:bg-pink-500/10",
                },
                {
                    icon: Sparkles,
                    title: "Premium Pack",
                    description: "Verified badge, priority support, and all advanced features combined.",
                    price: "From 15,000 FCFA",
                    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                    glow: "group-hover:bg-orange-500/10",
                },
            ],
        };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
    };

    return (
        <section className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/10 text-brand-400 text-sm font-semibold mb-6 backdrop-blur-sm"
                    >
                        {copy.tag}
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white"
                    >
                        {copy.title}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-surface-400 leading-relaxed"
                    >
                        {copy.description}
                    </motion.p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
                >
                    {copy.packs.map((pack, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="group relative p-8 rounded-[2rem] bg-surface-900/40 backdrop-blur-sm border border-white/5 transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl overflow-hidden"
                        >
                            <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${pack.glow}`} />

                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${pack.color}`}>
                                    <pack.icon className="h-6 w-6" />
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-brand-300 transition-colors">
                                    {pack.title}
                                </h3>

                                <p className="text-surface-400 leading-relaxed text-sm mb-6">
                                    {pack.description}
                                </p>

                                <div className="pt-4 border-t border-white/5">
                                    <span className="text-sm font-semibold text-brand-400">
                                        {pack.price}
                                    </span>
                                </div>
                            </div>

                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-16"
                >
                    <Link
                        href="/register/restaurant"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-brand-500 text-white rounded-full text-lg font-semibold overflow-hidden transition-all shadow-lg hover:shadow-brand-500/40 hover:-translate-y-1"
                    >
                        <span className="relative z-10">{copy.cta}</span>
                        <ArrowRight size={20} className="relative z-10 transition-transform group-hover:translate-x-1" />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
