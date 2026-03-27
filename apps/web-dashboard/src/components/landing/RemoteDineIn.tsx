"use client";

import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";
import { MapPin, Share2, CreditCard, UtensilsCrossed } from "lucide-react";

export function RemoteDineIn() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Commande à distance",
            title: "Installez-vous, vos proches régalent",
            description:
                "Une expérience inédite : asseyez-vous à une table, donnez votre numéro de table à un proche resté à la maison, et laissez-le commander et payer pour vous. Vous êtes servi sur place, sans rien faire.",
            steps: [
                {
                    title: "Prenez place",
                    description: "Installez-vous confortablement au restaurant et repérez votre numéro de table.",
                    icon: MapPin,
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                },
                {
                    title: "Partagez l'info",
                    description: "Donnez votre numéro de table au proche qui souhaite vous inviter.",
                    icon: Share2,
                    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                },
                {
                    title: "Ils commandent",
                    description: "Depuis chez eux, ils accèdent au menu, choisissent vos plats et paient en ligne.",
                    icon: CreditCard,
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                },
                {
                    title: "Savourez",
                    description: "La commande est validée, vous êtes servi directement à votre table. Bon appétit !",
                    icon: UtensilsCrossed,
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                },
            ]
        }
        : {
            tag: "Remote Dine-in",
            title: "Take a seat, your loved ones treat you",
            description:
                "A unique experience: sit at a table, share your table number with someone at home, and let them order and pay for your meal remotely. You get served on-site, hassle-free.",
            steps: [
                {
                    title: "Take a seat",
                    description: "Sit comfortably in the restaurant and find your table number.",
                    icon: MapPin,
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                },
                {
                    title: "Share",
                    description: "Send your table number to the friend or family member treating you.",
                    icon: Share2,
                    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                },
                {
                    title: "They order",
                    description: "From their home, they access the menu, pick your dishes, and pay online.",
                    icon: CreditCard,
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                },
                {
                    title: "Enjoy",
                    description: "The order is confirmed and prepared. You are served at your table. Enjoy!",
                    icon: UtensilsCrossed,
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                },
            ]
        };

    return (
        <section className="py-24 md:py-32 bg-surface-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] -translate-y-1/2 rounded-full bg-brand-500/5 blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Left: Text Content */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-surface-800 bg-surface-800/50 backdrop-blur-sm text-surface-300 text-sm font-medium mb-6"
                        >
                            {copy.tag}
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white"
                        >
                            {copy.title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-xl text-surface-400 leading-relaxed mb-10"
                        >
                            {copy.description}
                        </motion.p>
                    </div>

                    {/* Right: Step Cards */}
                    <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {copy.steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative p-6 rounded-[2rem] bg-surface-950/50 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${step.color}`}>
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-surface-400 leading-relaxed">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
