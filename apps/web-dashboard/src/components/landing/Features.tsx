"use client";

import { Store, Smartphone, Banknote, BarChart3, Globe, MessageSquare } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function Features() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "L'essentiel, sans le superflu",
            title: "Des outils pensés pour votre quotidien",
            description:
                "Kbouffe ne transforme pas votre restaurant en usine. Il élimine juste les frictions qui vous coûtent du temps et de l'argent.",
            features: [
                {
                    title: "Menu en ligne instantané",
                    description: "Publiez et modifiez vos plats sans attendre un développeur ni réimprimer des menus.",
                    icon: Store,
                    border: "border-orange-500/20",
                    glow: "group-hover:bg-orange-500/10",
                    iconGlow: "text-orange-400 bg-orange-500/10"
                },
                {
                    title: "Pilotage sur smartphone",
                    description: "Gérez les commandes et suivez votre service où que vous soyez.",
                    icon: Smartphone,
                    border: "border-blue-500/20",
                    glow: "group-hover:bg-blue-500/10",
                    iconGlow: "text-blue-400 bg-blue-500/10"
                },
                {
                    title: "MoMo automatique",
                    description: "Fini les captures d'écran. Les paiements mobiles sont liés directement aux commandes.",
                    icon: Banknote,
                    border: "border-emerald-500/20",
                    glow: "group-hover:bg-emerald-500/10",
                    iconGlow: "text-emerald-400 bg-emerald-500/10"
                },
                {
                    title: "Lien unique & QR Code",
                    description: "Un point d'entrée unique pour commander : table, comptoir ou WhatsApp.",
                    icon: Globe,
                    border: "border-amber-500/20",
                    glow: "group-hover:bg-amber-500/10",
                    iconGlow: "text-amber-400 bg-amber-500/10"
                },
                {
                    title: "Service fluide",
                    description: "La cuisine et le comptoir lisent exactement la même chose. Les erreurs disparaissent.",
                    icon: MessageSquare,
                    border: "border-purple-500/20",
                    glow: "group-hover:bg-purple-500/10",
                    iconGlow: "text-purple-400 bg-purple-500/10"
                },
                {
                    title: "Vue sur vos ventes",
                    description: "Sachez ce qui se vend, à quel moment, avec des rapports clairs et lisibles.",
                    icon: BarChart3,
                    border: "border-pink-500/20",
                    glow: "group-hover:bg-pink-500/10",
                    iconGlow: "text-pink-400 bg-pink-500/10"
                },
            ]
        }
        : {
            tag: "Only what matters",
            title: "Tools designed for your daily reality",
            description:
                "Kbouffe doesn't turn your business into a factory. It simply eliminates friction points that cost you time and money.",
            features: [
                {
                    title: "Instant online menu",
                    description: "Publish and tweak dishes without waiting for devs or reprinting paper menus.",
                    icon: Store,
                    border: "border-orange-500/20",
                    glow: "group-hover:bg-orange-500/10",
                    iconGlow: "text-orange-400 bg-orange-500/10"
                },
                {
                    title: "Smartphone control",
                    description: "Manage orders and track your service status from wherever you are.",
                    icon: Smartphone,
                    border: "border-blue-500/20",
                    glow: "group-hover:bg-blue-500/10",
                    iconGlow: "text-blue-400 bg-blue-500/10"
                },
                {
                    title: "Automated MoMo",
                    description: "No more screenshots in WhatsApp. Mobile payments are linked to orders.",
                    icon: Banknote,
                    border: "border-emerald-500/20",
                    glow: "group-hover:bg-emerald-500/10",
                    iconGlow: "text-emerald-400 bg-emerald-500/10"
                },
                {
                    title: "Single Link & QR",
                    description: "One entry point for your customers: on their table, the counter, or WhatsApp.",
                    icon: Globe,
                    border: "border-amber-500/20",
                    glow: "group-hover:bg-amber-500/10",
                    iconGlow: "text-amber-400 bg-amber-500/10"
                },
                {
                    title: "Smooth operations",
                    description: "The kitchen and the counter read the same exact screen. Mistakes vanish.",
                    icon: MessageSquare,
                    border: "border-purple-500/20",
                    glow: "group-hover:bg-purple-500/10",
                    iconGlow: "text-purple-400 bg-purple-500/10"
                },
                {
                    title: "Clear sales insights",
                    description: "Know exactly what sells and when, with clean, readable data dashboards.",
                    icon: BarChart3,
                    border: "border-pink-500/20",
                    glow: "group-hover:bg-pink-500/10",
                    iconGlow: "text-pink-400 bg-pink-500/10"
                },
            ]
        };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
    };

    return (
        <section id="features" className="py-24 md:py-32 bg-surface-950 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-surface-800 bg-surface-900/50 backdrop-blur-sm text-surface-300 text-sm font-medium mb-6"
                    >
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

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {copy.features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className={`group relative p-8 rounded-[2rem] bg-surface-900/40 backdrop-blur-sm border border-white/5 transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl overflow-hidden`}
                        >
                            {/* Hover subtle glow background */}
                            <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${feature.glow}`} />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${feature.iconGlow}`}>
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                
                                <h3 className="text-2xl font-bold mb-3 text-white transition-colors group-hover:text-brand-300">
                                    {feature.title}
                                </h3>
                                
                                <p className="text-surface-400 leading-relaxed text-lg mt-auto">
                                    {feature.description}
                                </p>
                            </div>
                            
                            {/* Top decorative gradient line */}
                            <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
