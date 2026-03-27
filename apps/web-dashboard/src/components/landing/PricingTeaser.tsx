"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown, Zap, Rocket, TrendingUp, ShieldCheck } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function PricingTeaser() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Modele transparent",
            title: "Gratuit pour demarrer. 5% quand vous vendez.",
            description: "Pas d'abonnement. Pas de frais caches. Vous ne payez que lorsque vos clients passent commande. Et avec nos packs optionnels, vous boostez votre visibilite quand vous le souhaitez.",
            bottomLine: "Glovo prend 30% sur chaque commande. Kbouffe prend 5%. Faites le calcul.",
            compareLabel: "Kbouffe vs la concurrence",
            compareLeftTitle: "Plateformes classiques",
            compareLeftItems: [
                "25-30% de commission par commande",
                "Le client appartient a la plateforme",
                "Aucune visibilite sur vos donnees",
                "Livraison imposee et couteuse",
            ],
            compareRightTitle: "Avec Kbouffe",
            compareRightItems: [
                "Seulement 5% par transaction",
                "Vos clients, votre marque, vos donnees",
                "Statistiques et rapports en temps reel",
                "Vous choisissez votre mode de livraison",
            ],
            freePlanName: "Vitrine",
            freePrice: "Gratuit",
            freePriceSub: "pour toujours",
            freeCta: "Creer ma vitrine",
            freeFeatures: [
                "Menu digital complet",
                "Commandes en ligne illimitees",
                "Paiements Mobile Money",
                "Notifications push",
                "QR code & lien unique",
                "5% par transaction uniquement",
            ],
            boostPlanName: "Packs Boost",
            boostPrice: "A partir de",
            boostPriceAmount: "3 000 FCFA",
            boostCta: "Voir les packs",
            boostLabel: "Croissance",
            boostFeatures: [
                "Visibilite en tete des resultats",
                "Banniere publicitaire sur la home",
                "SMS promotionnels a vos clients",
                "Mise en avant de vos plats stars",
                "Statistiques avancees",
                "Achetez uniquement ce dont vous avez besoin",
            ],
            trustItems: [
                { icon: ShieldCheck, text: "Aucun engagement" },
                { icon: TrendingUp, text: "Vous gardez 95% de vos ventes" },
                { icon: Rocket, text: "En ligne en 2 minutes" },
            ],
        }
        : {
            tag: "Transparent model",
            title: "Free to start. 5% when you sell.",
            description: "No subscription. No hidden fees. You only pay when your customers place an order. And with our optional packs, you boost your visibility whenever you want.",
            bottomLine: "Glovo takes 30% on every order. Kbouffe takes 5%. Do the math.",
            compareLabel: "Kbouffe vs the competition",
            compareLeftTitle: "Traditional platforms",
            compareLeftItems: [
                "25-30% commission per order",
                "The customer belongs to the platform",
                "No visibility on your data",
                "Imposed and expensive delivery",
            ],
            compareRightTitle: "With Kbouffe",
            compareRightItems: [
                "Only 5% per transaction",
                "Your customers, your brand, your data",
                "Real-time stats and reports",
                "You choose your delivery method",
            ],
            freePlanName: "Storefront",
            freePrice: "Free",
            freePriceSub: "forever",
            freeCta: "Create my storefront",
            freeFeatures: [
                "Complete digital menu",
                "Unlimited online orders",
                "Mobile Money payments",
                "Push notifications",
                "QR code & unique link",
                "Only 5% per transaction",
            ],
            boostPlanName: "Boost Packs",
            boostPrice: "Starting at",
            boostPriceAmount: "3,000 FCFA",
            boostCta: "See packs",
            boostLabel: "Growth",
            boostFeatures: [
                "Top of search results",
                "Banner ad on homepage",
                "SMS promotions to your customers",
                "Highlight your best dishes",
                "Advanced analytics",
                "Buy only what you need",
            ],
            trustItems: [
                { icon: ShieldCheck, text: "No commitment" },
                { icon: TrendingUp, text: "You keep 95% of your sales" },
                { icon: Rocket, text: "Online in 2 minutes" },
            ],
        };

    return (
        <section id="pricing" className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-brand-400/5 blur-[80px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6"
                    >
                        {copy.tag}
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white"
                    >
                        {copy.title}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-surface-400 leading-relaxed mb-8"
                    >
                        {copy.description}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-xl bg-brand-500/5 border border-brand-500/20 text-brand-300 font-semibold text-lg"
                    >
                        {copy.bottomLine}
                    </motion.div>
                </div>

                {/* Comparison */}
                <div className="max-w-4xl mx-auto mb-20">
                    <h3 className="text-center text-lg md:text-xl font-bold text-white mb-10">
                        {copy.compareLabel}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-xl bg-surface-900 border border-surface-800">
                            <h4 className="text-lg font-bold text-surface-200 mb-6">
                                {copy.compareLeftTitle}
                            </h4>
                            <ul className="space-y-4">
                                {copy.compareLeftItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3 text-surface-400">
                                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                            <span className="text-red-400 text-xs font-bold">&times;</span>
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-8 rounded-xl bg-brand-500/10 border border-brand-500/30">
                            <h4 className="text-lg font-bold text-white mb-6">
                                {copy.compareRightTitle}
                            </h4>
                            <ul className="space-y-4">
                                {copy.compareRightItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3 text-brand-100">
                                        <Check size={20} className="text-brand-400 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Plans */}
                <div className="max-w-4xl mx-auto mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Free plan */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl bg-surface-900 border border-surface-800 flex flex-col"
                        >
                            <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mb-4">
                                <Zap size={24} className="text-surface-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">
                                {copy.freePlanName}
                            </h3>
                            <div className="mb-2">
                                <span className="text-4xl font-extrabold text-white">
                                    {copy.freePrice}
                                </span>
                                <span className="text-sm ml-2 text-surface-400">
                                    {copy.freePriceSub}
                                </span>
                            </div>
                            <ul className="space-y-3 mb-8 mt-6 flex-1">
                                {copy.freeFeatures.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-surface-300">
                                        <Check size={16} className="text-emerald-400 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/register/restaurant"
                                className="block text-center py-3.5 rounded-xl font-semibold bg-surface-800 text-white hover:bg-surface-700 transition-all"
                            >
                                {copy.freeCta}
                            </Link>
                        </motion.div>

                        {/* Boost packs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="relative p-8 rounded-2xl bg-brand-500 text-white flex flex-col shadow-2xl shadow-brand-500/30"
                        >
                            <div className="absolute -top-4 right-6 px-4 py-1.5 bg-brand-600 rounded-full text-sm font-semibold shadow-lg">
                                {copy.boostLabel}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                                <Crown size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">
                                {copy.boostPlanName}
                            </h3>
                            <div className="mb-2">
                                <span className="text-sm text-brand-100">{copy.boostPrice}</span>{" "}
                                <span className="text-4xl font-extrabold">
                                    {copy.boostPriceAmount}
                                </span>
                            </div>
                            <ul className="space-y-3 mb-8 mt-6 flex-1">
                                {copy.boostFeatures.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-brand-100">
                                        <Check size={16} className="text-white flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/register/restaurant"
                                className="block text-center py-3.5 rounded-xl font-semibold bg-white text-brand-600 hover:bg-surface-50 transition-all shadow-lg"
                            >
                                {copy.boostCta}
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Trust strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-8"
                >
                    {copy.trustItems.map((item) => (
                        <span key={item.text} className="flex items-center gap-2 text-surface-300 text-sm font-medium">
                            <item.icon size={18} className="text-brand-400" />
                            {item.text}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
