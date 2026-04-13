"use client";

/**
 * Landing Page — Pour les Agriculteurs (OPTIMIZED)
 * Streamlined version (8 sections vs 21) for higher conversion
 *
 * Structure:
 *  1. Hero + Primary CTA
 *  2. Trust stats
 *  3. How it works (3 steps)
 *  4. Key benefits (4 cards)
 *  5. Case studies (5 testimonials - MOVED UP from section 9)
 *  6. Pricing (3 tiers)
 *  7. Revenue calculator (interactive)
 *  8. FAQ + Final CTA
 *
 * Link to full page: /pour-les-agriculteurs
 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
    Wheat,
    Package,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Lock,
    Clock,
    BarChart3,
    Users,
    DollarSign,
    Smartphone,
    Mail,
    TrendingUp,
    Banknote,
    ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

// ── Animation variants ─────────────────────────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// ── Data ───────────────────────────────────────────────────────────────────
const STEPS = [
    {
        number: "01",
        icon: Wheat,
        title: "Inscrivez votre exploitation",
        desc: "Créez votre profil fournisseur en quelques minutes. Gratuit, sans engagement.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        number: "02",
        icon: Package,
        title: "Listez vos produits",
        desc: "Publiez vos stocks. Les restaurants voient vos offres en temps réel.",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
    },
    {
        number: "03",
        icon: TrendingUp,
        title: "Gagnez immédiatement",
        desc: "Paiement MTN MoMo automatique après chaque commande. Vous êtes payé avant la livraison.",
        color: "text-green-400",
        bg: "bg-green-500/10",
    },
];

const BENEFITS = [
    {
        icon: DollarSign,
        title: "Gagnez 3x plus",
        desc: "2.5% de commission vs 30-40% avec les courtiers. Vous contrôlez vos prix.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
    {
        icon: Clock,
        title: "Paiement immédiat",
        desc: "MTN MoMo vous paie avant même la livraison. Pas d'attente, pas de risque.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
    },
    {
        icon: Users,
        title: "Plus de clients",
        desc: "Vendez à tous les restaurants Cameroun, pas juste au marché local.",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
    },
    {
        icon: BarChart3,
        title: "Tableaux de bord",
        desc: "Voyez en direct : ventes, revenus, tendances. Vous êtes aux commandes.",
        color: "text-pink-400",
        bg: "bg-pink-500/10",
    },
];

const CASE_STUDIES = [
    {
        name: "Mama Nkeng",
        role: "Maraîchère",
        region: "Bafoussam",
        product: "Tomates",
        quote: "Depuis Kbouffe, mes tomates partent directement aux restaurants. Je gagne 40% de plus.",
        revenue: "+40%",
        color: "text-red-400",
        bg: "bg-red-500/10",
    },
    {
        name: "Jean-Pierre Kengue",
        role: "Producteur de maïs",
        region: "Bertoua",
        quote: "Mon chiffre d'affaires a triplé. Les restaurants du coin me commandent régulièrement.",
        revenue: "+180%",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
    },
    {
        name: "Fatou Cissé",
        role: "Productrice de légumes",
        region: "Yaoundé",
        quote: "Je suis payée par MTN MoMo. Pas de courtier, pas de perte, plus de contrôle.",
        revenue: "+55%",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        name: "Adama Zakari",
        role: "Producteur de fruits",
        region: "Kribi",
        quote: "J'ai augmenté mes prix de 20% car mes clients valorisent la fraîcheur.",
        revenue: "+75%",
        color: "text-green-400",
        bg: "bg-green-500/10",
    },
    {
        name: "Rose Ntolo",
        role: "Productrice de manioc",
        region: "Douala",
        quote: "Je planifie mes récoltes avec les restaurateurs. C'est plus facile et rentable.",
        revenue: "+65%",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
    },
];

const PRICING_TIERS = [
    {
        name: "Gratuit",
        price: "0 FCFA",
        period: "pour toujours",
        description: "Pour démarrer sans risque",
        commission: "2.5% par vente",
        features: [
            "Jusqu'à 10 produits",
            "Paiement MTN MoMo 2x/semaine",
            "Accès à tous les restaurants",
            "Dashboard basique",
        ],
        cta: "Commencer",
        href: "/register/fournisseur",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
    },
    {
        name: "Standard",
        price: "0 FCFA",
        period: "/ mois",
        description: "Recommandé",
        commission: "2.5% par vente",
        features: [
            "Jusqu'à 50 produits",
            "Support WhatsApp prioritaire",
            "Dashboard complet",
            "Badge 'Agriculteur certifié'",
            "Formations de base",
        ],
        cta: "Essayer",
        href: "/register/fournisseur",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        popular: true,
    },
    {
        name: "Pro",
        price: "25 000 FCFA",
        period: "/ mois",
        description: "Pour les grandes exploitations",
        commission: "1.5% par vente",
        features: [
            "Produits illimités",
            "Support WhatsApp 24/7",
            "Dashboard BI avancée",
            "Accès à crédits agricoles",
            "Gestionnaire account dédié",
        ],
        cta: "Passer à Pro",
        href: "/register/fournisseur",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
];

const FAQ_ITEMS = [
    {
        question: "Combien ça coûte ?",
        answer: "C'est 100% gratuit pour s'inscrire. Vous payez une commission de 2.5% (Standard) ou 1.5% (Pro) uniquement quand vous vendez. Aucun frais caché.",
    },
    {
        question: "Comment reçois-je mon argent ?",
        answer: "Paiement automatique MTN MoMo. Vous recevez l'argent directement sur votre téléphone après chaque commande. Pas d'attente, pas de risque.",
    },
    {
        question: "Comment lister mes produits ?",
        answer: "C'est très simple. Après inscription, allez dans 'Mes produits', remplissez le nom, la catégorie, la quantité, et le prix. Validez et c'est live !",
    },
    {
        question: "Combien de restaurants peuvent me commander ?",
        answer: "Autant que vous le pouvez servir ! Il n'y a pas de limite. Nos meilleurs agriculteurs vendent à 50+ restaurants.",
    },
];

// ── Revenue Calculator ─────────────────────────────────────────────────────
function RevenueCalculator() {
    const [kg, setKg] = useState(100);
    const [prixKg, setPrixKg] = useState(500);
    const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");

    const frequencyMultiplier = frequency === "weekly" ? 52 : frequency === "biweekly" ? 26 : 12;
    const frequencyLabel = frequency === "weekly" ? "par semaine" : frequency === "biweekly" ? "2x/mois" : "par mois";
    const annualRevenue = kg * prixKg * frequencyMultiplier;
    const monthlyRevenue = Math.round(annualRevenue / 12);
    const commission = Math.round(monthlyRevenue * 0.025);
    const netRevenue = monthlyRevenue - commission;

    const formatCFA = (n: number) =>
        new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    className="text-center mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                >
                    <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white">
                        Estimez vos revenus
                    </motion.h2>
                </motion.div>

                <div className="max-w-2xl mx-auto bg-gradient-to-br from-emerald-50 dark:from-emerald-950/20 to-lime-50 dark:to-lime-950/20 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-surface-900 dark:text-white mb-2">
                                Quantité: {kg} kg {frequencyLabel}
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={kg}
                                onChange={(e) => setKg(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-surface-900 dark:text-white mb-2">
                                Prix par kg: {formatCFA(prixKg)}
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="2000"
                                step="50"
                                value={prixKg}
                                onChange={(e) => setPrixKg(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-surface-900 dark:text-white mb-3">
                                Fréquence
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(["weekly", "biweekly", "monthly"] as const).map((freq) => (
                                    <button
                                        key={freq}
                                        onClick={() => setFrequency(freq)}
                                        className={`py-2 px-4 rounded-lg font-medium transition-all ${
                                            frequency === freq
                                                ? "bg-emerald-500 text-white"
                                                : "bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700"
                                        }`}
                                    >
                                        {freq === "weekly" ? "Chaque semaine" : freq === "biweekly" ? "2x/mois" : "Chaque mois"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-emerald-200 dark:border-emerald-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-surface-600 dark:text-surface-400">Revenu mensuel (avant commission):</span>
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCFA(monthlyRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-surface-600 dark:text-surface-400">Commission Kbouffe (2.5%):</span>
                            <span className="text-lg text-red-600">-{formatCFA(commission)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-emerald-200 dark:border-emerald-800">
                            <span className="font-bold text-surface-900 dark:text-white">Vous gagnez par mois:</span>
                            <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">{formatCFA(netRevenue)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── FAQ Section ────────────────────────────────────────────────────────────
function FaqSection() {
    const [open, setOpen] = useState<string | null>(FAQ_ITEMS[0].question);

    return (
        <section className="py-16 md:py-24 bg-surface-50 dark:bg-surface-900/50">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <motion.div
                    className="text-center mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                >
                    <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white">
                        Questions fréquentes
                    </motion.h2>
                </motion.div>

                <div className="space-y-4">
                    {FAQ_ITEMS.map((item) => (
                        <div
                            key={item.question}
                            className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpen(open === item.question ? null : item.question)}
                                className="w-full p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                            >
                                <span className="font-semibold text-surface-900 dark:text-white text-left">{item.question}</span>
                                <ChevronDown
                                    size={20}
                                    className={`text-surface-500 transition-transform ${
                                        open === item.question ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {open === item.question && (
                                <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/30 border-t border-surface-200 dark:border-surface-700">
                                    <p className="text-surface-600 dark:text-surface-300">{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <p className="text-surface-600 dark:text-surface-400 mb-4">
                        Besoin de plus de détails ?
                    </p>
                    <Link
                        href="/pour-les-agriculteurs"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-900 dark:text-white rounded-lg font-semibold transition-all"
                    >
                        Lire le guide complet →
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AgriculturesPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* ════════════════════════════════════════════════════════
                    HERO
                ════════════════════════════════════════════════════════ */}
                <header className="relative overflow-hidden py-20 md:py-32">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-lime-800" />
                    <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-lime-400/20 blur-3xl" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <motion.div
                            className="max-w-2xl"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={fadeIn} className="mb-6">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold uppercase tracking-widest backdrop-blur-sm">
                                    <Wheat size={14} />
                                    Marché B2B · Cameroun
                                </span>
                            </motion.div>

                            <motion.h1
                                variants={fadeIn}
                                className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6"
                            >
                                Gagnez 3x plus{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">
                                    en vendant directement
                                </span>
                            </motion.h1>

                            <motion.p
                                variants={fadeIn}
                                className="text-xl text-emerald-100/80 mb-8 max-w-xl"
                            >
                                Oubliez les courtiers et le marché du mardi. Vendez vos récoltes directement aux restaurants, paiement immédiat MTN MoMo.
                            </motion.p>

                            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/register/fournisseur"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-bold rounded-xl text-lg transition-all shadow-xl shadow-emerald-500/25"
                                >
                                    Inscrire mon exploitation
                                    <ArrowRight size={20} />
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20"
                                >
                                    Comment ça marche ?
                                </a>
                            </motion.div>
                        </motion.div>
                    </div>
                </header>

                {/* ════════════════════════════════════════════════════════
                    TRUST STATS
                ════════════════════════════════════════════════════════ */}
                <section className="py-8 bg-surface-100/40 dark:bg-surface-900/40 border-b border-surface-200/50 dark:border-surface-800/50">
                    <div className="container mx-auto px-4 md:px-6">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: "100%", label: "gratuit" },
                                { value: "2.5%", label: "commission" },
                                { value: "+12", label: "régions" },
                                { value: "MTN MoMo", label: "paiement garanti" },
                            ].map(({ value, label }) => (
                                <div key={label} className="text-center">
                                    <dt className="text-3xl font-extrabold text-emerald-500">{value}</dt>
                                    <dd className="text-sm text-surface-600 dark:text-surface-400 mt-1">{label}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    HOW IT WORKS
                ════════════════════════════════════════════════════════ */}
                <section id="how-it-works" className="py-20 md:py-28">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-16"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white">
                                3 étapes simples
                            </motion.h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            {STEPS.map((step) => (
                                <motion.div
                                    key={step.number}
                                    className={`p-8 rounded-2xl border-2 ${step.bg} border-emerald-200 dark:border-emerald-800`}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                >
                                    <div className={`text-4xl font-extrabold ${step.color} mb-4`}>{step.number}</div>
                                    <step.icon className={`w-8 h-8 ${step.color} mb-4`} />
                                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3">{step.title}</h3>
                                    <p className="text-surface-600 dark:text-surface-400">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    BENEFITS
                ════════════════════════════════════════════════════════ */}
                <section className="py-20 md:py-28 bg-surface-50 dark:bg-surface-900/50">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-16"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white">
                                Pourquoi choisir Kbouffe
                            </motion.h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {BENEFITS.map((benefit) => (
                                <motion.div
                                    key={benefit.title}
                                    className={`p-6 rounded-xl ${benefit.bg} border border-surface-200 dark:border-surface-700`}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                >
                                    <benefit.icon className={`w-8 h-8 ${benefit.color} mb-4`} />
                                    <h3 className="font-bold text-surface-900 dark:text-white mb-2">{benefit.title}</h3>
                                    <p className="text-sm text-surface-600 dark:text-surface-400">{benefit.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    CASE STUDIES (MOVED UP)
                ════════════════════════════════════════════════════════ */}
                <section className="py-20 md:py-28">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-16"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white">
                                Agriculteurs qui gagnent déjà plus
                            </motion.h2>
                            <motion.p variants={fadeIn} className="text-lg text-surface-600 dark:text-surface-400 mt-4">
                                Ils gagnent 3x plus en vendant via Kbouffe
                            </motion.p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {CASE_STUDIES.map((study) => (
                                <motion.div
                                    key={study.name}
                                    className={`p-6 rounded-xl ${study.bg} border border-surface-200 dark:border-surface-700`}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                >
                                    <div className={`text-3xl font-extrabold ${study.color} mb-3`}>{study.revenue}</div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400 italic mb-4">"{study.quote}"</p>
                                    <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                                        <p className="font-bold text-surface-900 dark:text-white text-sm">{study.name}</p>
                                        <p className="text-xs text-surface-500">{study.role} · {study.region}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    PRICING
                ════════════════════════════════════════════════════════ */}
                <section className="py-20 md:py-28 bg-surface-50 dark:bg-surface-900/50">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-16"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white">
                                Plans simples et transparents
                            </motion.h2>
                            <motion.p variants={fadeIn} className="text-lg text-surface-600 dark:text-surface-400 mt-4">
                                Vous payez uniquement une commission quand vous vendez. Pas d'abonnement caché.
                            </motion.p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {PRICING_TIERS.map((tier) => (
                                <motion.div
                                    key={tier.name}
                                    className={`relative p-8 rounded-2xl border-2 ${tier.bg} border-surface-300 dark:border-surface-700 ${
                                        tier.popular ? "ring-2 ring-emerald-500 md:scale-105" : ""
                                    }`}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                >
                                    {tier.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex px-4 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full">
                                                ⭐ Recommandé
                                            </span>
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{tier.name}</h3>
                                    <div className="mb-1">
                                        <span className="text-4xl font-extrabold text-surface-900 dark:text-white">{tier.price}</span>
                                        <span className="text-sm text-surface-600 dark:text-surface-400 ml-2">{tier.period}</span>
                                    </div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{tier.commission}</p>
                                    <p className="text-xs text-surface-500 mb-6">{tier.description}</p>

                                    <ul className="space-y-3 mb-8">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 text-sm">
                                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-surface-700 dark:text-surface-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={tier.href}
                                        className={`w-full block text-center py-3 rounded-lg font-bold transition-all ${
                                            tier.popular
                                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                : "bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700"
                                        }`}
                                    >
                                        {tier.cta}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    REVENUE CALCULATOR
                ════════════════════════════════════════════════════════ */}
                <RevenueCalculator />

                {/* ════════════════════════════════════════════════════════
                    FAQ
                ════════════════════════════════════════════════════════ */}
                <FaqSection />

                {/* ════════════════════════════════════════════════════════
                    FINAL CTA
                ════════════════════════════════════════════════════════ */}
                <section className="py-20 md:py-28 bg-gradient-to-r from-emerald-600 to-lime-500">
                    <div className="container mx-auto px-4 md:px-6 text-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                                Commencez dès aujourd'hui
                            </motion.h2>
                            <motion.p variants={fadeIn} className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                                Inscrivez votre exploitation gratuitement. Aucun engagement. Commencez à vendre aux restaurants en quelques minutes.
                            </motion.p>
                            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/register/fournisseur"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-xl"
                                >
                                    Inscrire mon exploitation
                                    <ArrowRight size={20} />
                                </Link>
                                <a
                                    href="https://wa.me/237682123456"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all"
                                >
                                    Parler sur WhatsApp
                                </a>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* ════════════════════════════════════════════════════════
                FOOTER
            ════════════════════════════════════════════════════════ */}
            <footer className="bg-surface-950 text-surface-400 py-12 border-t border-surface-800">
                <div className="container mx-auto px-4 md:px-6 text-center text-sm">
                    <p>© 2026 Kbouffe. Tous droits réservés. · <Link href="/pour-les-agriculteurs" className="hover:text-white">Guide complet</Link></p>
                </div>
            </footer>
        </div>
    );
}
