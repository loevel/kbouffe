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
                            <div className="relative flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-emerald-200/50 dark:border-emerald-500/20 shadow-xl transition-all duration-500 hover:shadow-emerald-500/10 hover:border-emerald-500/40 hover:-translate-y-1 p-8">
                                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Wheat className="text-emerald-500" size={28} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        Agriculteur / Fournisseur
                                    </div>
                                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                                        Je vends mes produits aux restaurants
                                    </h2>
                                    <p className="text-surface-500 dark:text-surface-400 text-sm">
                                        Agriculteur individuel, coopérative ou grossiste — proposez vos produits frais directement aux restaurants de votre région.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 font-bold group-hover:gap-4 transition-all whitespace-nowrap">
                                    Inscrire mon exploitation
                                    <ArrowRight size={18} />
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
