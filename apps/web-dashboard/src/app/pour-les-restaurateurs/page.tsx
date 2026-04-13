"use client";

/**
 * Landing page — Pour les restaurateurs
 *
 * Audience : restaurant owners who want to digitalize and grow their business
 *            on the KBouffe platform.
 *
 * Sections :
 *   1. Hero     — "Digitalisez votre restaurant, sans commission"
 *   2. Features — 6 feature cards (full platform overview)
 *   3. Numbers  — 0% commission, 10 min setup, +50 restaurants
 *   4. Pricing  — Teaser with link to /pricing
 *   5. CTA      — "Ouvrir mon restaurant gratuitement"
 *
 * Usage :
 *   Accessible via /pour-les-restaurateurs
 *   Linked from the Navbar audience dropdown
 */

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
    Store,
    BarChart3,
    Users,
    CreditCard,
    Calendar,
    Zap,
    ArrowRight,
    CheckCircle2,
    TrendingUp,
    ShieldCheck,
    ChevronRight,
    Shield,
    Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { KbouffeLogo } from "@/components/brand/Logo";

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

const FEATURES = [
    {
        icon: Store,
        title: "Gestion des commandes",
        desc: "Recevez, acceptez et gérez toutes vos commandes en temps réel depuis un tableau de bord unifié. KDS intégré pour la cuisine.",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        badge: null,
    },
    {
        icon: Zap,
        title: "Menu en ligne",
        desc: "Créez et mettez à jour votre menu à tout moment. Photos, descriptions, prix et disponibilités en quelques clics.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        badge: "Populaire",
    },
    {
        icon: CreditCard,
        title: "Paiements MTN MoMo",
        desc: "Encaissez directement sur votre compte mobile money. Virements quotidiens automatiques, zéro commission sur les ventes.",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        badge: "0% commission",
    },
    {
        icon: BarChart3,
        title: "Tableau de bord analytics",
        desc: "Suivez vos ventes, plats populaires, heures de pointe et revenus. Rapports hebdomadaires générés automatiquement.",
        color: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
        badge: null,
    },
    {
        icon: Users,
        title: "Équipe & Rôles (RBAC)",
        desc: "Attribuez des rôles différents à vos employés : gérant, caissier, cuisinier. Contrôle d'accès granulaire par poste.",
        color: "text-violet-400",
        bg: "bg-violet-500/10",
        border: "border-violet-500/20",
        badge: null,
    },
    {
        icon: Calendar,
        title: "Réservations de tables",
        desc: "Acceptez les réservations en ligne, gérez la salle et envoyez des confirmations automatiques à vos clients.",
        color: "text-pink-400",
        bg: "bg-pink-500/10",
        border: "border-pink-500/20",
        badge: null,
    },
] as const;

const NUMBERS = [
    {
        value: "0 %",
        label: "de commission",
        sub: "Gardez 100 % de vos revenus",
        color: "text-orange-400",
        glow: "shadow-orange-500/20",
    },
    {
        value: "10 min",
        label: "pour déployer",
        sub: "Inscription jusqu'au premier plat",
        color: "text-yellow-400",
        glow: "shadow-yellow-500/20",
    },
    {
        value: "+50",
        label: "restaurants actifs",
        sub: "À travers tout le Cameroun",
        color: "text-emerald-400",
        glow: "shadow-emerald-500/20",
    },
    {
        value: "24/7",
        label: "commandes",
        sub: "Votre restaurant ne dort jamais",
        color: "text-sky-400",
        glow: "shadow-sky-500/20",
    },
] as const;

const PRICING_PLANS = [
    {
        name: "Gratuit",
        price: "0 FCFA",
        period: "/ mois",
        desc: "Pour démarrer et tester la plateforme.",
        features: [
            "Menu en ligne",
            "Gestion des commandes",
            "Paiement MTN MoMo",
            "1 compte utilisateur",
        ],
        cta: "Commencer gratuitement",
        href: "/register/restaurant",
        highlight: false,
    },
    {
        name: "Pro",
        price: "Dès 15 000 FCFA",
        period: "/ mois",
        desc: "Pour les restaurants qui veulent croître.",
        features: [
            "Tout ce qui est gratuit",
            "Analytics avancés",
            "Équipe & RBAC",
            "Réservations de tables",
            "Support prioritaire",
        ],
        cta: "Voir les tarifs Pro",
        href: "/pricing",
        highlight: true,
    },
] as const;

