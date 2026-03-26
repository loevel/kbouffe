"use client";

/**
 * Landing page — Pour les clients
 *
 * Audience : customers who want to discover and order from Cameroonian restaurants.
 *
 * Sections :
 *   1. Hero       — "Mangez bien, livré chez vous"
 *   2. How it works — 3 steps
 *   3. Benefits   — 4 feature cards
 *   4. CTA        — Register / Explore restaurants
 *
 * Usage :
 *   Accessible via /pour-les-clients
 *   Linked from the Navbar audience dropdown
 */

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
    Utensils,
    MapPin,
    Smartphone,
    CreditCard,
    Clock,
    Star,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
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

const STEPS = [
    {
        number: "01",
        icon: MapPin,
        title: "Choisissez un restaurant",
        desc: "Parcourez des dizaines de restaurants camerounais vérifiés près de chez vous. Filtrez par cuisine, note ou livraison.",
        color: "text-brand-400",
        bg: "bg-brand-500/10",
        border: "border-brand-500/20",
    },
    {
        number: "02",
        icon: Utensils,
        title: "Commandez en ligne",
        desc: "Composez votre panier, personnalisez vos plats et passez commande en quelques secondes depuis votre téléphone.",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
    },
    {
        number: "03",
        icon: CreditCard,
        title: "Payez par MTN MoMo ou Orange Money",
        desc: "Règlement 100 % mobile money — sécurisé, sans carte bancaire. Votre argent est protégé jusqu'à la livraison.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
    },
] as const;

