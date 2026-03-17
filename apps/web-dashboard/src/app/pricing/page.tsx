import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tarifs — Kbouffe",
    description: "Des tarifs simples et transparents. 0% de commission sur vos ventes. Choisissez le plan adapté à votre restaurant.",
};

const plans = [
    {
        name: "Starter",
        price: "Gratuit",
        period: "",
        description: "Pour tester la plateforme et démarrer vos premières ventes.",
        icon: <Zap className="h-6 w-6" />,
        features: [
            "1 restaurant",
            "Jusqu'à 15 produits",
            "Commandes illimitées",
            "Paiement Mobile Money",
            "0% commission",
            "Support par email",
        ],
        cta: "Commencer gratuitement",
        href: "/register",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "5 000",
        period: "FCFA / mois",
        description: "Pour les restaurants qui veulent se professionnaliser.",
        icon: <Crown className="h-6 w-6" />,
        features: [
            "1 restaurant",
            "Produits illimités",
            "Commandes illimitées",
            "Paiement Mobile Money",
            "0% commission",
            "Tableau de bord avancé",
            "Notifications en temps réel",
            "Support prioritaire",
        ],
        cta: "Choisir Pro",
        href: "/register",
        highlighted: true,
    },
    {
        name: "Business",
        price: "15 000",
        period: "FCFA / mois",
        description: "Pour les chaînes et groupes de restaurants.",
        icon: <Rocket className="h-6 w-6" />,
        features: [
            "Jusqu'à 5 restaurants",
            "Produits illimités",
            "Commandes illimitées",
            "Paiement Mobile Money",
            "0% commission",
            "Tableau de bord multi-sites",
            "Analytics détaillés",
            "Support dédié WhatsApp",
            "Domaine personnalisé",
        ],
        cta: "Choisir Business",
        href: "/register",
        highlighted: false,
    },
];

export default function PricingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950 font-sans">
            <Navbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-surface-900 dark:text-white mb-4">
                            Des tarifs simples et transparents
                        </h1>
                        <p className="text-lg text-surface-600 dark:text-surface-400">
                            Pas de commission cachée, pas de frais surprises.
                            Choisissez le plan adapté à votre activité.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl p-8 flex flex-col transition-all hover:-translate-y-1 ${
                                    plan.highlighted
                                        ? "bg-brand-500 text-white shadow-2xl shadow-brand-500/30 scale-[1.02]"
                                        : "bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:shadow-xl"
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 rounded-full text-sm font-semibold shadow-lg">
                                        Populaire
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                                    plan.highlighted
                                        ? "bg-white/20"
                                        : "bg-brand-100 dark:bg-brand-900/30 text-brand-500"
                                }`}>
                                    {plan.icon}
                                </div>

                                <h2 className={`text-xl font-bold mb-1 ${
                                    plan.highlighted ? "" : "text-surface-900 dark:text-white"
                                }`}>
                                    {plan.name}
                                </h2>

                                <div className="mb-2">
                                    <span className={`text-4xl font-extrabold ${
                                        plan.highlighted ? "" : "text-surface-900 dark:text-white"
                                    }`}>
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className={`text-sm ml-1 ${
                                            plan.highlighted ? "text-brand-100" : "text-surface-500 dark:text-surface-400"
                                        }`}>
                                            {plan.period}
                                        </span>
                                    )}
                                </div>

                                <p className={`text-sm mb-6 ${
                                    plan.highlighted ? "text-brand-100" : "text-surface-600 dark:text-surface-400"
                                }`}>
                                    {plan.description}
                                </p>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2.5">
                                            <Check size={18} className={`mt-0.5 shrink-0 ${
                                                plan.highlighted ? "text-white" : "text-brand-500"
                                            }`} />
                                            <span className={`text-sm ${
                                                plan.highlighted ? "text-brand-50" : "text-surface-700 dark:text-surface-300"
                                            }`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.href}
                                    className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                                        plan.highlighted
                                            ? "bg-white text-brand-600 hover:bg-surface-50 shadow-lg"
                                            : "bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/20"
                                    }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* FAQ teaser */}
                    <div className="text-center mt-16">
                        <p className="text-surface-600 dark:text-surface-400">
                            Des questions ? {" "}
                            <Link href="/contact" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                                Contactez-nous
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
