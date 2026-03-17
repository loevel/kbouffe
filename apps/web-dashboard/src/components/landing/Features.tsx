"use client";

import { Store, Smartphone, Banknote, ShieldCheck, BarChart3, Globe, CalendarClock, MessageSquare, ClipboardCheck } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

export function Features() {
    const { t } = useLocale();

    const features = [
        {
            title: t.landing.featureMenuTitle,
            description: t.landing.featureMenuDesc,
            icon: Store,
            gradient: "from-brand-500 to-orange-600",
            bgGlow: "bg-brand-500/10",
        },
        {
            title: t.landing.featureMobileTitle,
            description: t.landing.featureMobileDesc,
            icon: Smartphone,
            gradient: "from-blue-500 to-cyan-500",
            bgGlow: "bg-blue-500/10",
        },
        {
            title: t.landing.featureMomoTitle,
            description: t.landing.featureMomoDesc,
            icon: Banknote,
            gradient: "from-green-500 to-emerald-500",
            bgGlow: "bg-green-500/10",
        },
        {
            title: t.landing.featureCommissionTitle,
            description: t.landing.featureCommissionDesc,
            icon: ShieldCheck,
            gradient: "from-purple-500 to-violet-500",
            bgGlow: "bg-purple-500/10",
        },
        {
            title: t.landing.featureDashboardTitle,
            description: t.landing.featureDashboardDesc,
            icon: BarChart3,
            gradient: "from-pink-500 to-rose-500",
            bgGlow: "bg-pink-500/10",
        },
        {
            title: t.landing.featureLinkTitle,
            description: t.landing.featureLinkDesc,
            icon: Globe,
            gradient: "from-amber-500 to-yellow-500",
            bgGlow: "bg-amber-500/10",
        },
        {
            title: t.landing.featureScheduledTitle,
            description: t.landing.featureScheduledDesc,
            icon: CalendarClock,
            gradient: "from-indigo-500 to-blue-600",
            bgGlow: "bg-indigo-500/10",
        },
        {
            title: t.landing.featureSmsTitle,
            description: t.landing.featureSmsDesc,
            icon: MessageSquare,
            gradient: "from-teal-500 to-emerald-500",
            bgGlow: "bg-teal-500/10",
        },
        {
            title: t.landing.featureDeliveryProofTitle,
            description: t.landing.featureDeliveryProofDesc,
            icon: ClipboardCheck,
            gradient: "from-sky-500 to-cyan-500",
            bgGlow: "bg-sky-500/10",
        },
    ];

    return (
        <section id="features" className="py-24 md:py-32 bg-white dark:bg-surface-950 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-[100px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6">
                        {t.landing.featuresTag}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-surface-900 dark:text-white">
                        {t.landing.featuresTitle}
                    </h2>
                    <p className="text-lg md:text-xl text-surface-600 dark:text-surface-400 leading-relaxed">
                        {t.landing.featuresDesc}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-surface-200 dark:hover:border-surface-700"
                        >
                            {/* Hover glow */}
                            <div className={`absolute inset-0 ${feature.bgGlow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-surface-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
