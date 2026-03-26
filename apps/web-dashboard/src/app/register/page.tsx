"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Store, Wheat, ArrowRight, ChevronLeft } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";

export default function RegisterHubPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-surface-950 flex flex-col font-sans">
            {/* Header */}
            <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <KbouffeLogo height={32} />
                </Link>
                <Link 
                    href="/login" 
                    className="text-sm font-semibold text-surface-600 dark:text-surface-400 hover:text-brand-500 transition-colors"
                >
                    Déjà un compte ? Se connecter
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="max-w-5xl w-full">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 tracking-tight">
                            Bienvenue sur <span className="text-brand-500">Kbouffe</span>
                        </h1>
                        <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
                            Choisissez comment vous souhaitez rejoindre la révolution culinaire au Cameroun.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Client Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link href="/register/client" className="group block h-full">
                                <div className="relative h-full flex flex-col bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-xl transition-all duration-500 hover:shadow-brand-500/10 hover:border-brand-500/30 hover:-translate-y-2">
                                    <div className="relative h-64 overflow-hidden">
                                        <Image 
                                            src="/images/client_registration_hero.png" 
                                            alt="Manger avec Kbouffe" 
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 left-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold uppercase tracking-wider mb-2">
                                                <User size={12} />
                                                Client
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">Je veux commander</h2>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <p className="text-surface-600 dark:text-surface-400 mb-8 leading-relaxed">
                                            Accédez aux meilleurs restaurants de votre ville, commandez en quelques clics et faites-vous livrer en un rien de temps.
                                        </p>
                                        <div className="mt-auto flex items-center gap-2 text-brand-500 font-bold group-hover:gap-4 transition-all">
                                            Commencer sans attendre
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Merchant Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Link href="/register/restaurant" className="group block h-full">
                                <div className="relative h-full flex flex-col bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-xl transition-all duration-500 hover:shadow-brand-500/10 hover:border-brand-500/30 hover:-translate-y-2">
                                    <div className="relative h-64 overflow-hidden">
                                        <Image 
                                            src="/images/wizard_step2.png" 
                                            alt="Vendre sur Kbouffe" 
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 left-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-bold uppercase tracking-wider mb-2">
                                                <Store size={12} />
                                                Restaurateur
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">Je veux vendre</h2>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <p className="text-surface-600 dark:text-surface-400 mb-8 leading-relaxed">
                                            Digitalisez votre établissement, gérez vos commandes en ligne sans commission et boostez votre chiffre d'affaires.
                                        </p>
                                        <div className="mt-auto flex items-center gap-2 text-brand-500 font-bold group-hover:gap-4 transition-all">
                                            Ouvrir ma boutique gratuite
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Supplier/Farmer Card — full width below */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8"
                    >
                        <Link href="/register/fournisseur" className="group block">
                            <div className="relative flex flex-col bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-emerald-200/60 dark:border-emerald-500/20 shadow-xl transition-all duration-500 hover:shadow-emerald-500/20 hover:border-emerald-500/50 hover:-translate-y-2">

                                {/* ── Hero image area (CSS art) ── */}
                                <div className="relative h-64 overflow-hidden">
                                    {/* Base gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-700 to-lime-600" />
                                    {/* Ambient light blobs */}
                                    <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-lime-400/20 blur-3xl" />
                                    <div className="absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-emerald-950/70 blur-2xl" />
                                    <div className="absolute top-6 left-1/2 w-40 h-40 rounded-full bg-amber-300/10 blur-2xl" />

                                    {/* Field & wheat SVG illustration */}
                                    <svg
                                        className="absolute inset-0 w-full h-full"
                                        viewBox="0 0 900 260"
                                        preserveAspectRatio="xMidYMid slice"
                                        aria-hidden="true"
                                    >
                                        {/* Rolling hills */}
                                        <path d="M0 200 Q225 155 450 185 Q675 215 900 165 L900 260 L0 260 Z" fill="#14532d" opacity="0.55" />
                                        <path d="M0 220 Q225 195 450 210 Q675 225 900 195 L900 260 L0 260 Z" fill="#052e16" opacity="0.7" />
                                        {/* Sun */}
                                        <circle cx="800" cy="55" r="40" fill="#fde68a" opacity="0.18" />
                                        <circle cx="800" cy="55" r="25" fill="#fde68a" opacity="0.28" />
                                        <circle cx="800" cy="55" r="14" fill="#fbbf24" opacity="0.35" />
                                        {/* Sun rays */}
                                        {([0,45,90,135,180,225,270,315] as const).map((deg) => (
                                            <line
                                                key={deg}
                                                x1={800 + Math.cos((deg * Math.PI) / 180) * 30}
                                                y1={55  + Math.sin((deg * Math.PI) / 180) * 30}
                                                x2={800 + Math.cos((deg * Math.PI) / 180) * 48}
                                                y2={55  + Math.sin((deg * Math.PI) / 180) * 48}
                                                stroke="#fde68a" strokeWidth="2.5" opacity="0.3" strokeLinecap="round"
                                            />
                                        ))}
                                        {/* Wheat stalks */}
                                        {([60,140,220,300,380,460,540,620,700] as const).map((x) => (
                                            <g key={x} transform={`translate(${x}, 65)`}>
                                                {/* Stalk */}
                                                <line x1="0" y1="140" x2="0" y2="0" stroke="#fef08a" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
                                                {/* Grain head */}
                                                <ellipse cx="-4" cy="-2" rx="5" ry="13" fill="#fef08a" opacity="0.45" transform="rotate(-12 -4 -2)" />
                                                <ellipse cx="4"  cy="-2" rx="5" ry="13" fill="#fef08a" opacity="0.4"  transform="rotate(12 4 -2)" />
                                                {/* Leaves */}
                                                <line x1="-12" y1="38" x2="0" y2="28" stroke="#86efac" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
                                                <line x1="12"  y1="60" x2="0" y2="50" stroke="#86efac" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
                                            </g>
                                        ))}
                                    </svg>

                                    {/* Hover zoom overlay */}
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-700" />

                                    {/* Bottom scrim */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                                    {/* Badge + title overlay */}
                                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-lg">
                                                <Wheat size={12} />
                                                Agriculteur / Fournisseur
                                            </div>
                                            <h2 className="text-3xl font-extrabold text-white leading-snug">
                                                Je vends mes produits{" "}
                                                <span className="text-emerald-300">aux restaurants</span>
                                            </h2>
                                        </div>

                                        {/* Feature pills — desktop only */}
                                        <div className="hidden md:flex flex-col items-end gap-2">
                                            {[
                                                { emoji: "🌿", label: "Zéro intermédiaire" },
                                                { emoji: "💰", label: "Paiement MTN MoMo" },
                                                { emoji: "🚜", label: "Toutes régions" },
                                            ].map(({ emoji, label }) => (
                                                <div
                                                    key={label}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium"
                                                >
                                                    <span>{emoji}</span>
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Card body ── */}
                                <div className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    {/* Description + 3 icons */}
                                    <div className="flex-1">
                                        <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-5">
                                            Agriculteur individuel, coopérative ou grossiste — référencez vos produits frais
                                            (légumes, fruits, céréales, viande, poisson) et connectez-vous directement aux
                                            restaurants de votre localité.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { icon: "🌱", text: "Inscription gratuite" },
                                                { icon: "📦", text: "Gérez vos stocks" },
                                                { icon: "📊", text: "Suivez vos commandes" },
                                            ].map(({ icon, text }) => (
                                                <span
                                                    key={text}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold"
                                                >
                                                    {icon} {text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 group-hover:bg-emerald-400 group-hover:gap-4 transition-all whitespace-nowrap">
                                        Inscrire mon exploitation
                                        <ArrowRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12 text-center"
                    >
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Retour à l'accueil
                        </Link>
                    </motion.div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="p-8 text-center text-surface-400 text-sm">
                &copy; {new Date().getFullYear()} Kbouffe. Tous droits réservés.
            </footer>
        </div>
    );
}
