import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Check, Zap, Crown, Rocket, TrendingUp, Shield, Clock, ArrowRight, ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tarifs — Kbouffe",
    description: "Gratuit pour démarrer. Seulement 5% quand vous vendez. Pas d'abonnement, pas de frais cachés. Boostez votre visibilité avec les packs optionnels.",
};

const plans = [
    {
        name: "Vitrine",
        price: "Gratuit",
        period: "pour toujours",
        description: "Pour démarrer votre présence en ligne et recevoir vos premières commandes.",
        icon: <Zap className="h-6 w-6" />,
        features: [
            "Menu digital complet",
            "Commandes illimitées",
            "Paiements Mobile Money",
            "Notifications push",
            "QR code & lien unique",
            "Seulement 5% par transaction",
            "Support par email",
        ],
        cta: "Commencer gratuitement",
        href: "/register/restaurant",
        highlighted: false,
    },
    {
        name: "Packs Boost",
        price: "À partir de",
        period: "3 000 FCFA",
        description: "Boostez votre visibilité et atteignez plus de clients quand vous êtes prêt.",
        icon: <Crown className="h-6 w-6" />,
        features: [
            "Visibilité en tête des résultats",
            "Bannière publicitaire sur la page d'accueil",
            "SMS promotionnels à vos clients",
            "Mise en avant de vos plats les plus populaires",
            "Statistiques avancées",
            "Aucun engagement — Achetez ce dont vous avez besoin",
        ],
        cta: "Voir les packs",
        href: "/register/restaurant",
        highlighted: true,
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
                            Gratuit pour démarrer. 5% quand vous vendez.
                        </h1>
                        <p className="text-lg text-surface-600 dark:text-surface-400">
                            Pas d'abonnement. Pas de frais cachés. Vous ne payez que lorsque vos clients passent commande.
                        </p>

                        {/* Trust Badge */}
                        <div className="mt-8 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 inline-flex items-center gap-2 max-w-2xl mx-auto">
                            <Shield size={18} className="text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                                <strong>5% c'est moins cher:</strong> Jumia & Uber Eats demandent 15-30%. Nous, juste 5%.
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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

                    {/* Earnings Example */}
                    <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-900/10 border border-brand-200 dark:border-brand-500/20 max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-8 text-center">
                            Exemple: Combien vous gagneriez avec Kbouffe?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-surface-900 rounded-xl p-6">
                                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">Scénario: Restaurant moyen</p>
                                <p className="text-3xl font-bold text-surface-900 dark:text-white mb-1">20 commandes/jour</p>
                                <p className="text-sm text-surface-500">À 5,000 FCFA/commande</p>
                            </div>
                            <div className="bg-white dark:bg-surface-900 rounded-xl p-6">
                                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">Revenu brut mensuel</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">3M FCFA</p>
                                <p className="text-sm text-surface-500">Commandes en ligne</p>
                            </div>
                            <div className="bg-white dark:bg-surface-900 rounded-xl p-6">
                                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">Coût Kbouffe (5%)</p>
                                <p className="text-3xl font-bold text-surface-900 dark:text-white mb-1">150K FCFA</p>
                                <p className="text-sm text-surface-500">Vs. 600K avec concurrents</p>
                            </div>
                        </div>
                        <p className="text-center text-sm text-surface-600 dark:text-surface-400 mt-6">
                            💰 <strong>Vous économisez 450K FCFA/mois</strong> comparé aux alternatives
                        </p>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-20 max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-8 text-center">
                            Questions sur les tarifs
                        </h3>
                        <div className="space-y-3">
                            {[
                                {
                                    q: "Quand je commence à payer les 5% ?",
                                    a: "Dès la première commande. Zéro frais avant cela. Pas d'abonnement caché."
                                },
                                {
                                    q: "Puis-je augmenter mes prix pour couvrir les 5% ?",
                                    a: "Bien sûr, c'est votre choix. Beaucoup de restaurants intègrent légèrement les frais ou les mettent en avant ('frais de livraison')."
                                },
                                {
                                    q: "À quel moment la commission est prélevée ?",
                                    a: "À chaque commande. Vous recevez l'argent moins les 5% directement sur votre compte MTN MoMo ou compte bancaire."
                                },
                                {
                                    q: "Y a-t-il des frais supplémentaires ?",
                                    a: "Non. Juste 5% par commande. Les Packs Boost sont optionnels pour augmenter votre visibilité."
                                },
                            ].map((item, i) => (
                                <details
                                    key={i}
                                    className="group border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden transition-all hover:border-brand-500/30"
                                >
                                    <summary className="flex cursor-pointer items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 select-none hover:bg-surface-100 dark:hover:bg-surface-800">
                                        <p className="font-semibold text-surface-900 dark:text-white">{item.q}</p>
                                        <ChevronDown size={18} className="text-surface-600 dark:text-surface-400 group-open:rotate-180 transition-transform duration-300 shrink-0" />
                                    </summary>
                                    <div className="border-t border-surface-200 dark:border-surface-800 p-4 bg-white dark:bg-surface-950">
                                        <p className="text-surface-600 dark:text-surface-400 text-sm">{item.a}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* FAQ teaser */}
                    <div className="text-center mt-16">
                        <p className="text-surface-600 dark:text-surface-400">
                            Besoin de plus d'infos ? {" "}
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