const BENEFITS = [
    {
        icon: CheckCircle2,
        title: "Restaurants vérifiés",
        desc: "Chaque établissement est contrôlé par notre équipe. Hygiène, qualité et sérieux garantis avant tout référencement.",
        color: "text-brand-400",
        bg: "bg-brand-500/10",
    },
    {
        icon: CreditCard,
        title: "Paiement Mobile Money",
        desc: "MTN MoMo et Orange Money acceptés nativement. Zéro frais cachés, confirmation instantanée.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
    {
        icon: Clock,
        title: "Suivi en temps réel",
        desc: "Suivez l'avancement de votre commande de la cuisine jusqu'à votre porte, à la minute près.",
        color: "text-sky-400",
        bg: "bg-sky-500/10",
    },
    {
        icon: Star,
        title: "Offres et réductions",
        desc: "Accédez à des promos exclusives, codes de réduction et plats du jour négociés directement avec les restaurants.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
] as const;

const TRUST_STATS = [
    { value: "+2 000", label: "commandes livrées" },
    { value: "+50", label: "restaurants partenaires" },
    { value: "4.8 ★", label: "note moyenne" },
    { value: "< 45 min", label: "délai moyen" },
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function PourLesClientsPage() {
    return (
        <div className="min-h-screen bg-surface-950 flex flex-col">
            {/* ── Navbar ── */}
            <Navbar />

            <main className="flex-1">

                {/* ════════════════════════════════════════════════════════
                    HERO
                ════════════════════════════════════════════════════════ */}
                <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">

                    {/* Background layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-950 to-brand-950/30" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-500/6 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <motion.div
                            className="max-w-3xl mx-auto text-center"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Badge */}
                            <motion.div variants={fadeIn} className="mb-6">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-400 text-xs font-semibold uppercase tracking-widest">
                                    <Utensils size={13} />
                                    Pour les gourmands
                                </span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                variants={fadeIn}
                                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
                            >
                                Mangez bien,{" "}
                                <span className="relative">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-orange-400">
                                        livré chez vous
                                    </span>
                                    {/* Underline decoration */}
                                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-400/60 to-orange-400/0 rounded-full" />
                                </span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p
                                variants={fadeIn}
                                className="text-lg md:text-xl text-surface-400 leading-relaxed max-w-2xl mx-auto mb-10"
                            >
                                Découvrez les meilleurs restaurants camerounais de votre ville.
                                Commandez en ligne, payez avec votre mobile money et recevez
                                vos plats préférés à votre porte.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                variants={fadeIn}
                                className="flex flex-col sm:flex-row justify-center gap-4"
                            >
                                <Link
                                    href="/register/client"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-400 hover:to-orange-400 text-white font-bold rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
                                    aria-label="Créer un compte client gratuitement"
                                >
                                    Commencer gratuitement
                                    <ArrowRight size={18} />
                                </Link>
                                <Link
                                    href="/stores"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface-800/60 hover:bg-surface-700/60 text-white font-semibold rounded-xl text-base border border-surface-700/50 hover:border-surface-600/50 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
                                    aria-label="Explorer les restaurants disponibles"
                                >
                                    <MapPin size={18} className="text-brand-400" />
                                    Explorer les restaurants
                                </Link>
                            </motion.div>

                            {/* Trust indicators */}
                            <motion.p variants={fadeIn} className="mt-8 text-xs text-surface-500">
                                ✓ Inscription gratuite &nbsp;·&nbsp; ✓ Sans engagement &nbsp;·&nbsp; ✓ Paiement mobile money sécurisé
                            </motion.p>
                        </motion.div>
                    </div>

                    {/* Floating food emoji decoration */}
                    <div className="absolute top-20 left-8 text-4xl opacity-10 rotate-12 pointer-events-none select-none hidden md:block" aria-hidden="true">🍲</div>
                    <div className="absolute top-32 right-12 text-3xl opacity-10 -rotate-6 pointer-events-none select-none hidden md:block" aria-hidden="true">🍗</div>
                    <div className="absolute bottom-16 left-16 text-3xl opacity-8 rotate-3 pointer-events-none select-none hidden lg:block" aria-hidden="true">🥗</div>
                    <div className="absolute bottom-20 right-20 text-4xl opacity-8 -rotate-12 pointer-events-none select-none hidden lg:block" aria-hidden="true">🍛</div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    TRUST STATS BAR
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="border-y border-surface-800/50 bg-surface-900/40 backdrop-blur-sm"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                >
                    <div className="container mx-auto px-4 md:px-6 py-6">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                            {TRUST_STATS.map(({ value, label }) => (
                                <div key={label} className="text-center">
                                    <dt className="text-2xl md:text-3xl font-extrabold text-white">{value}</dt>
                                    <dd className="text-xs text-surface-500 mt-1 font-medium uppercase tracking-wider">{label}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    HOW IT WORKS
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="how-it-works-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        {/* Section header */}
                        <motion.div
                            className="text-center mb-16"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                C'est simple
                            </motion.p>
                            <motion.h2
                                id="how-it-works-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
                            >
                                Comment ça marche ?
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-400 text-base max-w-lg mx-auto">
                                De la faim à la livraison en 3 étapes, tout depuis votre téléphone.
                            </motion.p>
                        </motion.div>

                        {/* Steps */}
                        <motion.ol
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {STEPS.map(({ number, icon: Icon, title, desc, color, bg, border }) => (
                                <motion.li
                                    key={number}
                                    variants={fadeIn}
                                    className={`relative group rounded-2xl border ${border} bg-surface-900/50 p-6 hover:bg-surface-900 transition-colors duration-300`}
                                >
                                    {/* Step number */}
                                    <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-surface-950 border border-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                                        {number}
                                    </span>

                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-5`} aria-hidden="true">
                                        <Icon size={22} className={color} />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-white font-bold text-lg mb-3 leading-snug">{title}</h3>
                                    <p className="text-surface-400 text-sm leading-relaxed">{desc}</p>

                                    {/* Connector arrow (desktop) */}
                                    {number !== "03" && (
                                        <ChevronRight
                                            size={20}
                                            className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 text-surface-700 z-10"
                                            aria-hidden="true"
                                        />
                                    )}
                                </motion.li>
                            ))}
                        </motion.ol>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    BENEFITS
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-900/20"
                    aria-labelledby="benefits-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        {/* Section header */}
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Pourquoi Kbouffe ?
                            </motion.p>
                            <motion.h2
                                id="benefits-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
                            >
                                Tout ce dont vous avez besoin
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-400 text-base max-w-lg mx-auto">
                                Une expérience pensée pour le marché camerounais, de A à Z.
                            </motion.p>
                        </motion.div>

                        {/* Benefit cards */}
                        <motion.ul
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
                                <motion.li
                                    key={title}
                                    variants={fadeIn}
                                    className="group flex flex-col gap-4 rounded-2xl bg-surface-900/60 border border-surface-800/60 p-6 hover:bg-surface-900 hover:border-surface-700/60 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${bg}`} aria-hidden="true">
                                        <Icon size={21} className={color} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                                        <p className="text-surface-400 text-sm leading-relaxed">{desc}</p>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    TESTIMONIAL STRIP
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="py-16 md:py-20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    aria-label="Témoignage client"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-2xl mx-auto text-center">
                            <div className="flex justify-center gap-1 mb-5" aria-label="Note de 5 étoiles">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={18} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
                                ))}
                            </div>
                            <blockquote>
                                <p className="text-white text-lg md:text-xl font-medium italic leading-relaxed mb-6">
                                    &ldquo;J'ai découvert un restaurant de ndolé à 10 minutes de chez moi que je ne connaissais pas.
                                    La commande a été livrée en 35 minutes, j'ai payé avec mon MTN MoMo. Impeccable !&rdquo;
                                </p>
                                <footer className="flex items-center justify-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-300" aria-hidden="true">
                                        A
                                    </div>
                                    <div className="text-left">
                                        <cite className="not-italic text-white text-sm font-semibold">Angèle K.</cite>
                                        <p className="text-surface-500 text-xs">Cliente · Douala</p>
                                    </div>
                                </footer>
                            </blockquote>
                        </div>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    CTA SECTION
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="cta-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-orange-500 p-8 md:p-14 text-center"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {/* Decorative circles */}
                            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" aria-hidden="true" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-brand-800/30 blur-xl pointer-events-none" aria-hidden="true" />
                            {/* Grid overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" aria-hidden="true" />

                            <div className="relative z-10">
                                <motion.div variants={fadeIn} className="mb-3">
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold">
                                        <Smartphone size={12} />
                                        Disponible maintenant
                                    </span>
                                </motion.div>
                                <motion.h2
                                    id="cta-heading"
                                    variants={fadeIn}
                                    className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4"
                                >
                                    Prêt à commander ?
                                </motion.h2>
                                <motion.p variants={fadeIn} className="text-brand-100 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
                                    Créez votre compte en 2 minutes et explorez des dizaines
                                    de restaurants camerounais près de chez vous.
                                </motion.p>
                                <motion.div
                                    variants={fadeIn}
                                    className="flex flex-col sm:flex-row justify-center gap-4"
                                >
                                    <Link
                                        href="/register/client"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-600 hover:bg-surface-50 font-bold rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
                                        aria-label="Télécharger l'app Kbouffe et créer un compte"
                                    >
                                        <Smartphone size={18} />
                                        Télécharger l'app
                                    </Link>
                                    <Link
                                        href="/stores"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl text-base border border-white/25 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
                                        aria-label="Explorer les restaurants partenaires"
                                    >
                                        <MapPin size={18} />
                                        Explorer les restaurants
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="bg-surface-950 border-t border-surface-800/50 py-10">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <Link href="/" aria-label="Retour à l'accueil Kbouffe">
                            <KbouffeLogo height={32} variant="white" />
                        </Link>
                        <nav aria-label="Liens secondaires">
                            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-surface-500">
                                <li><Link href="/pour-les-restaurateurs" className="hover:text-surface-300 transition-colors">Pour les restaurateurs</Link></li>
                                <li><Link href="/pour-les-agriculteurs" className="hover:text-surface-300 transition-colors">Pour les agriculteurs</Link></li>
                                <li><Link href="/pricing" className="hover:text-surface-300 transition-colors">Tarifs</Link></li>
                                <li><Link href="/terms" className="hover:text-surface-300 transition-colors">CGU</Link></li>
                                <li><Link href="/privacy" className="hover:text-surface-300 transition-colors">Confidentialité</Link></li>
                                <li><Link href="/contact" className="hover:text-surface-300 transition-colors">Contact</Link></li>
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
