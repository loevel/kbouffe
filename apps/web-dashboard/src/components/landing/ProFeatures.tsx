"use client";

import {
    ShoppingBasket,
    TrendingUp,
    Building2,
    Users,
    Shield,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function ProFeatures() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "KBouffe Business",
            title: "Construisez un vrai business, pas juste une vitrine",
            description:
                "Des fonctionnalités avancées pensées pour les restaurateurs qui veulent aller plus loin — approvisionnement, financement, conformité légale.",
            cta: "Découvrir KBouffe Pro",
            shield: "Conformité légale",
            features: [
                {
                    icon: ShoppingBasket,
                    badge: "Centrale d'Achat",
                    title: "Achetez directement aux producteurs locaux",
                    description:
                        "Accédez à un annuaire d'agriculteurs, coopératives et grossistes de votre région. Commandez des tomates, poulets ou épices directement depuis le tableau de bord — avec traçabilité de la ferme à l'assiette.",
                    highlight: "TVA 0% sur produits bruts — conforme CGI Art.131",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    glow: "group-hover:bg-emerald-500/5",
                    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                },
                {
                    icon: TrendingUp,
                    badge: "KBouffe Capital",
                    title: "Financez votre croissance via vos données",
                    description:
                        "Obtenez un score de crédit basé sur vos commandes réelles (90 jours). KBouffe transmet votre dossier à une banque partenaire (Advans, Express Union, BICEC) — vous gardez 100% du contrôle, aucun risque de surendettement.",
                    highlight: "Apporteur d'affaires uniquement — pas de prêt direct (COBAC compliant)",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                    glow: "group-hover:bg-blue-500/5",
                    pill: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                },
                {
                    icon: Building2,
                    badge: "Dark Kitchens",
                    title: "Opérez plusieurs marques depuis une cuisine",
                    description:
                        "Lancez une deuxième ou troisième enseigne depuis vos locaux existants. Gérez chaque marque avec son propre menu, ses propres horaires et son identité visuelle — tout depuis un seul tableau de bord.",
                    highlight: "Déclaration légale liante + KYC (RCCM, NIF, licence sanitaire) inclus",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                    glow: "group-hover:bg-purple-500/5",
                    pill: "bg-purple-500/15 text-purple-300 border-purple-500/30",
                },
                {
                    icon: Users,
                    badge: "Rapports RH",
                    title: "Gérez primes et pourboires en toute conformité",
                    description:
                        "Calculez automatiquement les primes et pourboires de votre personnel avec les déductions CNPS (11,2 % + 5,25 %) et IRPP estimées. Le rapport est consultatif — c'est vous qui validez et payez directement.",
                    highlight: "Outil indicatif — KBouffe n'est pas co-employeur (Code du Travail Loi n°92/007)",
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    glow: "group-hover:bg-amber-500/5",
                    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                },
            ],
        }
        : {
            tag: "KBouffe Business",
            title: "Build a real business, not just a storefront",
            description:
                "Advanced tools for restaurant owners who want to go further — procurement, financing, compliance, and team management.",
            cta: "Discover KBouffe Pro",
            shield: "Legal compliance",
            features: [
                {
                    icon: ShoppingBasket,
                    badge: "B2B Marketplace",
                    title: "Buy directly from local farmers",
                    description:
                        "Access a directory of farmers, cooperatives, and wholesalers in your area. Order tomatoes, chicken, or spices directly from your dashboard — with full farm-to-table traceability.",
                    highlight: "0% VAT on raw agricultural products — compliant with CGI Art.131",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    glow: "group-hover:bg-emerald-500/5",
                    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                },
                {
                    icon: TrendingUp,
                    badge: "KBouffe Capital",
                    title: "Finance your growth with your own data",
                    description:
                        "Get a credit score based on your real orders (90 days). KBouffe forwards your file to a partner bank (Advans, Express Union, BICEC) — you keep full control, zero over-indebtedness risk.",
                    highlight: "Broker only — no direct lending (COBAC compliant)",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                    glow: "group-hover:bg-blue-500/5",
                    pill: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                },
                {
                    icon: Building2,
                    badge: "Dark Kitchens",
                    title: "Run multiple brands from one kitchen",
                    description:
                        "Launch a second or third brand from your existing premises. Manage each brand with its own menu, hours, and identity — all from one dashboard.",
                    highlight: "Binding legal declaration + KYC (RCCM, NIF, health license) included",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                    glow: "group-hover:bg-purple-500/5",
                    pill: "bg-purple-500/15 text-purple-300 border-purple-500/30",
                },
                {
                    icon: Users,
                    badge: "HR Reports",
                    title: "Manage tips & bonuses in full compliance",
                    description:
                        "Auto-calculate staff bonuses and tips with CNPS deductions (11.2% + 5.25%) and estimated income tax. The report is advisory — you validate and pay directly.",
                    highlight: "Advisory tool — KBouffe is not a co-employer (Labor Code Law 92/007)",
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    glow: "group-hover:bg-amber-500/5",
                    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                },
            ],
        };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 32 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90 } },
    };

    return (
        <section id="pro-features" className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/4 left-0 w-[700px] h-[700px] rounded-full bg-emerald-500/4 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-semibold mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
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

                {/* 2x2 Feature grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
                >
                    {copy.features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className={`group relative p-8 rounded-[2rem] bg-surface-900/40 backdrop-blur-sm border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden`}
                        >
                            {/* Hover glow */}
                            <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${feature.glow}`} />
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex flex-col h-full gap-5">
                                {/* Icon + badge row */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${feature.bg} ${feature.color}`}>
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${feature.pill}`}>
                                        {feature.badge}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-white leading-snug group-hover:text-brand-200 transition-colors duration-300">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-surface-400 leading-relaxed text-base flex-1">
                                    {feature.description}
                                </p>

                                {/* Legal shield badge */}
                                <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                                    <Shield className="h-4 w-4 text-surface-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-surface-500 leading-relaxed">
                                        {feature.highlight}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-500 hover:bg-brand-400 text-white font-semibold text-base transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5"
                    >
                        {copy.cta}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
