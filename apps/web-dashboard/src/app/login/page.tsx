"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Utensils, User, LogIn, Wheat, CheckCircle2 } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { useSearchParams } from "next/navigation";

function ResetSuccessBanner() {
    const searchParams = useSearchParams();
    const resetSuccess = searchParams.get("reset") === "1";
    if (!resetSuccess) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 mb-8 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm"
        >
            <CheckCircle2 size={18} className="shrink-0" />
            <span>
                <strong>Mot de passe mis à jour !</strong> Connectez-vous avec votre nouveau mot de passe.
            </span>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 p-6 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/">
                        <KbouffeLogo height={32} />
                    </Link>
                    <Link 
                        href="/register"
                        className="text-sm font-semibold text-surface-600 dark:text-surface-400 hover:text-brand-500 transition-colors"
                    >
                        Créer un compte
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 pt-24 pb-12">
                <div className="max-w-4xl w-full">
                    {/* Password reset success banner */}
                    <Suspense fallback={null}>
                        <ResetSuccessBanner />
                    </Suspense>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 text-brand-500 mb-6">
                            <LogIn size={28} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 tracking-tight">
                            Content de vous <span className="text-brand-500 italic">revoir</span>.
                        </h1>
                        <p className="text-lg text-surface-600 dark:text-surface-400 max-w-xl mx-auto">
                            Choisissez votre espace pour accéder à votre univers Kbouffe.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Client Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Link href="/login/client" className="group block h-full">
                                <div className="relative h-full flex flex-col bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-xl transition-all duration-500 hover:shadow-brand-500/10 hover:border-brand-500/30 hover:-translate-y-2">
                                    <div className="relative h-64 overflow-hidden">
                                        <Image 
                                            src="/images/client_registration_hero.png" 
                                            alt="Espace Client" 
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 left-6">
                                            <div className="bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full mb-2 inline-flex items-center gap-1.5 shadow-lg">
                                                <User size={10} />
                                                Client
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">Consulter mes commandes</h3>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <p className="text-surface-600 dark:text-surface-400 mb-8 flex-1 leading-relaxed">
                                            Suivez vos livraisons en temps réel, gérez vos adresses et profitez de vos offres de fidélité personnalisées.
                                        </p>
                                        <div className="flex items-center text-brand-500 font-bold group-hover:gap-2 transition-all">
                                            <span>Accéder à mon espace</span>
                                            <ArrowRight size={18} className="ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Merchant Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link href="/login/restaurant" className="group block h-full">
                                <div className="relative h-full flex flex-col bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-xl transition-all duration-500 hover:shadow-brand-500/10 hover:border-brand-500/30 hover:-translate-y-2">
                                    <div className="relative h-64 overflow-hidden">
                                        <Image 
                                            src="/images/wizard_step2.png" 
                                            alt="Espace Restaurant" 
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 left-6">
                                            <div className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full mb-2 inline-flex items-center gap-1.5 shadow-lg">
                                                <Utensils size={10} />
                                                Restaurateur
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">Gérer mon établissement</h3>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <p className="text-surface-600 dark:text-surface-400 mb-8 flex-1 leading-relaxed">
                                            Accédez à votre tableau de bord, gérez vos menus, analysez vos performances et optimisez vos ventes.
                                        </p>
                                        <div className="flex items-center text-orange-500 font-bold group-hover:gap-2 transition-all">
                                            <span>Tableau de bord restaurant</span>
                                            <ArrowRight size={18} className="ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Supplier Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Link href="/login/fournisseur" className="group block h-full">
                                <div className="relative h-full flex flex-col bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-xl transition-all duration-500 hover:shadow-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-2">
                                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-lime-600 flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-30">
                                            {/* Simple wheat SVG pattern */}
                                            <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
                                                {[20,60,100,140,180].map((x) => (
                                                    <g key={x} transform={`translate(${x}, 30)`}>
                                                        <line x1="0" y1="140" x2="0" y2="0" stroke="#fef08a" strokeWidth="2" opacity="0.6" />
                                                        <ellipse cx="-5" cy="-4" rx="6" ry="16" fill="#fef08a" opacity="0.5" transform="rotate(-12 -5 -4)" />
                                                        <ellipse cx="5" cy="-4" rx="6" ry="16" fill="#fef08a" opacity="0.45" transform="rotate(12 5 -4)" />
                                                    </g>
                                                ))}
                                            </svg>
                                        </div>
                                        <div className="absolute bottom-6 left-6">
                                            <div className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full mb-2 inline-flex items-center gap-1.5 shadow-lg">
                                                <Wheat size={10} />
                                                Agriculteur
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">Gérer mon catalogue</h3>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <p className="text-surface-600 dark:text-surface-400 mb-8 flex-1 leading-relaxed">
                                            Gérez votre catalogue, suivez vos commandes et approvisionnez les restaurants de votre région.
                                        </p>
                                        <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold group-hover:gap-2 transition-all">
                                            <span>Mon espace fournisseur</span>
                                            <ArrowRight size={18} className="ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>

                    <footer className="mt-16 text-center">
                        <Link 
                            href="/" 
                            className="text-sm font-medium text-surface-500 dark:text-surface-500 hover:text-brand-500 transition-colors inline-flex items-center gap-2"
                        >
                            <ArrowRight size={14} className="rotate-180" />
                            Retour à l'accueil
                        </Link>
                    </footer>
                </div>
            </main>
        </div>
    );
}
