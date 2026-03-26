"use client";

/**
 * Landing page — Pour les agriculteurs
 *
 * Audience : farmers and agricultural suppliers who want to sell their
 *            produce directly to restaurants via the KBouffe B2B marketplace.
 *
 * Sections :
 *   1. Hero       — "Vendez vos récoltes directement aux restaurants"
 *                   (emerald gradient + wheat SVG art)
 *   2. How it works — 3 steps
 *   3. Benefits   — 4 cards
 *   4. Products   — accepted product category tags
 *   5. Testimonial — Mama Nkeng (from register page)
 *   6. CTA        — "Inscrire mon exploitation"
 *
 * Usage :
 *   Accessible via /pour-les-agriculteurs
 *   Linked from the Navbar audience dropdown
 */

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
    Wheat,
    Truck,
    MapPin,
    Package,
    CheckCircle2,
    Leaf,
    ArrowRight,
    ChevronRight,
    ShieldCheck,
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
        icon: Wheat,
        title: "Inscrivez votre exploitation",
        desc: "Créez votre profil fournisseur en quelques minutes. Renseignez votre région, vos types de cultures et vos coordonnées MTN MoMo.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        number: "02",
        icon: Package,
        title: "Listez vos produits",
        desc: "Publiez vos stocks disponibles avec quantités, prix et fréquence de récolte. Les restaurants voient vos offres en temps réel.",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
        border: "border-lime-500/20",
    },
    {
        number: "03",
        icon: Truck,
        title: "Recevez des commandes et payez via MTN MoMo",
        desc: "Les restaurants commandent directement chez vous. Vous encaissez le paiement sur votre téléphone avant même la livraison.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
    },
] as const;

const BENEFITS = [
    {
        icon: Leaf,
        title: "Zéro intermédiaire",
        desc: "Vendez directement aux restaurants sans courtier, sans marché intermédiaire. Vous fixez vos prix et gardez 100 % de la marge.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        icon: ShieldCheck,
        title: "Paiement garanti MoMo",
        desc: "Chaque commande est sécurisée. Vous êtes payé par MTN Mobile Money avant la livraison. Zéro risque d'impayé.",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
    },
    {
        icon: MapPin,
        title: "Toutes régions",
        desc: "Que vous soyez à Maroua, Bafoussam, Garoua ou Kribi — votre exploitation est visible par les restaurants de toute la région.",
        color: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
    },
    {
        icon: CheckCircle2,
        title: "KYC simple",
        desc: "Inscription rapide avec votre numéro de téléphone. Vérification légère adaptée aux réalités du terrain camerounais.",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
        border: "border-lime-500/20",
    },
] as const;

const PRODUCT_CATEGORIES = [
    { label: "Légumes & Fruits", emoji: "🥬" },
    { label: "Céréales & Grains", emoji: "🌾" },
    { label: "Viande & Poisson", emoji: "🥩" },
    { label: "Produits laitiers", emoji: "🥛" },
    { label: "Épices & Condiments", emoji: "🌶️" },
    { label: "Huile & Graisses", emoji: "🫙" },
    { label: "Tubercules", emoji: "🥔" },
    { label: "Légumineuses", emoji: "🫘" },
    { label: "Champignons", emoji: "🍄" },
    { label: "Fruits tropicaux", emoji: "🍍" },
] as const;

