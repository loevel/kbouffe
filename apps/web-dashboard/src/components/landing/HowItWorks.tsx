"use client";

import Link from "next/link";
import Image from "next/image";
import { ClipboardEdit, Share2, UtensilsCrossed, ArrowRight, WalletCards, QrCode } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function HowItWorks() {
    const { locale } = useLocale();

    const copy = locale === "fr"
        ? {
            tag: "Simple comme 1-2-3",
            title: "Votre transition numérique en douceur",
            description:
                "Pas besoin de changer vos habitudes. Kbouffe s'intègre naturellement à votre façon de travailler avec vos clients.",
            cta: "Ouvrir mon espace restaurant",
            steps: [
                {
                    number: "01",
                    title: "Publiez votre menu",
                    description: "Créez une belle carte digitale en quelques minutes. Ajoutez vos plats, vos options et vos prix.",
                    icon: ClipboardEdit,
                    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
                    cards: [
                        { title: "Poisson braisé", meta: "6 500 FCFA" },
                        { title: "Poulet DG", meta: "5 500 FCFA" },
                    ],
                },
                {
                    number: "02",
                    title: "Partagez votre lien",
                    description: "Vos clients scannent le QR code sur la table ou cliquent sur votre lien WhatsApp pour commander.",
                    icon: Share2,
                    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=800&auto=format&fit=crop",
                    cards: [
                        { title: "Statut WhatsApp", meta: "Lien direct" },
                        { title: "QR code", meta: "Sur table" },
                    ],
                },
                {
                    number: "03",
                    title: "Servez et encaissez",
                    description: "Recevez les commandes claires en cuisine et les paiements MoMo confirmés automatiquement.",
                    icon: UtensilsCrossed,
                    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=800&auto=format&fit=crop",
                    cards: [
                        { title: "Paiement", meta: "MoMo automatique" },
                        { title: "Service", meta: "Zéro oubli" },
                    ],
                },
            ],
        }
        : {
            tag: "Simple as 1-2-3",
            title: "Your smooth digital transition",
            description:
                "No need to change your habits. Kbouffe naturally integrates into how you already work with your customers.",
            cta: "Open my restaurant account",
            steps: [
                {
                    number: "01",
                    title: "Publish your menu",
                    description: "Create a beautiful digital menu in minutes. Add your dishes, options, and prices.",
                    icon: ClipboardEdit,
                    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
                    cards: [
                        { title: "Grilled fish", meta: "6,500 FCFA" },
                        { title: "Poulet DG", meta: "5,500 FCFA" },
                    ],
                },
                {
                    number: "02",
                    title: "Share your link",
                    description: "Customers scan the QR code on the table or click your WhatsApp link to order.",
                    icon: Share2,
                    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=800&auto=format&fit=crop",
                    cards: [
                        { title: "WhatsApp Status", meta: "Direct link" },
                        { title: "QR code", meta: "On table" },
                    ],
                },
                {
                    number: "03",
                    title: "Serve and get paid",
                    description: "Receive clear orders in the kitchen and confirmed MoMo payments automatically.",
                    icon: UtensilsCrossed,
                    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=800&auto=format&fit=crop",
                    cards: [
                        { title: "Payment", meta: "Auto MoMo" },
                        { title: "Service", meta: "Zero mistakes" },
                    ],
                },
            ],
        };

    const steps = [
        {
            ...copy.steps[0],
            accent: "text-orange-400 bg-orange-500/10 border-orange-500/20",
            bullet: ClipboardEdit,
        },
        {
            ...copy.steps[1],
            accent: "text-sky-400 bg-sky-500/10 border-sky-500/20",
            bullet: QrCode,
        },
        {
            ...copy.steps[2],
            accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            bullet: WalletCards,
        },
    ];

    return (
        <section id="how-it-works" className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20 md:mb-24">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-300 text-sm font-semibold mb-6 backdrop-blur-sm"
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

                <div className="space-y-24 md:space-y-32">
                    {steps.map((step, index) => {
                        const isEven = index % 2 !== 0;
                        return (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className={`flex flex-col gap-10 lg:gap-16 ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}
                            >
                                {/* Image side */}
                                <div className="w-full lg:w-1/2 relative group">
                                    <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                                        <Image 
                                            src={step.image}
                                            alt={step.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent opacity-80" />
                                        
                                        {/* Floating Number */}
                                        <div className="absolute bottom-6 left-6 text-7xl font-bold text-white/20 select-none">
                                            {step.number}
                                        </div>
                                    </div>
                                    
                                    {/* Decorative blur behind image */}
                                    <div className={`absolute -inset-4 rounded-[3rem] blur-xl opacity-30 -z-10 ${step.accent.split(' ')[1]}`} />
                                </div>

                                {/* Content side */}
                                <div className="w-full lg:w-1/2 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border backdrop-blur-sm ${step.accent}`}>
                                            <step.icon className={`h-6 w-6 ${step.accent.split(' ')[0]}`} />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white">{step.title}</h3>
                                    </div>
                                    
                                    <p className="text-lg text-surface-300 leading-relaxed">
                                        {step.description}
                                    </p>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {step.cards.map((card) => (
                                            <div key={card.title} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${step.accent}`}>
                                                    <step.bullet size={18} className={step.accent.split(' ')[0]} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{card.title}</p>
                                                    <p className="text-xs text-surface-400 mt-0.5">{card.meta}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-24 md:mt-32"
                >
                    <Link
                        href="/register/restaurant"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-brand-500 text-white rounded-full text-lg font-semibold overflow-hidden transition-all shadow-lg hover:shadow-brand-500/40 hover:-translate-y-1"
                    >
                        <span className="relative z-10">{copy.cta}</span>
                        <ArrowRight size={20} className="relative z-10 transition-transform group-hover:translate-x-1" />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
