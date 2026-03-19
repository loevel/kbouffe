"use client";

import Image from "next/image";
import { Building2, Flame, GraduationCap, Sandwich, Store } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function MarketSegments() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Pour tous les formats",
            title: "Votre établissement passe à l'étape supérieure",
            description:
                "Kbouffe s'adapte à la façon dont vous travaillez déjà, avec un impact immédiat sur votre chiffre d'affaires mensuel.",
            segments: [
                {
                    icon: Store,
                    title: "Tourne-dos & Cafétérias",
                    pain: "Finies les pertes de commandes WhatsApp et les erreurs d'encaissement. Un seul lien, tout est clair.",
                    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: Flame,
                    title: "Braiseries & Snacks",
                    pain: "Le client scanne le QR code sur la table, passe sa commande et paie. Votre service devient magique.",
                    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: Sandwich,
                    title: "Fast-foods",
                    pain: "Partagez vos menus et recevez des commandes avec des options hyper précises et paiements automatisés.",
                    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: Building2,
                    title: "Restaurants classiques",
                    pain: "La gestion du rush de midi devient fluide. La cuisine et le bar suivent la même commande sur écran.",
                    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: GraduationCap,
                    title: "Cantines d'entreprises/écoles",
                    pain: "Gérez un volume énorme sans frictions. Retraits rapides via pré-commandes programmées.",
                    image: "https://images.unsplash.com/photo-1543353071-087092ec393a?q=80&w=800&auto=format&fit=crop"
                },
            ],
        }
        : {
            tag: "For every format",
            title: "Take your business to the next level",
            description:
                "Kbouffe adapts to how you already work, bringing an immediate positive impact to your monthly revenue.",
            segments: [
                {
                    icon: Store,
                    title: "Local Eateries",
                    pain: "No more lost WhatsApp orders. One link to share everywhere.",
                    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: Flame,
                    title: "Grills & Snacks",
                    pain: "Customers scan a QR code, order, and pay. Your service becomes magic.",
                    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: Sandwich,
                    title: "Fast-foods",
                    pain: "Share menus and receive orders with precise options and automated payments.",
                    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: Building2,
                    title: "Classic Restaurants",
                    pain: "Lunch rushes become smooth. Kitchen and bar track the same order on screen.",
                    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop"
                },
                {
                    icon: GraduationCap,
                    title: "School/Company Cafeterias",
                    pain: "Manage huge volumes without friction. Rapid pickups via scheduled pre-orders.",
                    image: "https://images.unsplash.com/photo-1543353071-087092ec393a?q=80&w=800&auto=format&fit=crop"
                },
            ],
        };

    // Stagger animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
    };

    return (
        <section className="relative overflow-hidden bg-surface-950 py-24 md:py-32">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            
            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-400"
                    >
                        {copy.tag}
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl mb-6"
                    >
                        {copy.title}
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg leading-relaxed text-surface-400 md:text-xl"
                    >
                        {copy.description}
                    </motion.p>
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8"
                >
                    {copy.segments.map((segment, index) => (
                        <motion.article
                            key={segment.title}
                            variants={itemVariants}
                            className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-surface-900 isolation-isolate ${index === 3 ? "md:col-span-2 lg:col-span-1" : ""} ${index === 4 ? "md:col-span-2" : ""}`}
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 z-0">
                                <Image 
                                    src={segment.image}
                                    alt={segment.title}
                                    fill
                                    className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full p-8 min-h-[320px] justify-end">
                                <div className="mb-auto">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-xl">
                                        <segment.icon size={24} />
                                    </div>
                                </div>
                                
                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
                                        {segment.title}
                                    </h3>
                                    <p className="text-sm font-medium leading-relaxed text-surface-200">
                                        {segment.pain}
                                    </p>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}