const REGIONS = [
    "Douala", "Yaoundé", "Bafoussam", "Garoua",
    "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa",
    "Buea", "Kribi", "Limbé", "Bamenda",
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function PourLesAgricultureursPage() {
    return (
        <div className="min-h-screen bg-surface-950 flex flex-col">
            {/* ── Navbar ── */}
            <Navbar />

            <main className="flex-1">

                {/* ════════════════════════════════════════════════════════
                    HERO — emerald gradient + wheat SVG art
                ════════════════════════════════════════════════════════ */}
                <header
                    className="relative overflow-hidden h-[500px] flex items-center"
                    aria-labelledby="hero-heading"
                >
                    {/* ── Background: gradient + SVG wheat art ── */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700" />
                    <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-lime-400/20 blur-3xl" />
                    <div className="absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-emerald-950/80 blur-2xl" />

                    {/* Wheat field SVG illustration */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 900 500"
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden="true"
                        focusable="false"
                    >
                        {/* Rolling hills */}
                        <path d="M0 360 Q225 300 450 330 Q675 360 900 300 L900 500 L0 500 Z" fill="#14532d" opacity="0.55" />
                        <path d="M0 400 Q225 370 450 385 Q675 400 900 370 L900 500 L0 500 Z" fill="#052e16" opacity="0.7" />

                        {/* Wheat stalks */}
                        {([60, 150, 240, 330, 420, 510, 600, 690, 780, 870] as const).map((x) => (
                            <g key={x} transform={`translate(${x}, 150)`}>
                                <line x1="0" y1="200" x2="0" y2="0" stroke="#fef08a" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
                                <ellipse cx="-4" cy="-2" rx="5" ry="14" fill="#fef08a" opacity="0.4" transform="rotate(-12 -4 -2)" />
                                <ellipse cx="4" cy="-2" rx="5" ry="14" fill="#fef08a" opacity="0.35" transform="rotate(12 4 -2)" />
                            </g>
                        ))}

                        {/* Sun */}
                        <circle cx="820" cy="80" r="50" fill="#fde68a" opacity="0.15" />
                        <circle cx="820" cy="80" r="30" fill="#fde68a" opacity="0.22" />
                    </svg>

                    {/* Fade-to-dark overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />

                    {/* ── Hero content ── */}
                    <div className="container mx-auto px-4 md:px-6 relative z-10 pt-16 md:pt-20">
                        <motion.div
                            className="max-w-2xl"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Badge */}
                            <motion.div variants={fadeIn} className="mb-5">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
                                    <Wheat size={13} />
                                    Marché B2B · Cameroun
                                </span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                id="hero-heading"
                                variants={fadeIn}
                                className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5"
                            >
                                Vendez vos récoltes{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">
                                    directement aux restaurants
                                </span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p
                                variants={fadeIn}
                                className="text-emerald-100/80 text-base md:text-lg leading-relaxed mb-8 max-w-xl"
                            >
                                Rejoignez le marché B2B de Kbouffe. Plus besoin d'attendre le marché
                                du mardi — vos produits partent directement aux restaurants de votre région,
                                payés par MTN MoMo.
                            </motion.p>

                            {/* CTA */}
                            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/register/fournisseur"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-bold rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5 shadow-xl shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
                                    aria-label="Inscrire mon exploitation agricole sur Kbouffe"
                                >
                                    Inscrire mon exploitation
                                    <ArrowRight size={18} />
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-base border border-white/20 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                    aria-label="En savoir plus sur le fonctionnement"
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
                <motion.section
                    className="border-b border-surface-800/50 bg-surface-900/40"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                    aria-label="Kbouffe en chiffres"
                >
                    <div className="container mx-auto px-4 md:px-6 py-6">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { value: "100 %", label: "gratuit pour s'inscrire", color: "text-emerald-400" },
                                { value: "0 %", label: "de commission", color: "text-lime-400" },
                                { value: "+12 régions", label: "couvertes", color: "text-yellow-400" },
                                { value: "MTN MoMo", label: "paiement garanti", color: "text-green-400" },
                            ].map(({ value, label, color }) => (
                                <motion.div key={label} variants={fadeIn} className="text-center">
                                    <dt className={`text-2xl md:text-3xl font-extrabold ${color}`}>{value}</dt>
                                    <dd className="text-xs text-surface-500 mt-1 font-medium">{label}</dd>
                                </motion.div>
                            ))}
                        </dl>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    HOW IT WORKS
                ════════════════════════════════════════════════════════ */}
                <section
                    id="how-it-works"
                    className="py-20 md:py-28"
                    aria-labelledby="how-it-works-heading"
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
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Simple & rapide
                            </motion.p>
                            <motion.h2
                                id="how-it-works-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
                            >
                                Comment ça marche ?
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-400 text-base max-w-lg mx-auto">
                                De l'inscription à votre première vente, tout est conçu pour aller vite.
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
                                    className={`relative rounded-2xl border ${border} bg-surface-900/50 p-7 hover:bg-surface-900 transition-colors duration-300`}
                                >
                                    {/* Step number */}
                                    <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-surface-950 border border-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                                        {number}
                                    </span>

                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-5`} aria-hidden="true">
                                        <Icon size={22} className={color} />
                                    </div>

                                    <h3 className="text-white font-bold text-lg mb-3 leading-snug">{title}</h3>
                                    <p className="text-surface-400 text-sm leading-relaxed">{desc}</p>

                                    {/* Connector */}
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
                        {/* Header */}
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Pourquoi Kbouffe ?
                            </motion.p>
                            <motion.h2
                                id="benefits-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
                            >
                                Conçu pour les producteurs camerounais
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-400 text-base max-w-lg mx-auto">
                                Pas de jargon technologique. Une app simple, adaptée au terrain.
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
                            {BENEFITS.map(({ icon: Icon, title, desc, color, bg, border }) => (
                                <motion.li
                                    key={title}
                                    variants={fadeIn}
                                    className={`group flex flex-col gap-4 rounded-2xl border ${border} bg-surface-900/60 p-6 hover:bg-surface-900 hover:-translate-y-1 transition-all duration-300`}
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
                    PRODUCTS ACCEPTED
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-16 md:py-20"
                    aria-labelledby="products-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="max-w-3xl mx-auto text-center"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Catalogue ouvert
                            </motion.p>
                            <motion.h2
                                id="products-heading"
                                variants={fadeIn}
                                className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"
                            >
                                Tous types de produits agricoles acceptés
                            </motion.h2>
                            <motion.p variants={fadeIn} className="text-surface-400 text-sm mb-10">
                                Aucune restriction — si un restaurant peut le cuisiner, vous pouvez le vendre.
                            </motion.p>

                            {/* Category tags */}
                            <motion.ul
                                className="flex flex-wrap justify-center gap-3"
                                role="list"
                                variants={staggerContainer}
                            >
                                {PRODUCT_CATEGORIES.map(({ label, emoji }) => (
                                    <motion.li
                                        key={label}
                                        variants={fadeIn}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/35 transition-colors duration-200 cursor-default"
                                    >
                                        <span aria-hidden="true">{emoji}</span>
                                        <span className="text-emerald-300 text-sm font-medium">{label}</span>
                                    </motion.li>
                                ))}
                                {/* "et plus..." pill */}
                                <motion.li
                                    variants={fadeIn}
                                    className="inline-flex items-center px-4 py-2 rounded-full bg-surface-800/60 border border-surface-700/40"
                                >
                                    <span className="text-surface-400 text-sm font-medium">et plus encore…</span>
                                </motion.li>
                            </motion.ul>
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    REGIONS COVERAGE
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="py-14 bg-surface-900/20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                    aria-labelledby="regions-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Présents partout au Cameroun
                            </motion.p>
                            <motion.h2
                                id="regions-heading"
                                variants={fadeIn}
                                className="text-xl md:text-2xl font-extrabold text-white mb-6"
                            >
                                Votre exploitation, visible dans{" "}
                                <span className="text-emerald-400">toutes les villes</span>
                            </motion.h2>
                            <motion.ul
                                className="flex flex-wrap justify-center gap-2.5"
                                role="list"
                                variants={staggerContainer}
                            >
                                {REGIONS.map((region) => (
                                    <motion.li
                                        key={region}
                                        variants={fadeIn}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-900/60 border border-surface-800/50 text-surface-400 text-xs font-medium"
                                    >
                                        <MapPin size={10} className="text-emerald-500" aria-hidden="true" />
                                        {region}
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </div>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    TESTIMONIAL — Mama Nkeng
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="py-16 md:py-20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    aria-label="Témoignage agriculteur"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-2xl mx-auto">
                            {/* Card */}
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-surface-900/80 to-surface-900/60 border border-emerald-500/15 p-8 md:p-10 relative overflow-hidden">
                                {/* Decorative quote */}
                                <div className="absolute top-4 left-6 text-emerald-500/15 text-9xl font-serif leading-none pointer-events-none select-none" aria-hidden="true">&ldquo;</div>

                                {/* Decorative blob */}
                                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-emerald-500/6 blur-2xl pointer-events-none" aria-hidden="true" />

                                <div className="relative z-10">
                                    <blockquote>
                                        <p className="text-white text-base md:text-lg italic leading-relaxed mb-7">
                                            &ldquo;Depuis que je suis sur Kbouffe, mes tomates partent
                                            directement aux restaurants de Bafoussam. Plus besoin
                                            d&apos;attendre le marché du mardi.&rdquo;
                                        </p>
                                        <footer className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div
                                                className="w-11 h-11 rounded-full bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center text-base font-extrabold text-emerald-300 shrink-0"
                                                aria-hidden="true"
                                            >
                                                M
                                            </div>
                                            <div>
                                                <cite className="not-italic text-white font-bold text-sm">Mama Nkeng</cite>
                                                <p className="text-emerald-400/70 text-xs mt-0.5">Maraîchère · Bafoussam</p>
                                            </div>
                                            {/* Verified badge */}
                                            <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <ShieldCheck size={13} className="text-emerald-400" aria-hidden="true" />
                                                <span className="text-emerald-400 text-xs font-semibold">Fournisseur vérifié</span>
                                            </div>
                                        </footer>
                                    </blockquote>

                                    {/* Divider */}
                                    <div className="mt-8 pt-6 border-t border-surface-800/50">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            {[
                                                { value: "2 ans", label: "sur Kbouffe" },
                                                { value: "+8 restaurants", label: "clients réguliers" },
                                                { value: "MTN MoMo", label: "paiements reçus" },
                                            ].map(({ value, label }) => (
                                                <div key={label}>
                                                    <p className="text-emerald-300 font-bold text-sm">{value}</p>
                                                    <p className="text-surface-500 text-xs mt-0.5">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            className="relative overflow-hidden rounded-3xl p-8 md:p-14 text-center"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {/* Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-surface-900" />

                            {/* Wheat SVG decoration (miniature) */}
                            <svg
                                className="absolute inset-0 w-full h-full opacity-20"
                                viewBox="0 0 900 340"
                                preserveAspectRatio="xMidYMid slice"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M0 260 Q225 220 450 240 Q675 260 900 220 L900 340 L0 340 Z" fill="#14532d" opacity="0.7" />
                                {([80, 200, 320, 440, 560, 680, 800] as const).map((x) => (
                                    <g key={x} transform={`translate(${x}, 80)`}>
                                        <line x1="0" y1="160" x2="0" y2="0" stroke="#fef08a" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
                                        <ellipse cx="-3" cy="-1" rx="4" ry="11" fill="#fef08a" opacity="0.3" transform="rotate(-12 -3 -1)" />
                                        <ellipse cx="3" cy="-1" rx="4" ry="11" fill="#fef08a" opacity="0.25" transform="rotate(12 3 -1)" />
                                    </g>
                                ))}
                            </svg>

                            {/* Grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(52,211,153,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                            <div className="absolute -top-16 right-0 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

                            <div className="relative z-10">
                                <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-4">
                                    Rejoignez des centaines d'agriculteurs
                                </motion.p>
                                <motion.h2
                                    id="cta-heading"
                                    variants={fadeIn}
                                    className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5"
                                >
                                    Votre exploitation mérite<br className="hidden md:block" />{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">
                                        de meilleurs débouchés
                                    </span>
                                </motion.h2>
                                <motion.p variants={fadeIn} className="text-emerald-100/70 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                                    Inscrivez-vous gratuitement et commencez à vendre vos produits
                                    aux restaurants camerounais dès cette semaine.
                                </motion.p>
                                <motion.div
                                    variants={fadeIn}
                                    className="flex flex-col sm:flex-row justify-center gap-4"
                                >
                                    <Link
                                        href="/register/fournisseur"
                                        className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:-translate-y-0.5 shadow-2xl shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
                                        aria-label="Inscrire mon exploitation agricole sur Kbouffe"
                                    >
                                        Inscrire mon exploitation
                                        <ArrowRight size={20} />
                                    </Link>
                                    <Link
                                        href="/stores"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-base border border-white/20 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                        aria-label="Explorer les restaurants partenaires"
                                    >
                                        Voir les restaurants partenaires
                                    </Link>
                                </motion.div>
                                <motion.p variants={fadeIn} className="mt-6 text-xs text-emerald-900/80 text-surface-600">
                                    ✓ Inscription 100 % gratuite &nbsp;·&nbsp; ✓ Paiement MTN MoMo garanti &nbsp;·&nbsp; ✓ Toutes régions du Cameroun
                                </motion.p>
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
                                <li><Link href="/pour-les-clients" className="hover:text-surface-300 transition-colors">Pour les clients</Link></li>
                                <li><Link href="/pour-les-restaurateurs" className="hover:text-surface-300 transition-colors">Pour les restaurateurs</Link></li>
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