const CHECKLIST = [
    "Inscription 100 % gratuite, sans carte bancaire",
    "Votre restaurant en ligne en moins de 10 minutes",
    "Zéro commission — vous gardez tout ce que vous gagnez",
    "Support dédié par WhatsApp & e-mail",
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function PourLesRestaurateursPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col">
            {/* ── Navbar ── */}
            <Navbar />

            <main className="flex-1">

                {/* ════════════════════════════════════════════════════════
                    HERO
                ════════════════════════════════════════════════════════ */}
                <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">

                    {/* Background layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-50 to-orange-50/20 dark:from-surface-950 dark:via-surface-950 dark:to-orange-950/20" />
                    <div className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-yellow-500/4 blur-3xl pointer-events-none" />

                    {/* Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.025)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

                    {/* Accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {/* Left — copy */}
                                <div>
                                    <motion.div variants={fadeIn} className="mb-6">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold uppercase tracking-widest">
                                            <Store size={13} />
                                            Pour les restaurateurs
                                        </span>
                                    </motion.div>

                                    <motion.h1
                                        variants={fadeIn}
                                        className="text-4xl sm:text-5xl md:text-[3.25rem] font-extrabold text-surface-900 dark:text-white leading-[1.1] tracking-tight mb-5"
                                    >
                                        Digitalisez votre restaurant,{" "}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                                            sans commission
                                        </span>
                                    </motion.h1>

                                    <motion.p
                                        variants={fadeIn}
                                        className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-8"
                                    >
                                        La plateforme tout-en-un pensée pour les restaurateurs camerounais.
                                        Gérez vos commandes, encaissez via MTN MoMo et développez votre
                                        clientèle sans payer de commission sur vos ventes.
                                    </motion.p>

                                    <motion.ul
                                        variants={staggerContainer}
                                        className="space-y-3 mb-10"
                                        role="list"
                                        aria-label="Avantages principaux"
                                    >
                                        {CHECKLIST.map((item) => (
                                            <motion.li
                                                key={item}
                                                variants={fadeIn}
                                                className="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-300"
                                            >
                                                <CheckCircle2 size={17} className="text-orange-400 mt-0.5 shrink-0" aria-hidden="true" />
                                                {item}
                                            </motion.li>
                                        ))}
                                    </motion.ul>

                                    <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                                        <Link
                                            href="/register/restaurant"
                                            className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:ring-offset-surface-950"
                                            aria-label="Ouvrir mon restaurant gratuitement sur Kbouffe"
                                        >
                                            Ouvrir mon restaurant gratuitement
                                            <ArrowRight size={18} />
                                        </Link>
                                    </motion.div>

                                    {/* Trust Badge */}
                                    <motion.div variants={fadeIn} className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 inline-flex items-center gap-2">
                                        <Shield size={16} className="text-green-600 dark:text-green-400" />
                                        <span className="text-sm text-green-700 dark:text-green-300">
                                            <strong>100% gratuit:</strong> Pas de frais cachés, commencez aujourd'hui
                                        </span>
                                    </motion.div>
                                </div>

                                {/* Right — feature preview card */}
                                <motion.div variants={fadeUp} className="hidden lg:block">
                                    <div className="dark relative rounded-2xl bg-surface-900/80 border border-surface-800/60 p-6 backdrop-blur-sm">
                                        {/* Mock dashboard header */}
                                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-surface-800/50">
                                            <div>
                                                <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Tableau de bord</p>
                                                <p className="text-white font-bold text-sm mt-0.5">Restaurant La Saveur</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                                                <span className="text-green-400 text-xs font-semibold">En ligne</span>
                                            </div>
                                        </div>

                                        {/* Mock stats */}
                                        <div className="grid grid-cols-3 gap-3 mb-5" role="list" aria-label="Statistiques du restaurant">
                                            {[
                                                { label: "Commandes", value: "24", delta: "+8%", color: "text-orange-400" },
                                                { label: "Revenu", value: "87 500", delta: "+12%", color: "text-yellow-400" },
                                                { label: "Note", value: "4.7 ★", delta: "+0.2", color: "text-green-400" },
                                            ].map(({ label, value, delta, color }) => (
                                                <div key={label} role="listitem" className="rounded-xl bg-surface-800/40 p-3">
                                                    <p className="text-surface-500 text-xs font-medium mb-1">{label}</p>
                                                    <p className={`font-bold text-sm ${color}`}>{value}</p>
                                                    <p className="text-green-400 text-xs flex items-center gap-0.5 mt-0.5">
                                                        <TrendingUp size={10} aria-hidden="true" /> {delta}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mock orders */}
                                        <div className="space-y-2.5" role="list" aria-label="Commandes récentes">
                                            <p className="text-surface-500 text-xs font-semibold uppercase tracking-wider mb-3">Commandes récentes</p>
                                            {[
                                                { id: "#1041", item: "Ndolé + Plantain", status: "En cours", statusColor: "text-yellow-400 bg-yellow-500/10" },
                                                { id: "#1040", item: "Poulet DG + Riz", status: "Livré", statusColor: "text-green-400 bg-green-500/10" },
                                                { id: "#1039", item: "Eru + Fufu", status: "Livré", statusColor: "text-green-400 bg-green-500/10" },
                                            ].map(({ id, item, status, statusColor }) => (
                                                <div key={id} role="listitem" className="flex items-center justify-between rounded-lg bg-surface-800/30 px-3 py-2.5">
                                                    <div>
                                                        <p className="text-white text-xs font-semibold">{item}</p>
                                                        <p className="text-surface-500 text-xs">{id}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    NUMBERS BAR
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="border-y border-surface-200/50 dark:border-surface-800/50 bg-surface-100/40 dark:bg-surface-900/40"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                    aria-labelledby="numbers-heading"
                >
                    <h2 id="numbers-heading" className="sr-only">Kbouffe en chiffres</h2>
                    <div className="container mx-auto px-4 md:px-6 py-8 md:py-10">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                            {NUMBERS.map(({ value, label, sub, color, glow }) => (
                                <motion.div
                                    key={label}
                                    variants={fadeIn}
                                    className={`text-center p-4 rounded-2xl bg-surface-100/60 dark:bg-surface-900/60 border border-surface-200/40 dark:border-surface-800/40 shadow-lg ${glow}`}
                                >
                                    <dt className={`text-3xl md:text-4xl font-extrabold ${color} leading-none`}>{value}</dt>
                                    <dd className="mt-2">
                                        <span className="block text-surface-900 dark:text-white font-semibold text-sm">{label}</span>
                                        <span className="block text-surface-500 text-xs mt-0.5">{sub}</span>
                                    </dd>
                                </motion.div>
                            ))}
                        </dl>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    FEATURES
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="features-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        {/* Header */}
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Plateforme complète
                            </motion.p>
                            <motion.h2
                                id="features-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Tout pour gérer et grandir
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-xl mx-auto">
                                Une suite d'outils pensée par et pour les restaurateurs camerounais.
                                Pas de superflu, que l'essentiel.
                            </motion.p>
                        </motion.div>

                        {/* Feature grid */}
                        <motion.ul
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border, badge }) => (
                                <motion.li
                                    key={title}
                                    variants={fadeIn}
                                    className={`relative group rounded-2xl border ${border} bg-surface-100/50 dark:bg-surface-900/50 p-6 hover:bg-surface-100 dark:hover:bg-surface-900 transition-all duration-300 hover:-translate-y-1`}
                                >
                                    {badge && (
                                        <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-bold ${badge === "0% commission" ? "bg-green-500/15 text-green-400 border border-green-500/25" : "bg-orange-500/15 text-orange-400 border border-orange-500/25"}`}>
                                            {badge}
                                        </span>
                                    )}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-5`} aria-hidden="true">
                                        <Icon size={22} className={color} />
                                    </div>
                                    <h3 className="text-surface-900 dark:text-white font-bold text-base mb-2">{title}</h3>
                                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{desc}</p>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    PRICING TEASER
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="pricing-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        {/* Header */}
                        <motion.div
                            className="text-center mb-12"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Tarification transparente
                            </motion.p>
                            <motion.h2
                                id="pricing-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Gratuit pour commencer,{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                                    upgrades disponibles
                                </span>
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-md mx-auto">
                                Lancez votre restaurant sans rien débourser. Passez à Pro
                                quand vous êtes prêt à scaler.
                            </motion.p>
                        </motion.div>

                        {/* Plan cards */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {PRICING_PLANS.map(({ name, price, period, desc, features, cta, href, highlight }) => (
                                <motion.div
                                    key={name}
                                    variants={fadeIn}
                                    className={`relative rounded-2xl p-7 border flex flex-col ${
                                        highlight
                                            ? "bg-gradient-to-b from-orange-50/50 to-surface-100/80 dark:from-orange-950/50 dark:to-surface-900/80 border-orange-500/40 shadow-xl shadow-orange-500/10"
                                            : "bg-surface-100/60 dark:bg-surface-900/60 border-surface-200/60 dark:border-surface-800/60"
                                    }`}
                                >
                                    {highlight && (
                                        <div className="absolute -top-px left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" aria-hidden="true" />
                                    )}
                                    <div className="mb-6">
                                        <p className="text-surface-600 dark:text-surface-400 text-xs font-bold uppercase tracking-widest mb-1">{name}</p>
                                        <div className="flex items-end gap-1.5">
                                            <span className={`text-3xl font-extrabold ${highlight ? "text-orange-400" : "text-surface-900 dark:text-white"}`}>{price}</span>
                                            <span className="text-surface-500 text-sm mb-1">{period}</span>
                                        </div>
                                        <p className="text-surface-600 dark:text-surface-400 text-sm mt-2">{desc}</p>
                                    </div>

                                    <ul className="space-y-2.5 mb-8 flex-1" role="list">
                                        {features.map((f) => (
                                            <li key={f} className="flex items-center gap-2.5 text-sm text-surface-700 dark:text-surface-300">
                                                <CheckCircle2 size={15} className={highlight ? "text-orange-400 shrink-0" : "text-surface-500 shrink-0"} aria-hidden="true" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={href}
                                        className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:ring-offset-surface-950 ${
                                            highlight
                                                ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white shadow-lg shadow-orange-500/20 focus-visible:ring-orange-500"
                                                : "bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-900 dark:text-white border border-surface-300/50 dark:border-surface-700/50 focus-visible:ring-surface-500"
                                        }`}
                                        aria-label={highlight ? "Voir tous les tarifs Pro" : "Ouvrir mon restaurant gratuitement"}
                                    >
                                        {cta}
                                        <ChevronRight size={16} />
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.p
                            className="text-center text-surface-500 text-sm mt-8"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                        >
                            Pas de carte bancaire requise &nbsp;·&nbsp; Annulation à tout moment &nbsp;·&nbsp;{" "}
                            <Link href="/pricing" className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors">
                                Voir tous les détails →
                            </Link>
                        </motion.p>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    TRUST / HOW IT WORKS STRIP
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-24"
                    aria-labelledby="onboarding-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-12"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={fadeUp}
                        >
                            <h2 id="onboarding-heading" className="text-2xl md:text-3xl font-extrabold text-surface-900 dark:text-white">
                                Votre restaurant en ligne en{" "}
                                <span className="text-orange-400">10 minutes</span>
                            </h2>
                        </motion.div>

                        <motion.ol
                            className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {[
                                { step: "1", title: "Inscription", desc: "Créez votre compte avec votre numéro de téléphone." },
                                { step: "2", title: "Profil restaurant", desc: "Ajoutez vos infos, photos et horaires d'ouverture." },
                                { step: "3", title: "Menu", desc: "Publiez vos plats avec prix et descriptions." },
                                { step: "4", title: "Recevez des commandes", desc: "Votre restaurant est visible. Les commandes arrivent !" },
                            ].map(({ step, title, desc }) => (
                                <motion.li
                                    key={step}
                                    variants={fadeIn}
                                    className="text-center"
                                >
                                    <div className="w-11 h-11 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-extrabold text-lg mx-auto mb-4" aria-hidden="true">
                                        {step}
                                    </div>
                                    <h3 className="text-surface-900 dark:text-white font-bold text-sm mb-1.5">{title}</h3>
                                    <p className="text-surface-500 text-xs leading-relaxed">{desc}</p>
                                </motion.li>
                            ))}
                        </motion.ol>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    SOCIAL PROOF
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="py-14 bg-surface-100/30 dark:bg-surface-900/20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    aria-label="Témoignage restaurateur"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-2xl mx-auto rounded-2xl bg-surface-100/60 dark:bg-surface-900/60 border border-orange-500/15 p-8 md:p-10 relative overflow-hidden">
                            <div className="absolute top-4 left-6 text-orange-500/20 text-8xl font-serif leading-none pointer-events-none select-none" aria-hidden="true">&ldquo;</div>
                            <div className="relative z-10">
                                <blockquote>
                                    <p className="text-surface-900 dark:text-white text-base md:text-lg italic leading-relaxed mb-6">
                                        &ldquo;J'ai mis mon restaurant en ligne un vendredi soir. Le samedi matin,
                                        j'avais déjà 6 commandes MTN MoMo encaissées. Kbouffe m'a sauvé la mise
                                        pendant la saison creuse.&rdquo;
                                    </p>
                                    <footer className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm font-bold text-orange-300" aria-hidden="true">
                                            P
                                        </div>
                                        <div>
                                            <cite className="not-italic text-surface-900 dark:text-white text-sm font-semibold">Pascal Ngo</cite>
                                            <p className="text-surface-500 text-xs">Propriétaire · Resto La Saveur · Yaoundé</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                            <ShieldCheck size={13} className="text-green-400" aria-hidden="true" />
                                            <span className="text-green-400 text-xs font-semibold">Vérifié</span>
                                        </div>
                                    </footer>
                                </blockquote>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    CTA
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="final-cta-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="relative overflow-hidden rounded-3xl p-8 md:p-14 text-center"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {/* Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/60 via-orange-950/80 to-surface-900" />
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
                            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />

                            <div className="relative z-10">
                                <motion.p variants={fadeIn} className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-4">
                                    Rejoignez Kbouffe
                                </motion.p>
                                <motion.h2
                                    id="final-cta-heading"
                                    variants={fadeIn}
                                    className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4"
                                >
                                    Ouvrez votre restaurant<br className="hidden md:block" /> en ligne aujourd'hui
                                </motion.h2>
                                <motion.p variants={fadeIn} className="text-surface-400 text-base md:text-lg max-w-xl mx-auto mb-10">
                                    Inscription gratuite. Zéro commission. Votre restaurant visible
                                    auprès de milliers de clients camerounais dès ce soir.
                                </motion.p>
                                <motion.div variants={fadeIn}>
                                    <Link
                                        href="/register/restaurant"
                                        className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:-translate-y-0.5 shadow-2xl shadow-orange-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:ring-offset-surface-950"
                                        aria-label="Ouvrir mon restaurant gratuitement sur Kbouffe"
                                    >
                                        Ouvrir mon restaurant gratuitement
                                        <ArrowRight size={20} />
                                    </Link>
                                </motion.div>
                                <motion.p variants={fadeIn} className="mt-5 text-xs text-surface-600">
                                    ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Opérationnel en 10 min &nbsp;·&nbsp; ✓ 0 % commission
                                </motion.p>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="bg-white dark:bg-surface-950 border-t border-surface-200/50 dark:border-surface-800/50 py-10">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <Link href="/" aria-label="Retour à l'accueil Kbouffe">
                            <KbouffeLogo height={32} variant="white" />
                        </Link>
                        <nav aria-label="Liens secondaires">
                            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-surface-500">
                                <li><Link href="/pour-les-clients" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Pour les clients</Link></li>
                                <li><Link href="/pour-les-agriculteurs" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Pour les agriculteurs</Link></li>
                                <li><Link href="/pricing" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Tarifs</Link></li>
                                <li><Link href="/terms" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">CGU</Link></li>
                                <li><Link href="/privacy" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Confidentialité</Link></li>
                                <li><Link href="/contact" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Contact</Link></li>
                            </ul>
                        </nav>
                        <p className="text-xs text-surface-600 text-center md:text-right">
                            © {new Date().getFullYear()} Kbouffe · La food, version camerounaise
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
