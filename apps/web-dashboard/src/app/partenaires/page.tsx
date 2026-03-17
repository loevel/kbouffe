"use client";

import Link from "next/link";
import { ArrowRight, Check, Store, Smartphone, Banknote, ShieldCheck, BarChart3, Globe, ClipboardEdit, Share2, UtensilsCrossed } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocale } from "@kbouffe/module-core/ui";

export default function PartenairesPage() {
    const { t } = useLocale();

    const reasons = [
        { icon: ShieldCheck, title: t.partenaires.why1Title, desc: t.partenaires.why1Desc, gradient: "from-brand-500 to-orange-600", glow: "bg-brand-500/10" },
        { icon: Banknote, title: t.partenaires.why2Title, desc: t.partenaires.why2Desc, gradient: "from-green-500 to-emerald-500", glow: "bg-green-500/10" },
        { icon: BarChart3, title: t.partenaires.why3Title, desc: t.partenaires.why3Desc, gradient: "from-blue-500 to-cyan-500", glow: "bg-blue-500/10" },
        { icon: Globe, title: t.partenaires.why4Title, desc: t.partenaires.why4Desc, gradient: "from-purple-500 to-violet-500", glow: "bg-purple-500/10" },
        { icon: Smartphone, title: t.partenaires.why5Title, desc: t.partenaires.why5Desc, gradient: "from-pink-500 to-rose-500", glow: "bg-pink-500/10" },
        { icon: Store, title: t.partenaires.why6Title, desc: t.partenaires.why6Desc, gradient: "from-amber-500 to-yellow-500", glow: "bg-amber-500/10" },
    ];

    const steps = [
        { number: "01", icon: ClipboardEdit, title: t.partenaires.step1Title, desc: t.partenaires.step1Desc },
        { number: "02", icon: Share2, title: t.partenaires.step2Title, desc: t.partenaires.step2Desc },
        { number: "03", icon: UtensilsCrossed, title: t.partenaires.step3Title, desc: t.partenaires.step3Desc },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-surface-950 font-sans">
            <Navbar />

            <main className="flex-1 pt-20">
                {/* Hero */}
                <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-surface-950">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-500/15 blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-brand-400/10 blur-[100px]" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10 py-24 md:py-32">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
                                <Store size={14} />
                                {t.partenaires.heroTag}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.05]">
                                {t.partenaires.heroTitle}
                            </h1>

                            <p className="text-xl text-surface-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                                {t.partenaires.heroDesc}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/register"
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
                                >
                                    {t.partenaires.heroCta}
                                    <ArrowRight size={20} />
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/20 hover:bg-white/15 rounded-xl text-lg font-semibold transition-all"
                                >
                                    {t.partenaires.pricingCta}
                                </Link>
                            </div>

                            <p className="text-surface-500 text-sm mt-5">{t.partenaires.heroCtaSub}</p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 mt-16 p-6 rounded-2xl bg-white/5 border border-surface-800">
                                <div>
                                    <div className="text-3xl font-bold text-white mb-1">0%</div>
                                    <div className="text-surface-400 text-xs">de commission</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white mb-1">2 min</div>
                                    <div className="text-surface-400 text-xs">pour demarrer</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white mb-1">24/7</div>
                                    <div className="text-surface-400 text-xs">commandes en ligne</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Kbouffe */}
                <section className="py-24 md:py-32 bg-white dark:bg-surface-950 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />
                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">
                                {t.partenaires.whyTag}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-surface-900 dark:text-white">
                                {t.partenaires.whyTitle}
                            </h2>
                            <p className="text-lg md:text-xl text-surface-600 dark:text-surface-400 leading-relaxed">
                                {t.partenaires.whyDesc}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reasons.map((r, i) => (
                                <div key={i} className={`group relative p-8 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
                                    <div className={`absolute inset-0 ${r.glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <r.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-surface-900 dark:text-white">{r.title}</h3>
                                        <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{r.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
                    <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-brand-500/5 blur-[100px]" />
                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-surface-800 text-surface-300 text-sm font-medium mb-6">
                                {t.partenaires.stepsTag}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
                                {t.partenaires.stepsTitle}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {steps.map((step, i) => (
                                <div key={i} className="relative group">
                                    {i < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-surface-700 to-transparent z-0" />
                                    )}
                                    <div className="relative bg-surface-900 border border-surface-800 rounded-2xl p-6 transition-all duration-300 hover:border-brand-500/30 hover:shadow-xl">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                                                <span className="text-brand-400 font-bold text-lg">{step.number}</span>
                                            </div>
                                            <step.icon className="h-5 w-5 text-surface-400 group-hover:text-brand-400 transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                                        <p className="text-surface-400 leading-relaxed text-sm">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing teaser */}
                <section className="py-20 bg-white dark:bg-surface-950">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">
                                {t.partenaires.pricingTag}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-surface-900 dark:text-white mb-4">
                                {t.partenaires.pricingTitle}
                            </h2>
                            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8">
                                {t.partenaires.pricingDesc}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/register/restaurant" className="flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-500/25">
                                    {t.partenaires.heroCta}
                                    <ArrowRight size={18} />
                                </Link>
                                <Link href="/pricing" className="flex items-center justify-center gap-2 px-7 py-3.5 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5">
                                    {t.partenaires.pricingCta}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
