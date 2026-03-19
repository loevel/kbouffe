"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown, Zap } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";

export function PricingTeaser() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Offre simple",
            title: "Commence gratuit, passe en abonnement quand les commandes commencent a tomber",
            description: "Le bon modele pour ce marche, c'est zero friction au depart et un abonnement clair quand l'etablissement veut accelerer. Pas de commission qui mange vos marges.",
            bottomLine: "Vous gardez 100% de vos ventes. Kbouffe se paie par la valeur d'usage, pas par une taxe sur chaque commande.",
            compareLabel: "Le calcul qui parle au gerant",
            compareLeftTitle: "Ancien systeme",
            compareLeftItems: [
                "Messages vocaux disperses",
                "Cash et MoMo difficiles a rapprocher",
                "Erreurs pendant le rush",
            ],
            compareRightTitle: "Avec Kbouffe",
            compareRightItems: [
                "Lien unique a partager",
                "Historique clair des commandes",
                "Abonnement simple quand l'activite grandit",
            ],
            starterPlanName: "Starter",
            starterPrice: "Gratuit",
            starterCta: "Commencer gratuitement",
            proPlanName: "Pro",
            proPrice: "5 000 FCFA",
            proPeriod: "/ mois",
            proCta: "Choisir Pro",
            popular: "Populaire",
        }
        : {
            tag: "Simple offer",
            title: "Start free, upgrade to a subscription when orders start flowing",
            description: "The right model for this market is zero friction at launch and a clear subscription when the business wants to scale. No commission cutting into your margins.",
            bottomLine: "You keep 100% of your sales. Kbouffe gets paid by usage value, not by a tax on every order.",
            compareLabel: "The numbers that matter to managers",
            compareLeftTitle: "Old system",
            compareLeftItems: [
                "Scattered voice messages",
                "Cash and MoMo hard to reconcile",
                "Errors during the rush",
            ],
            compareRightTitle: "With Kbouffe",
            compareRightItems: [
                "Single link to share",
                "Clear order history",
                "Simple upgrade as business grows",
            ],
            starterPlanName: "Starter",
            starterPrice: "Free",
            starterCta: "Start free",
            proPlanName: "Pro",
            proPrice: "5,000 FCFA",
            proPeriod: "/ month",
            proCta: "Choose Pro",
            popular: "Popular",
        };

    return (
        <section className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-brand-400/5 blur-[80px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
                        {copy.tag}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                        {copy.title}
                    </h2>
                    <p className="text-lg text-surface-400 leading-relaxed mb-8">
                        {copy.description}
                    </p>
                    <div className="p-6 rounded-xl bg-brand-500/5 border border-brand-500/20 text-brand-300">
                        {copy.bottomLine}
                    </div>
                </div>

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
                                        <div className="w-5 h-5 rounded-full bg-surface-700 flex-shrink-0 mt-0.5" />
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

                <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-2xl bg-surface-900 border border-surface-800 flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mb-4">
                                <Zap size={24} className="text-surface-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">
                                {copy.starterPlanName}
                            </h3>
                            <div className="mb-6">
                                <span className="text-3xl font-extrabold text-white">
                                    {copy.starterPrice}
                                </span>
                            </div>
                            <p className="text-sm text-surface-400 mb-6 flex-1">
                                {locale === "fr"
                                    ? "Pour tester la plateforme et demarrer vos premieres ventes."
                                    : "To test the platform and start your first sales."}
                            </p>
                            <Link
                                href="/register/restaurant"
                                className="block text-center py-3 rounded-xl font-semibold bg-surface-800 text-white hover:bg-surface-700 transition-all"
                            >
                                {copy.starterCta}
                            </Link>
                        </div>

                        <div className="relative p-8 rounded-2xl bg-brand-500 text-white flex flex-col shadow-2xl shadow-brand-500/30 scale-[1.02] md:scale-100 md:-mt-6">
                            <div className="absolute -top-4 -right-4 md:top-4 md:right-4 px-4 py-1.5 bg-brand-600 rounded-full text-sm font-semibold shadow-lg">
                                {copy.popular}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                                <Crown size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">
                                {copy.proPlanName}
                            </h3>
                            <div className="mb-6">
                                <span className="text-3xl font-extrabold">
                                    {copy.proPrice}
                                </span>
                                <span className="text-sm ml-1 text-brand-100">
                                    {copy.proPeriod}
                                </span>
                            </div>
                            <p className="text-sm text-brand-100 mb-6 flex-1">
                                {locale === "fr"
                                    ? "Pour les restaurants qui veulent se professionnaliser."
                                    : "For restaurants ready to level up."}
                            </p>
                            <Link
                                href="/pricing"
                                className="block text-center py-3 rounded-xl font-semibold bg-white text-brand-600 hover:bg-surface-50 transition-all shadow-lg"
                            >
                                {copy.proCta}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}