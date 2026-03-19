"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

export function Testimonials() {
    const { locale } = useLocale();
    const copy = locale === "fr"
        ? {
            tag: "Témoignages terrain",
            title: "Ils l'utilisent tous les jours",
            testimonials: [
                {
                    name: "Awa N.",
                    role: "Gérante de tourne-dos",
                    restaurant: "Mama Awa",
                    location: "Douala",
                    quote: "Mes clientes envoyaient des vocaux, puis rappelaient. Avec mon lien Kbouffe, elles voient le menu, paient en MoMo et je sers beaucoup plus vite à midi.",
                    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
                    rating: 5,
                    dishImg: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
                },
                {
                    name: "Lionel T.",
                    role: "Propriétaire",
                    restaurant: "Braise du Quartier",
                    location: "Yaoundé",
                    quote: "J'ai juste mis le QR code sur la table et le lien sur WhatsApp. Les habitués ont commencé à commander sans que je change ma façon de travailler.",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                    rating: 5,
                    dishImg: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
                },
                {
                    name: "Clarisse M.",
                    role: "Gérante cantine",
                    restaurant: "Campus Express",
                    location: "Ngoa-Ekellé",
                    quote: "Le plus fort, c'est la clarté. Je sais quelles commandes sont payées ou en attente et je ne perds plus mes pics de demande.",
                    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&q=80",
                    rating: 5,
                    dishImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
                },
            ],
        }
        : {
            tag: "Field testimonials",
            title: "They use it every single day",
            testimonials: [
                {
                    name: "Awa N.",
                    role: "Local eatery owner",
                    restaurant: "Mama Awa",
                    location: "Douala",
                    quote: "Customers sent voice notes, then called to confirm. Now they see the menu, pay by MoMo, and I serve faster at lunch.",
                    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
                    rating: 5,
                    dishImg: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
                },
                {
                    name: "Lionel T.",
                    role: "Grill owner",
                    restaurant: "Braise du Quartier",
                    location: "Yaounde",
                    quote: "I only added the QR code on the table and the link in WhatsApp. Regular customers started ordering without friction.",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                    rating: 5,
                    dishImg: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
                },
                {
                    name: "Clarisse M.",
                    role: "Cafeteria manager",
                    restaurant: "Campus Express",
                    location: "Ngoa-Ekelle",
                    quote: "The biggest win is clarity. I know which orders are paid, which are pending, and I no longer lose my demand peaks.",
                    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&q=80",
                    rating: 5,
                    dishImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
                },
            ],
        };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } }
    };

    return (
        <section className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-surface-800 bg-surface-900/50 backdrop-blur-sm text-brand-300 text-sm font-medium mb-6"
                    >
                        {copy.tag}
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
                    >
                        {copy.title}
                    </motion.h2>
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {copy.testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="relative bg-surface-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-2 group flex flex-col"
                        >
                            <div className="relative h-32 overflow-hidden">
                                <Image
                                    src={testimonial.dishImg}
                                    alt={testimonial.restaurant}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-900/40 to-surface-900/90" />
                                <div className="absolute bottom-4 left-6 text-xs text-white/80 font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                    {testimonial.restaurant} · {testimonial.location}
                                </div>
                            </div>

                            <div className="p-8 pt-6 flex flex-col flex-1">
                                <Quote className="h-8 w-8 text-brand-500/30 mb-5 transition-colors group-hover:text-brand-500/60" />

                                <div className="flex gap-1 mb-5">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} size={16} className="text-amber-400" fill="currentColor" />
                                    ))}
                                </div>

                                <p className="text-surface-300 leading-relaxed mb-8 text-lg font-medium flex-1">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>

                                <div className="flex items-center gap-4 mt-auto">
                                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-surface-700/50 shrink-0 group-hover:border-brand-500/50 transition-colors">
                                        <Image
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-base">{testimonial.name}</div>
                                        <div className="text-surface-400 text-sm mt-0.5">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
